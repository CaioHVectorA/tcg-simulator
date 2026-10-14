import { jwt as _jwt } from "@elysiajs/jwt";
import { randomBytes } from "node:crypto";
const secret = process.env.SECRET_JWT;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("SECRET_JWT must contain at least 32 characters in production");
}
export const jwt = _jwt({ name: "jwt", secret: secret || randomBytes(32).toString("hex"), exp: "7d" });
