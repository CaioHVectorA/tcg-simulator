import { Elysia, t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, receiveUser } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { OpenPackage } from "../lib/open-package";
import type { Card, Package } from "@prisma/client";

export const packageController = new Elysia({}).group("/packages", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .derive(getUserInterceptor)
    .get("/", async ({ jwt, headers, user, prisma }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      // const packages = await prisma.package.findMany({ where: { Packages_User: { none: { userId: user.id,  } } }, select: { name: true, image_url: true, id: true } })
      const ids = await prisma.packages_User.findMany({
        where: { userId: user.id },
        select: { packageId: true },
      });
      // i want duplicates packages
      const packages = [] as {
        name: string;
        image_url: string;
        id: number;
        quantity: number;
      }[];
      for (const id of ids) {
        const package_ = await prisma.package.findFirst({
          where: { id: id.packageId },
          select: { name: true, image_url: true, id: true },
        });
        if (!package_) continue;
        if (packages.some((p) => p.id === package_.id)) {
          const index = packages.findIndex((p) => p.id === package_.id);
          packages[index].quantity++;
          continue;
        }
        packages.push({ ...package_, quantity: 1 });
      }
      return packages;
    }, { detail: { tags: ["Package"] } })
    .post(
      "/buy",
      async ({ body, user, prisma, set }) => {
        if (!user) return { body: { error: "Unauthorized" } };
        const { packageId } = body;
        if (packageId > 7 || packageId < 1) {
          set.status = 400;
          return { message: { error: "Invalid package id" } };
        }
        const package_ = await prisma.package.findFirst({
          where: { id: packageId },
        });
        if (!package_) return { body: { error: "Package not found" } };
        if (user.money < package_.price) {
          set.status = 400;
          return { message: { error: "Not enough money" } };
        }
        const userPackage = await prisma.packages_User.create({
          data: {
            userId: user.id,
            packageId: packageId,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            money: user.money - package_.price,
          },
        });
        return { message: "Comprado com sucesso!" };
      },
      { body: t.Object({ packageId: t.Number() }), detail: { tags: ["Package"] } }
    )
    .post(
      "/buy-many",
      async ({ user, prisma, body, set }) => {
        if (!user) return { body: { error: "Unauthorized" } };
        const { packagesId } = body;
        if (packagesId.some((id) => id > 7 || id < 1)) {
          set.status = 400;
          return { message: { error: "Invalid package id" } };
        }
        const quantities = {} as Record<number, number>;
        packagesId.forEach((id) => {
          quantities[id] = (quantities[id] || 0) + 1;
        });
        const packages = await prisma.package.findMany({
          where: { id: { in: packagesId } },
        });
        const total = packages.reduce((acc, curr) => acc + curr.price, 0);
        if (user.money < total) {
          set.status = 400;
          return { message: { error: "Not enough money" } };
        }
        const userPackages = [];
        for (const [id, quantity] of Object.entries(quantities)) {
          for (let i = 0; i < quantity; i++) {
            userPackages.push({
              userId: user.id,
              packageId: Number(id),
            });
          }
        }
        console.log(userPackages);
        await prisma.packages_User.createMany({ data: userPackages });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            money: user.money - total,
          },
        });
        return { message: "Comprado com sucesso!" };
      },
      { body: t.Object({ packagesId: t.Array(t.Number()) }), detail: { tags: ["Package"] } }
    )
    .post(
      "/open-packages",
      async ({ user, prisma, body }) => {
        if (!user) return { body: { error: "Unauthorized" } };
        const { packagesId } = body;
        const quantities = {} as Record<number, number>;
        packagesId.forEach((id) => {
          quantities[id] = (quantities[id] || 0) + 1;
        });
        const packages = await prisma.package.findMany({
          where: { id: { in: packagesId } },
        });
        const packagesUser = await prisma.packages_User.findMany({
          where: {
            userId: user.id,
            packageId: { in: packagesId },
            opened: false,
          },
        });
        console.log({
          packagesUser: packagesUser.length,
          packagesId: packagesId.length,
        });
        if (packagesUser.length < packagesId.length) {
          return { body: { error: "You don't have all packages" } };
        }
        const allCards = [] as Card[];
        for await (const package_ of packages) {
          for (let i = 0; i < quantities[package_.id]; i++) {
            const cards = await OpenPackage(package_, prisma);
            allCards.push(...cards);
          }
          const packageUserId =
            packagesUser.find((p) => p.packageId === package_.id)?.id || 10000;
          if (packageUserId === 10000) {
            console.log("Package not found");
            continue;
          }
          await prisma.packages_User.update({
            where: {
              userId: user.id,
              packageId: package_.id,
              id: packageUserId,
            },
            data: { opened: true },
          });
        }
        for await (const card of allCards) {
          await prisma.cards_user.create({
            data: { userId: user.id, cardId: card.id },
          });
        }
        return allCards.sort((a, b) => b.rarity - a.rarity);
      },
      { body: t.Object({ packagesId: t.Array(t.Number()) }), detail: { tags: ["Package"] } }
    );
});
