import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { prisma } from "../helpers/prisma.client";
import { compare, hash } from "bcrypt";

// Tipo base para todas as respostas
const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.String(),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const authController = new Elysia({}).group("/auth", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .post(
      "/login",
      async ({ body, jwt, set }) => {
        const { email, password } = body;
        const user = await prisma.user.findFirst({ where: { email } });

        if (!user) {
          set.status = 404;
          return {
            ok: false,
            toast: "Usuário não encontrado",
            error: "Usuário não encontrado",
            data: null,
          };
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          set.status = 400;
          return {
            ok: false,
            toast: "Senha inválida",
            error: "Senha inválida",
            data: null,
          };
        }

        const token = await jwt.sign({ id: user.id });
        console.log({ token, verify: await jwt.verify(token) });

        return {
          ok: true,
          toast: "Login efetuado com sucesso!",
          error: null,
          data: { token },
        };
      },
      {
        body: t.Object({ email: t.String(), password: t.String() }),
        detail: { tags: ["Auth"], description: "Login to the system" },
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
        const { email, password, username } = body;
        const alreadyExists = await prisma.user.findFirst({ where: { email } });

        if (alreadyExists) {
          set.status = 400;
          return {
            ok: false,
            toast: "O usuário já existe!",
            error: "O usuário já existe!",
            data: null,
          };
        }

        const hashed = await hash(password, 10);
        const user = await prisma.user.create({
          data: { email, password: hashed, username },
        });

        const token = await jwt.sign({ id: user.id });
        return {
          ok: true,
          toast: "Usuário criado com sucesso!",
          error: null,
          data: { token },
        };
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          username: t.String(),
        }),
        detail: { tags: ["Auth"] },
        response: {
          200: baseResponse,
          400: baseResponse,
        },
      }
    )
    .post("/guest", async ({ body, jwt }) => {
      let count = await prisma.user.count({
        where: { username: { startsWith: "Convidado" } },
      });
      let name = `Convidado ${Math.floor(Math.random() * 1000 + count)}`;
      while (true) {
        const user = await prisma.user.findFirst({ where: { username: name } });
        if (!user) break;
        name = `Convidado ${Math.floor(Math.random() * 1000 + count)}`;
      }
      const newUser = await prisma.user.create({
        data: {
          username: name,
          email: `${name.replace(" ", "").toLowerCase()}@simtcg.com`,
          password: await hash((Math.random() * 100_000_000).toFixed(6), 10),
        },
        select: { id: true },
      });
      const token = await jwt.sign({ id: newUser.id });
      return {
        ok: true,
        toast: "Usuário convidado criado com sucesso!",
        error: null,
        data: { token },
      };
    });
});
