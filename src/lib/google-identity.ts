import { OAuth2Client } from "google-auth-library";
import { DomainError } from "./domain-error";
const client = new OAuth2Client();
export async function verifyGoogleIdentity(idToken: string) {
  const audience = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  if (!audience) throw new DomainError("auth.googleUnavailable", 503);
  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error("Unverified identity");
    }
    return {
      subject: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name || "Trainer",
      picture: payload.picture || "/wallpaper.jpg",
    };
  } catch {
    throw new DomainError("auth.invalidCredentials", 401);
  }
}
