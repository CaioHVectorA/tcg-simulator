import { jwt as _jwt } from "@elysiajs/jwt";

export const jwt = _jwt({ name: "jwt", secret: process.env.SECRET_JWT || "secret" })