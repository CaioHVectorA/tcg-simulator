import { Elysia, t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor } from "../middlewares/jwt";

export const userController = new Elysia({}).group("/user", (app) => {
  return app
    .use(jwt)
    .derive(getUserInterceptor)
    .decorate("prisma", prisma)
    .get("/me", async ({ user }) => {
      return user;
    }, { detail: { tags: ["User"] } })
    .get(
      "/friends",
      async ({ user, prisma, query }) => {
        const { search } = query;
        if (!user) return { body: { error: "Unauthorized" } };
        const friends = await prisma.user.findMany({
          where: {
            friendships: { some: { user_id: user.id } },
            username: { contains: search || "" },
          },
        });
        return friends;
      },
      { query: t.Object({ search: t.Optional(t.String()) }), detail: { tags: ["User"] } }
    )
    .get("/requests", async ({ user, prisma }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const requests = await prisma.friend_User.findMany({
        where: { user_id: user.id, accepted: false },
      });
      return requests;
    }, { detail: { tags: ["User"] } })
    .get("/requests/sent", async ({ user, prisma }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const requests = await prisma.friend_User.findMany({
        where: { friend_id: user.id, accepted: false },
      });
      return requests;
    }, { detail: { tags: ["User"] } })
    .post("send/:id", async ({ user, prisma, params }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { id } = params;
      if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
      const friend = await prisma.user.findFirst({ where: { id: Number(id) } });
      if (!friend) return { body: { error: "User not found" } };
      await prisma.friend_User.create({
        data: { user_id: user.id, friend_id: friend.id },
      });
      return { message: "Friend request sent" };
    }, { detail: { tags: ["User"] } })
    .post("accept/:id", async ({ user, prisma, params }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { id } = params;
      if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
      const request = await prisma.friend_User.findFirst({
        where: { user_id: Number(id), friend_id: user.id },
      });
      if (!request) return { body: { error: "Request not found" } };
      await prisma.friend_User.update({
        where: { id: request.id },
        data: { accepted: true },
      });
      return { message: "Friend request accepted" };
    }, { detail: { tags: ["User"] } })
    .post("reject/:id", async ({ user, prisma, params }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { id } = params;
      if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
      const request = await prisma.friend_User.findFirst({
        where: { user_id: Number(id), friend_id: user.id },
      });
      if (!request) return { body: { error: "Request not found" } };
      await prisma.friend_User.delete({ where: { id: request.id } });
      return { message: "Friend request rejected" };
    }, { detail: { tags: ["User"] } })
    .delete("/remove-sent/:id", async ({ user, prisma, params }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { id } = params;
      if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
      const request = await prisma.friend_User.findFirst({
        where: { friend_id: Number(id), user_id: user.id },
      });
      if (!request) return { body: { error: "Request not found" } };
      await prisma.friend_User.delete({ where: { id: request.id } });
      return { message: "Friend request removed" };
    }, { detail: { tags: ["User"] } })
    .delete("/remove/:id", async ({ user, prisma, params }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { id } = params;
      if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
      const request = await prisma.friend_User.findFirst({
        where: { user_id: Number(id), friend_id: user.id },
      });
      if (!request) return { body: { error: "Request not found" } };
      await prisma.friend_User.delete({ where: { id: request.id } });
      return { message: "Friend removed" };
    });
});
