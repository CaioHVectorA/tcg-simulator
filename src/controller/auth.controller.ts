import { PasswordService } from "../services/password.service";
import { getLocaleFromHeaders } from "../i18n";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { DomainError } from "../lib/domain-error";
import { verifyGoogleIdentity } from "../lib/google-identity";
import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { receiveUser } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { compare, hash } from "bcrypt";
import { errorResponse, sucessResponse } from "../lib/mount-response";

// Tipo base para todas as respostas
const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

async function createTrainer(data: Prisma.UserCreateInput, referrer?: string | null) {
  return prisma.$transaction(async (tx) => {
    const protocol = referrer ? await tx.referrerProtocol.findUnique({ where: { hash: referrer } }) : null;
    if (referrer && !protocol) throw new DomainError("auth.invalidReferral");
    const [pack, quests] = await Promise.all([
      tx.package.findFirst({ where: { OR: ["simples", "básico", "basico"].map((name) => ({ name: { contains: name, mode: "insensitive" as const } })) }, orderBy: { price: "asc" } }),
      tx.quest.findMany({ where: { isDiary: false }, select: { id: true } }),
    ]);
    if (!pack) throw new DomainError("auth.onboardingUnavailable", 503);
    const user = await tx.user.create({ data, select: { id: true, username: true, isGuest: true, authVersion: true } });
    await tx.packages_User.createMany({ data: Array.from({ length: 5 }, () => ({ userId: user.id, packageId: pack.id })) });
    if (quests.length) await tx.questUser.createMany({ data: quests.map((q) => ({ user_id: user.id, quest_id: q.id })), skipDuplicates: true });
    if (protocol) await tx.referred.create({ data: { referrerProtocolId: protocol.id, referredId: user.id } });
    return user;
  });
}

export const authController = new Elysia({}).group("/auth", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .post(
      "/login",
      async ({ body, jwt, set }) => {
        const { password } = body;
        const identifier = (body.username || body.email || "").trim();

        if (!identifier) {
          set.status = 400;
          return errorResponse(
            "Informe seu nome de usuário ou e-mail",
            "Informe seu nome de usuário ou e-mail"
          );
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { username: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });

        if (!user) {
          set.status = 404;
          return errorResponse(
            "Usuário não encontrado",
            "Usuário não encontrado"
          );
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          set.status = 400;
          return errorResponse("Senha inválida", "Senha inválida");
        }

        const token = await jwt.sign({ id: user.id, version: user.authVersion });

        return sucessResponse({ token }, "Login efetuado com sucesso!");
      },
      {
        body: t.Object({
          email: t.Optional(t.String()),
          username: t.Optional(t.String()),
          password: t.String({ minLength: 6, maxLength: 128 }),
        }),
        detail: { tags: ["Auth"], description: "Login to the system with email or username" },
        response: {
          200: baseResponse,
          400: baseResponse,
          404: baseResponse,
        },
      }
    )
    .post(
      "/register",
      async ({ body, jwt, set }) => {
        const { password, referrer } = body;
        const email = body.email.trim().toLowerCase();
        const username = body.username.trim();
        const alreadyExists = await prisma.user.findFirst({ where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { username: { equals: username, mode: "insensitive" } }] } });
        if (alreadyExists) {
          set.status = 409;
          return errorResponse("auth.accountExists", "auth.accountExists");
        }
        const user = await createTrainer({ email, username, password: await hash(password, 10), money: 500, last_daily_bounty: null }, referrer);
        const token = await jwt.sign({ id: user.id, version: user.authVersion });
        return sucessResponse({ token }, "Usuário criado com sucesso!");
      },
      {
        body: t.Object({
          email: t.String({ format: "email", maxLength: 254 }),
          password: t.String({ minLength: 6, maxLength: 128 }),
          username: t.String({ minLength: 3, maxLength: 30 }),
          withBonus: t.Optional(t.Boolean()),
          referrer: t.Optional(t.String()),
        }),
        detail: { tags: ["Auth"] },
        response: {
          200: baseResponse,
          400: baseResponse,
          409: baseResponse,
        },
      }
    )
    .post(
      "/guest",
      async ({ body, jwt }) => {
        const { referrer, nickname, picture } = body as {
          referrer?: string | null;
          nickname?: string;
          picture?: string;
        };

        const suffix = randomUUID().slice(0, 8);
        const finalName = `${nickname?.trim() || "Trainer"}_${suffix}`;
        const newUser = await createTrainer({
          username: finalName, email: `${randomUUID()}@guest.simtcg.com`,
          password: await hash(randomUUID(), 10), isGuest: true, authProvider: "guest",
          picture: picture || "/wallpaper.jpg", last_daily_bounty: null,
        }, referrer);
        const token = await jwt.sign({ id: newUser.id, version: newUser.authVersion });
        return sucessResponse(
          { token, user: { id: newUser.id, username: newUser.username, isGuest: newUser.isGuest } },
          "auth.guestCreated"
        );
      },
      {
        body: t.Object({
          referrer: t.Optional(t.Nullable(t.String())),
          nickname: t.Optional(t.String({ minLength: 2, maxLength: 30 })),
          picture: t.Optional(t.String()),
        }),
        response: {
          200: baseResponse,
        },
      }
    )
    .post(
      "/upgrade-guest",
      async ({ headers, set, jwt, body }) => {
        const auth = headers["authorization"];
        if (!auth || !auth.includes("Bearer")) {
          set.status = 401;
          return errorResponse("Não autenticado", "Faça login antes de aprimorar sua conta.");
        }
        const token = auth.replace("Bearer ", "");
        const user = await receiveUser(token, jwt as any);
        if (!user) {
          set.status = 401;
          return errorResponse("Usuário não encontrado", "Sessão expirada.");
        }
        if (!user.isGuest) {
          set.status = 400;
          return errorResponse("Conta já permanente", "Esta conta já é permanente e registrada.");
        }

        const { email, password, username } = body;
        const cleanEmail = email.trim().toLowerCase();

        // Verificar se email já existe
        const existingEmail = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: user.id } },
        });
        if (existingEmail) {
          set.status = 400;
          return errorResponse("Email já cadastrado", "Este email já pertence a outro treinador.");
        }

        let newUsername = user.username;
        if (username && username.trim().length >= 3) {
          const cleanName = username.trim();
          const existingName = await prisma.user.findFirst({
            where: { username: cleanName, id: { not: user.id } },
          });
          if (existingName) {
            set.status = 400;
            return errorResponse("Nome já em uso", "Este nome de treinador já está em uso.");
          }
          newUsername = cleanName;
        }

        const hashedPassword = await hash(password, 10);

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: cleanEmail,
            password: hashedPassword,
            username: newUsername,
            isGuest: false,
            authProvider: "email",
          },
          select: {
            id: true,
            email: true,
            username: true,
            picture: true,
            money: true,
            isGuest: true,
          },
        });

        const newToken = await jwt.sign({ id: user.id, version: user.authVersion });

        return sucessResponse(
          { user: updatedUser, token: newToken },
          "Parabéns! Sua conta foi aprimorada com sucesso. Todas as suas cartas e moedas foram preservadas!"
        );
      },
      {
        body: t.Object({
          email: t.String({ format: "email", maxLength: 254 }),
          password: t.String({ minLength: 6 }),
          username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
        }),
        detail: { tags: ["Auth"], description: "Aprimora conta de convidado para permanente sem perda de dados" },
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
      }
    )
    .post("/password/forgot", async ({ body, headers, set }) => {
      await PasswordService.request(body.email, getLocaleFromHeaders(headers));
      set.status = 202;
      return sucessResponse(null, "auth.resetRequested", getLocaleFromHeaders(headers));
    }, { body: t.Object({ email: t.String({ format: "email", maxLength: 254 }) }) })
    .post("/password/reset", async ({ body, headers }) => {
      await PasswordService.reset(body.token, body.password);
      return sucessResponse(null, "auth.passwordReset", getLocaleFromHeaders(headers));
    }, { body: t.Object({ token: t.String({ pattern: "^[a-f0-9]{64}$" }), password: t.String({ minLength: 8, maxLength: 128 }) }) })
    .post(
      "/google",
      async ({ body, jwt, set }) => {
        const identity = await verifyGoogleIdentity(body.idToken);
        let user = await prisma.user.findFirst({ where: { OR: [{ googleSubject: identity.subject }, { email: { equals: identity.email, mode: "insensitive" } }] } });
        if (user && (user.authProvider !== "google" || (user.googleSubject && user.googleSubject !== identity.subject))) {
          set.status = 409;
          return errorResponse("auth.accountExists", "auth.accountExists");
        }
        if (user && !user.googleSubject) {
          user = await prisma.user.update({ where: { id: user.id }, data: { googleSubject: identity.subject } });
        }
        const userId = user?.id ?? (await createTrainer({
          email: identity.email, username: `${identity.name.slice(0, 20)}_${randomUUID().slice(0, 8)}`,
          picture: identity.picture, authProvider: "google", googleSubject: identity.subject,
          password: await hash(randomUUID(), 10),
        }, body.referrer)).id;
        const saved = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { authVersion: true } });
        return sucessResponse({ token: await jwt.sign({ id: userId, version: saved.authVersion }) });
      },
      {
        body: t.Object({
          idToken: t.String({ minLength: 20, maxLength: 8192 }),
          referrer: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
        }),
        response: { 200: baseResponse, 400: baseResponse, 401: baseResponse, 409: baseResponse, 503: baseResponse },
      }
    );
});
