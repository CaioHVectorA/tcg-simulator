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

        const token = await jwt.sign({ id: user.id });
        console.log({ token, verify: await jwt.verify(token) });

        return sucessResponse({ token }, "Login efetuado com sucesso!");
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
        const { email, password, username, withBonus, referrer } = body;
        const alreadyExists = await prisma.user.findFirst({ where: { email } });
        if (alreadyExists) {
          set.status = 400;
          return errorResponse("O usuário já existe!", "O usuário já existe!");
        }
        let referralId = undefined;
        if (referrer) {
          const referralProtocol = await prisma.referrerProtocol.findFirst({
            where: { hash: referrer },
          });
          if (!referralProtocol) {
            set.status = 400;
            return errorResponse(
              "Protocolo de referência inválido",
              "Protocolo de referência inválido"
            );
          }

          referralId = referralProtocol.id;
        }
        let initialMoney = 500;
        if (referrer) initialMoney += 3000;
        if (withBonus) initialMoney += 3000;
        const hashed = await hash(password, 10);
        const money = initialMoney;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const user = await prisma.user.create({
          data: {
            email,
            password: hashed,
            username,
            money,
            last_daily_bounty: yesterday,
            fromReferralId: referralId,
          },
        });
        if (referralId) {
          await prisma.referred.create({
            data: {
              referrerProtocolId: referralId,
              referredId: user.id,
            },
          });
        }
        const token = await jwt.sign({ id: user.id });
        return sucessResponse({ token }, "Usuário criado com sucesso!");
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          username: t.String(),
          withBonus: t.Optional(t.Boolean()),
          referrer: t.Optional(t.String()),
        }),
        detail: { tags: ["Auth"] },
        response: {
          200: baseResponse,
          400: baseResponse,
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

        let finalName = "";
        if (nickname && nickname.trim().length >= 2) {
          const clean = nickname.trim();
          const existing = await prisma.user.findFirst({
            where: { username: clean },
          });
          if (existing) {
            finalName = `${clean}_${Math.floor(Math.random() * 900 + 100)}`;
          } else {
            finalName = clean;
          }
        } else {
          let count = await prisma.user.count({
            where: { username: { startsWith: "Treinador" } },
          });
          finalName = `Treinador_${Math.floor(Math.random() * 1000 + count + 1)}`;
          while (true) {
            const user = await prisma.user.findFirst({
              where: { username: finalName },
            });
            if (!user) break;
            finalName = `Treinador_${Math.floor(Math.random() * 9000 + 1000)}`;
          }
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const randomPass = await hash((Math.random() * 100_000_000).toFixed(6), 10);
        const emailSlug = finalName.toLowerCase().replace(/[^a-z0-9]/g, "");

        const newUser = await prisma.user.create({
          data: {
            username: finalName,
            email: `${emailSlug}_${Date.now()}@guest.simtcg.com`,
            password: randomPass,
            isGuest: true,
            authProvider: "guest",
            picture: picture || "/wallpaper.jpg",
            last_daily_bounty: yesterday,
          },
          select: { id: true, username: true, isGuest: true },
        });

        if (referrer) {
          const referralProtocol = await prisma.referrerProtocol.findFirst({
            where: { hash: referrer },
          });
          if (referralProtocol) {
            await prisma.referred.create({
              data: {
                referrerProtocolId: referralProtocol.id,
                referredId: newUser.id,
              },
            });
          }
        }

        const token = await jwt.sign({ id: newUser.id });
        return sucessResponse(
          { token, user: newUser },
          `Bem-vindo(a), ${newUser.username}! Modo Convidado iniciado.`
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

        const newToken = await jwt.sign({ id: user.id });

        return sucessResponse(
          { user: updatedUser, token: newToken },
          "Parabéns! Sua conta foi aprimorada com sucesso. Todas as suas cartas e moedas foram preservadas!"
        );
      },
      {
        body: t.Object({
          email: t.String(),
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
    .post(
      "/google",
      async ({ body, jwt }) => {
        const { name, image, email, referrer } = body;
        const user = await prisma.user.findFirst({ where: { email } });
        if (user) {
          if (user.authProvider !== "google") {
            return errorResponse("Usuário já existe", "Usuário já existe");
          }
          const token = await jwt.sign({ id: user.id });
          return sucessResponse({ token });
        }
        const newUser = await prisma.user.create({
          data: {
            email,
            username: name,
            picture: image,
            authProvider: "google",
            isGuest: false,
            password: await hash((Math.random() * 100_000_000).toFixed(6), 10),
          },
          select: { id: true },
        });
        console.log({ referrer });
        if (referrer) {
          const referralProtocol = await prisma.referrerProtocol.findFirst({
            where: { hash: referrer },
          });
          if (referralProtocol) {
            await prisma.referred.create({
              data: {
                referrerProtocolId: referralProtocol.id,
                referredId: newUser.id,
              },
            });
          }
        }
        const token = await jwt.sign({ id: newUser.id });
        return sucessResponse({ token });
      },
      {
        body: t.Object({
          name: t.String(),
          image: t.String(),
          referrer: t.Nullable(t.String()),
          email: t.String(),
        }),
        response: {
          // 200: baseResponse,
          // 400: baseResponse,
        },
      }
    );
});
