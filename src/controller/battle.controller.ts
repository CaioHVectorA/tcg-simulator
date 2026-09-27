import Elysia, { t } from "elysia";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { jwt } from "../middlewares/jwt/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { BattleService } from "../services/battle.service";
import { getLocaleFromHeaders } from "../i18n";

export const battleController = new Elysia({}).group("/battle", (app) => {
  return app
    .use(jwt)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)

    /**
     * GET /battle/deck
     * Retorna o deck tático atual de 6 cartas do usuário autenticado
     */
    .get("/deck", async ({ user, headers, set }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const deck = await BattleService.getUserDeck(user.id);
        return sucessResponse(deck, undefined, locale);
      } catch (error: any) {
        set.status = 500;
        return errorResponse(error.message, "Erro ao carregar deck de batalha.", locale);
      }
    })

    /**
     * POST /battle/deck
     * Salva ou atualiza o deck de 6 cartas respeitando regras da Liga
     */
    .post(
      "/deck",
      async ({ user, body, headers, set }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { cardIds } = body;
          const result = await BattleService.saveUserDeck(user.id, cardIds, locale);
          return sucessResponse(result, "Deck tático salvo com sucesso!", locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message, locale);
        }
      },
      {
        body: t.Object({
          cardIds: t.Array(t.Number()),
        }),
      }
    )

    /**
     * GET /battle/npcs
     * Lista os Líderes de Ginásio com insígnias, terrenos e histórico do treinador
     */
    .get("/npcs", async ({ user, headers, set }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const data = await BattleService.getGymLeaders(user.id);
        return sucessResponse(data, undefined, locale);
      } catch (error: any) {
        set.status = 500;
        return errorResponse(error.message, "Erro ao listar NPCs de batalha.", locale);
      }
    })

    /**
     * POST /battle/fight-npc
     * Executa o combate tático de 3 rotas contra o Líder de Ginásio
     */
    .post(
      "/fight-npc",
      async ({ user, body, headers, set }) => {
        const locale = getLocaleFromHeaders(headers);
        try {
          const { npcId } = body;
          const { simulation, toastMessage } = await BattleService.fightNpc(user.id, npcId, locale);
          return sucessResponse(simulation, toastMessage, locale);
        } catch (error: any) {
          set.status = 400;
          return errorResponse(error.message, error.message, locale);
        }
      },
      {
        body: t.Object({
          npcId: t.String(),
        }),
      }
    )

    /**
     * GET /battle/history
     * Retorna o histórico das últimas batalhas disputadas
     */
    .get("/history", async ({ user, headers, set }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const data = await BattleService.getBattleHistory(user.id, 10);
        return sucessResponse(data, undefined, locale);
      } catch (error: any) {
        set.status = 500;
        return errorResponse(error.message, "Erro ao obter histórico de batalhas.", locale);
      }
    })

    /**
     * GET /battle/recommend-deck
     * Sugere automaticamente a melhor formação dentro do teto de 20 PR
     */
    .get("/recommend-deck", async ({ user, headers, set }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const data = await BattleService.recommendDeck(user.id, locale);
        return sucessResponse(data, undefined, locale);
      } catch (error: any) {
        set.status = 400;
        return errorResponse(error.message, error.message, locale);
      }
    })

    /**
     * GET /battle/available-cards
     * Retorna as cartas da coleção do usuário formatadas para o Deck Builder
     */
    .get("/available-cards", async ({ user, headers, set }) => {
      const locale = getLocaleFromHeaders(headers);
      try {
        const data = await BattleService.getAvailableCards(user.id);
        return sucessResponse(data, undefined, locale);
      } catch (error: any) {
        set.status = 500;
        return errorResponse(error.message, "Erro ao buscar cartas disponíveis.", locale);
      }
    });
});
