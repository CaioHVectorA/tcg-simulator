import { Elysia, t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { PackageService } from "../services/package.service";
import { getLocaleFromHeaders } from "../i18n";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const packageController = new Elysia({}).group("/packages", (app) => {
  return app
    .decorate("user", {} as User)

    /**
     * GET /packages/all
     * Lista todos os pacotes (temáticos e normais)
     */
    .get("/all", async ({ headers }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const data = await PackageService.getAllPackages();
        return sucessResponse(data, undefined, locale);
      } catch (error: any) {
        return errorResponse(error.message, "Erro ao listar pacotes.", locale);
      }
    })

    /**
     * GET /packages/cards
     * Lista cartas de um pacote com paginação e ordenação
     */
    .get(
      "/cards",
      async ({ query, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packageId, page, sort } = query;
          const data = await PackageService.getPackageCards(packageId, page, sort);
          return sucessResponse(data, undefined, locale);
        } catch (error: any) {
          return errorResponse(error.message, "Erro ao listar cartas do pacote.", locale);
        }
      },
      {
        query: t.Object({
          packageId: t.String(),
          page: t.Optional(t.Number({ optional: true })),
          sort: t.Optional(
            t.Union([
              t.Literal("A-Z"),
              t.Literal("Z-A"),
              t.Literal("r-asc"),
              t.Literal("r-desc"),
            ])
          ),
        }),
      }
    )

    /**
     * GET /packages/:id
     * Busca pacote por ID
     */
    .get("/:id", async ({ params, set, headers }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const { id } = params;
        const package_ = await PackageService.getPackageById(Number(id));
        if (!package_) {
          set.status = 404;
          return errorResponse("Pacote não encontrado", "Pacote não encontrado", locale);
        }
        return sucessResponse(package_, undefined, locale);
      } catch (error: any) {
        set.status = 500;
        return errorResponse(error.message, "Erro ao buscar pacote.", locale);
      }
    })

    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)

    /**
     * GET /packages
     * Lista os pacotes no inventário do usuário autenticado
     */
    .get(
      "/",
      async ({ user, headers, set }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const packages = await PackageService.getUserInventoryPackages(user.id, user.email);
          return sucessResponse(packages, undefined, locale);
        } catch (error: any) {
          set.status = 500;
          return errorResponse(error.message, "Erro ao carregar inventário.", locale);
        }
      },
      {
        detail: {
          tags: ["Package"],
          description: "Endpoint relacionado a coleta de pacotes a partir do token de usuário",
        },
      }
    )

    /**
     * POST /packages/buy
     * Compra de um único pacote
     */
    .post(
      "/buy",
      async ({ body, user, set, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packageId } = body;
          await PackageService.buyPackage(user.id, packageId);
          return sucessResponse(null, "Comprado com sucesso!", locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message || "Ocorreu um erro ao comprar o pacote.", locale);
        }
      },
      {
        body: t.Object({ packageId: t.Number() }),
      }
    )

    /**
     * POST /packages/buy-many
     * Compra de múltiplos pacotes em lote
     */
    .post(
      "/buy-many",
      async ({ user, body, set, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packagesId } = body;
          await PackageService.buyManyPackages(user.id, packagesId);
          return sucessResponse("Comprado com sucesso!", "Comprado com sucesso!", locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message || "Ocorreu um erro na compra em lote.", locale);
        }
      },
      {
        body: t.Object({ packagesId: t.Array(t.Number()) }),
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
      }
    )

    /**
     * POST /packages/open
     * Abre um pacote individual do inventário
     */
    .post(
      "/open",
      async ({ user, body, set, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packageId } = body;
          const cards = await PackageService.openSinglePackage(user.id, packageId, user.email);
          return sucessResponse(cards, undefined, locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message || "Erro ao abrir o pacote.", locale);
        }
      },
      {
        body: t.Object({ packageId: t.Number() }),
      }
    )

    /**
     * POST /packages/open-packages
     * Abre múltiplos pacotes do inventário em lote
     */
    .post(
      "/open-packages",
      async ({ user, body, set, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packagesId } = body;
          const cards = await PackageService.openBatchPackages(user.id, packagesId, user.email);
          return sucessResponse(cards, undefined, locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message || "Erro ao abrir os pacotes.", locale);
        }
      },
      {
        body: t.Object({ packagesId: t.Array(t.Number()) }),
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
      }
    )

    /**
     * POST /packages/thematic-lootbox
     * Abertura de pacote temático personalizado com base em aporte de moedas
     */
    .post(
      "/thematic-lootbox",
      async ({ user, body, set, headers }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { packageId, goldAmount } = body;
          const result = await PackageService.openThematicLootbox(user.id, packageId, goldAmount);
          return sucessResponse(
            result,
            `Pacote ${result.packageName} aberto com sucesso! Você recebeu ${result.cardsCount} cartas.`,
            locale
          );
        } catch (error: any) {
          set.status = error.message?.includes("não encontrado") ? 404 : 400;
          return errorResponse(error.message, error.message || "Erro ao abrir pacote temático.", locale);
        }
      },
      {
        body: t.Object({
          packageId: t.Number(),
          goldAmount: t.Number(),
        }),
      }
    );
});
