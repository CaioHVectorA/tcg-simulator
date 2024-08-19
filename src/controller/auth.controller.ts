import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { prisma } from "../helpers/prisma.client";
import { compare, hash } from "bcrypt";

export const authController = new Elysia({}).group("/auth", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .post(
      "/login",
      async ({ body, jwt }) => {
        const { email, password } = body;
        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) return { status: 404, body: { error: "User not found" } };
        const isValid = await compare(password, user.password);
        if (!isValid)
          return { status: 400, body: { error: "Invalid password" } };
        const token = await jwt.sign({ id: user.id });
        console.log({ token, verify: await jwt.verify(token) });
        return { body: { token } };
      },
      {
        body: t.Object({ email: t.String(), password: t.String() }),
        detail: { tags: ["Auth"] },
      }
    )
    .post(
      "/register",
      async ({ body, jwt }) => {
        const { email, password, username } = body;
        const alreadyExists = await prisma.user.findFirst({ where: { email } });
        const hashed = await hash(password, 10);
        if (alreadyExists)
          return { status: 400, body: { error: "User already exists" } };
        const user = await prisma.user.create({
          data: { email, password: hashed, username },
        });
        const token = await jwt.sign({ id: user.id });
        return { body: { token } };
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          username: t.String(),
        }),
        detail: { tags: ["Auth"] },
      }
    );
});
