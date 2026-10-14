import { wsManager } from "../lib/ws-manager";
import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcrypt";
import { prisma } from "../helpers/prisma.client";
import { DomainError } from "../lib/domain-error";
import { lockUsers } from "../lib/economy";
import { translate, type BackendLocale } from "../i18n";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export class PasswordService {
  static async request(email: string, locale: BackendLocale = "pt") {
    const from = process.env.EMAIL_FROM;
    const key = process.env.RESEND_KEY;
    const site = process.env.WEB_URL || process.env.CLIENT_URL?.split(",")[0];
    if (!from || !key || !site || (process.env.NODE_ENV === "production" && !site.startsWith("https://"))) throw new DomainError("auth.emailUnavailable", 503);
    const user = await prisma.user.findFirst({ where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" }, isGuest: false } });
    if (!user) return;
    const token = randomBytes(32).toString("hex");
    const tokenHash = digest(token);
    await prisma.$transaction(async (tx) => {
      await lockUsers(tx, [user.id]);
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 900_000) } });
    });
    const url = new URL('/recuperar-senha', site);
    url.searchParams.set('token', token);url.searchParams.set('lang', locale);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': tokenHash },
        body: JSON.stringify({ from, to: [user.email], subject: translate('auth.resetEmailSubject', locale), text: `${translate('auth.resetEmailBody', locale)}\n\n${url.toString()}` }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Email provider rejected request');
    } catch {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash, userId: user.id } });
      throw new DomainError('auth.emailUnavailable', 503);
    }
  }
  static async reset(token: string, password: string) {
    if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 128) throw new DomainError('auth.resetInvalid');
    const tokenHash = digest(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) throw new DomainError('auth.resetInvalid');
    const passwordHash = await hash(password, 10);
    await prisma.$transaction(async (tx) => {
      await lockUsers(tx, [record.userId]);
      const consumed = await tx.passwordResetToken.updateMany({ where: { tokenHash, userId: record.userId, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (consumed.count !== 1) throw new DomainError('auth.resetInvalid');
      await tx.user.update({ where: { id: record.userId }, data: { password: passwordHash, authVersion: { increment: 1 } } });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, tokenHash: { not: tokenHash } } });
    });
    wsManager.disconnectUser(record.userId);
  }
}
