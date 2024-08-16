import type { User } from "@prisma/client";
import { prisma } from "../../helpers/prisma.client";
import * as jwt from "@elysiajs/jwt";
//elysiajs/jwt
type jwtDecorator = {
    readonly sign: (morePayload: Record<string, string | number> & jwt.JWTPayloadSpec) => Promise<string>;
    readonly verify: (jwt?: string) => Promise<false | (Record<string, string | number> & jwt.JWTPayloadSpec)>;
}
export async function receiveUser(token: string, jwt: jwtDecorator): Promise<User> {
    const data = await jwt.verify(token);
    if (!data) throw new Error("Invalid token");
    const { id } = data as { id: number };
    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) throw new Error("User not found");
    return user;
}
export { jwt };