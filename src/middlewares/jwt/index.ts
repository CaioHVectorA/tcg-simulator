import type { User } from "@prisma/client";
import { prisma } from "../../helpers/prisma.client";
import * as jwt from "@elysiajs/jwt";
import { errorResponse } from "../../lib/mount-response";
import { AUTH_ERROR } from "../../helpers/const";
//elysiajs/jwt
type jwtDecorator = {
  readonly sign: (
    morePayload: Record<string, string | number> & jwt.JWTPayloadSpec
  ) => Promise<string>;
  readonly verify: (
    jwt?: string
  ) => Promise<false | (Record<string, string | number> & jwt.JWTPayloadSpec)>;
};
export async function receiveUser(
  token: string,
  jwt: jwtDecorator
): Promise<User> {
  const data = await jwt.verify(token);
  if (!data) throw new Error(AUTH_ERROR);
  const { id } = data as { id: number };
  const user = await prisma.user.findFirst({ where: { id } });
  if (!user) throw new Error(AUTH_ERROR);
  return user;
}
//@ts-ignore
export const getUserInterceptor = async ({ headers, set, jwt }) => {
  const auth = headers["authorization"];
  if (!auth || !auth.includes("Bearer")) {
    set.status = 401;
    return { user: null };
  }
  const user = await receiveUser(auth.replace("Bearer ", ""), jwt);
  return {
    user,
  };
};

export const getUserUserMiddleware = async (ctx: {
  headers: Record<string, string>;
  set: Record<string, any>;
  jwt: jwtDecorator;
  user: User;
}) => {
  const auth = ctx.headers["authorization"];
  if (!auth || !auth.includes("Bearer")) {
    ctx.set.status = 401;
    return errorResponse(
      "Usuário não autenticado!",
      "Usuário não autenticado!"
    );
  }
  const user = await receiveUser(auth.replace("Bearer ", ""), ctx.jwt);
  ctx["user"] = user;
};
