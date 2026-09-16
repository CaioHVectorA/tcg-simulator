import Elysia, { t } from "elysia";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { wsManager } from "../lib/ws-manager";
import crypto from "crypto";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const tradeController = new Elysia({}).group("/trades", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ user, prisma, query, set }) => {
        const page = Math.max(1, Number(query.page || 1));
        const pageSize = 12;
        const search = query.search?.trim();
        const minRarity = query.minRarity ? Number(query.minRarity) : undefined;
        const maxRarity = query.maxRarity ? Number(query.maxRarity) : undefined;
        const canFulfillOnly = query.canFulfill === "true";

        // Filtro base: apenas trocas públicas e abertas (sem usuário aceitante ainda)
        const whereClause: any = {
          public: true,
          userTrades: {
            none: { is_sender: false },
          },
        };

        if (search) {
          whereClause.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { cards: { some: { Card: { name: { contains: search, mode: "insensitive" } } } } },
          ];
        }

        if (minRarity !== undefined) {
          whereClause.minRarity = { gte: minRarity };
        }
        if (maxRarity !== undefined) {
          whereClause.maxRarity = { lte: maxRarity };
        }

        const [totalCount, rawTrades] = await Promise.all([
          prisma.trade.count({ where: whereClause }),
          prisma.trade.findMany({
            where: whereClause,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              cards: {
                include: {
                  Card: true,
                },
              },
              userTrades: {
                include: {
                  User: {
                    select: {
                      id: true,
                      username: true,
                      picture: true,
                      rarityPoints: true,
                    },
                  },
                },
              },
              trade_offers: {
                select: { id: true },
              },
            },
          }),
        ]);

        // Cartas que o usuário logado possui para calcular elegibilidade
        const myUserCards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          select: { cardId: true },
        });
        const myCardIds = new Set(myUserCards.map((c) => c.cardId));

        const formattedTrades = rawTrades.map((trade) => {
          const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);
          const creator = creatorTrade ? creatorTrade.User : null;

          const offeredCards = trade.cards
            .filter((c) => c.is_sender)
            .map((c) => c.Card);

          const requestedCards = trade.cards
            .filter((c) => !c.is_sender)
            .map((c) => c.Card);

          // Verifica se o usuário atual cumpre todos os requisitos
          const hasRequestedCards =
            requestedCards.length === 0 ||
            requestedCards.every((rc) => myCardIds.has(rc.id));

          const hasMoney = user.money >= trade.moneyReceiving;
          const isCreator = creator?.id === user.id;
          const canFulfill = !isCreator && hasRequestedCards && hasMoney;

          return {
            id: trade.id,
            hash: trade.hash,
            name: trade.name,
            description: trade.description,
            createdAt: trade.createdAt,
            acceptOffers: trade.acceptOffers,
            acceptMoney: trade.acceptMoney,
            moneySending: trade.moneySending,
            moneyReceiving: trade.moneyReceiving,
            minRarity: trade.minRarity,
            maxRarity: trade.maxRarity,
            creator,
            offeredCards,
            requestedCards,
            canFulfill,
            isCreator,
            offersCount: trade.trade_offers.length,
          };
        });

        const filteredTrades = canFulfillOnly
          ? formattedTrades.filter((t) => t.canFulfill)
          : formattedTrades;

        return sucessResponse({
          trades: filteredTrades,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        });
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          search: t.Optional(t.String()),
          minRarity: t.Optional(t.String()),
          maxRarity: t.Optional(t.String()),
          canFulfill: t.Optional(t.String()),
        }),
        detail: { tags: ["Trade"], description: "Feed de trocas públicas com filtros avançados" },
        response: baseResponse,
      }
    )
    .get(
      "/:id",
      async ({ user, prisma, params, set }) => {
        const id = Number(params.id);
        if (isNaN(id)) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }

        const trade = await prisma.trade.findUnique({
          where: { id },
          include: {
            cards: {
              include: { Card: true },
            },
            userTrades: {
              include: {
                User: {
                  select: { id: true, username: true, picture: true, rarityPoints: true },
                },
              },
            },
            trade_offers: {
              include: {
                users: {
                  select: { id: true, username: true, picture: true },
                },
                trade_offer_cards: {
                  include: { cards: true },
                },
              },
            },
          },
        });

        if (!trade) {
          set.status = 404;
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }

        const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);
        const acceptorTrade = trade.userTrades.find((ut) => !ut.is_sender);

        const offeredCards = trade.cards.filter((c) => c.is_sender).map((c) => c.Card);
        const requestedCards = trade.cards.filter((c) => !c.is_sender).map((c) => c.Card);

        return sucessResponse({
          ...trade,
          creator: creatorTrade?.User,
          acceptor: acceptorTrade?.User,
          isCompleted: Boolean(acceptorTrade),
          offeredCards,
          requestedCards,
          isCreator: creatorTrade?.user_id === user.id,
        });
      },
      {
        detail: { tags: ["Trade"], description: "Detalhes de uma troca por ID" },
        response: baseResponse,
      }
    )
    .post(
      "/",
      async ({ user, prisma, body, set }) => {
        const {
          name,
          description = "",
          sender_cards,
          receiver_cards = [],
          moneySending = 0,
          moneyReceiving = 0,
          acceptOffers = true,
          minRarity = 1,
          maxRarity = 5,
          public: isPublic = true,
        } = body as {
          name: string;
          description?: string;
          sender_cards: number[];
          receiver_cards?: number[];
          moneySending?: number;
          moneyReceiving?: number;
          acceptOffers?: boolean;
          minRarity?: number;
          maxRarity?: number;
          public?: boolean;
        };

        if (!name || !name.trim()) {
          set.status = 400;
          return errorResponse("Nome obrigatório", "Dê um título para sua oferta de troca");
        }

        if (!sender_cards || sender_cards.length === 0) {
          set.status = 400;
          return errorResponse("Cartas obrigatórias", "Você deve selecionar ao menos uma carta para oferecer");
        }

        // Validar posse das cartas pelo remetente
        const userCards = await prisma.cards_user.findMany({
          where: {
            userId: user.id,
            cardId: { in: sender_cards },
          },
        });

        // Conferir se o usuário possui todas as cartas ofertadas
        const ownedCardIds = new Set(userCards.map((c) => c.cardId));
        const missingCards = sender_cards.filter((id) => !ownedCardIds.has(id));

        if (missingCards.length > 0) {
          set.status = 400;
          return errorResponse("Você não possui uma ou mais cartas selecionadas para a troca");
        }

        // Validar moedas oferecidas
        if (moneySending > 0 && user.money < moneySending) {
          set.status = 400;
          return errorResponse("Saldo insuficiente", "Você não possui moedas suficientes para ofertar nesta troca");
        }

        const tradeHash = `TRD-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // Executar transação atômica de criação da troca
        const newTrade = await prisma.$transaction(async (tx) => {
          const trade = await tx.trade.create({
            data: {
              name: name.trim(),
              description: description.trim(),
              hash: tradeHash,
              acceptMoney: moneySending > 0 || moneyReceiving > 0,
              acceptOffers: Boolean(acceptOffers),
              moneySending: Number(moneySending) || 0,
              moneyReceiving: Number(moneyReceiving) || 0,
              minRarity: Number(minRarity) || 1,
              maxRarity: Number(maxRarity) || 5,
              public: isPublic !== false,
            },
          });

          // Registrar criador
          await tx.user_Trade.create({
            data: {
              trade_id: trade.id,
              user_id: user.id,
              is_sender: true,
            },
          });

          // Registrar cartas ofertadas
          const senderCardRows = sender_cards.map((cardId) => ({
            card_id: cardId,
            trade_id: trade.id,
            is_sender: true,
          }));

          // Registrar cartas solicitadas
          const receiverCardRows = receiver_cards.map((cardId) => ({
            card_id: cardId,
            trade_id: trade.id,
            is_sender: false,
          }));

          await tx.trade_Card.createMany({
            data: [...senderCardRows, ...receiverCardRows],
          });

          return trade;
        });

        // Notificar via WebSocket o novo anúncio público
        wsManager.broadcast({
          type: "TRADE_NEW",
          payload: {
            tradeId: newTrade.id,
            name: newTrade.name,
            creator: user.username,
          },
        }, user.id);

        return sucessResponse(newTrade, "Oferta de troca criada com sucesso!");
      },
      {
        body: t.Object({
          name: t.String({ minLength: 3 }),
          description: t.Optional(t.String()),
          sender_cards: t.Array(t.Number()),
          receiver_cards: t.Optional(t.Array(t.Number())),
          moneySending: t.Optional(t.Number()),
          moneyReceiving: t.Optional(t.Number()),
          acceptOffers: t.Optional(t.Boolean()),
          minRarity: t.Optional(t.Number()),
          maxRarity: t.Optional(t.Number()),
          public: t.Optional(t.Boolean()),
        }),
        detail: { tags: ["Trade"], description: "Cria uma nova oferta de troca" },
        response: baseResponse,
      }
    )
    .post(
      "/accept/:id",
      async ({ user, prisma, params, set }) => {
        const id = Number(params.id);
        if (isNaN(id)) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }

        const trade = await prisma.trade.findUnique({
          where: { id },
          include: {
            cards: { include: { Card: true } },
            userTrades: true,
          },
        });

        if (!trade) {
          set.status = 404;
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }

        const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);
        if (!creatorTrade) {
          set.status = 400;
          return errorResponse("Criador da troca não encontrado");
        }

        if (creatorTrade.user_id === user.id) {
          set.status = 400;
          return errorResponse("Você não pode aceitar sua própria troca!", "Você é o criador desta troca");
        }

        // Verificar se a troca já foi concluída
        const alreadyAccepted = trade.userTrades.some((ut) => !ut.is_sender);
        if (alreadyAccepted) {
          set.status = 400;
          return errorResponse("Esta troca já foi aceita por outro treinador");
        }

        const offeredCards = trade.cards.filter((c) => c.is_sender);
        const requestedCards = trade.cards.filter((c) => !c.is_sender);

        // 1. Validar se o aceitante possui as cartas requisitadas
        const acceptorCards = await prisma.cards_user.findMany({
          where: {
            userId: user.id,
            cardId: { in: requestedCards.map((rc) => rc.card_id) },
          },
        });
        const acceptorCardIds = new Set(acceptorCards.map((ac) => ac.cardId));
        const missingAcceptor = requestedCards.filter((rc) => !acceptorCardIds.has(rc.card_id));
        if (missingAcceptor.length > 0) {
          set.status = 400;
          return errorResponse("Você não possui todas as cartas solicitadas para esta troca");
        }

        // 2. Validar se o aceitante possui as moedas solicitadas
        if (trade.moneyReceiving > 0 && user.money < trade.moneyReceiving) {
          set.status = 400;
          return errorResponse("Saldo insuficiente", "Você não possui as moedas necessárias para aceitar");
        }

        // 3. Validar se o criador ainda possui as cartas ofertadas e moedas
        const creatorCards = await prisma.cards_user.findMany({
          where: {
            userId: creatorTrade.user_id,
            cardId: { in: offeredCards.map((oc) => oc.card_id) },
          },
        });
        const creatorCardIds = new Set(creatorCards.map((cc) => cc.cardId));
        const missingCreator = offeredCards.filter((oc) => !creatorCardIds.has(oc.card_id));
        if (missingCreator.length > 0) {
          set.status = 400;
          return errorResponse("O criador não possui mais as cartas ofertadas nesta troca");
        }

        const creatorUser = await prisma.user.findUnique({
          where: { id: creatorTrade.user_id },
          select: { money: true, username: true },
        });

        if (trade.moneySending > 0 && (!creatorUser || creatorUser.money < trade.moneySending)) {
          set.status = 400;
          return errorResponse("O criador não possui o saldo de moedas prometido nesta troca");
        }

        // Executar a troca atômica via Prisma Transaction
        await prisma.$transaction(async (tx) => {
          // Transferir uma instância de cada carta ofertada do criador para o aceitante
          for (const oc of offeredCards) {
            const cardRow = await tx.cards_user.findFirst({
              where: { userId: creatorTrade.user_id, cardId: oc.card_id },
            });
            if (cardRow) {
              await tx.cards_user.update({
                where: { id: cardRow.id },
                data: { userId: user.id },
              });
            }
          }

          // Transferir uma instância de cada carta solicitada do aceitante para o criador
          for (const rc of requestedCards) {
            const cardRow = await tx.cards_user.findFirst({
              where: { userId: user.id, cardId: rc.card_id },
            });
            if (cardRow) {
              await tx.cards_user.update({
                where: { id: cardRow.id },
                data: { userId: creatorTrade.user_id },
              });
            }
          }

          // Transferências de dinheiro
          if (trade.moneySending > 0) {
            await tx.user.update({
              where: { id: creatorTrade.user_id },
              data: { money: { decrement: trade.moneySending } },
            });
            await tx.user.update({
              where: { id: user.id },
              data: {
                money: { increment: trade.moneySending },
                totalBudget: { increment: trade.moneySending },
              },
            });
          }

          if (trade.moneyReceiving > 0) {
            await tx.user.update({
              where: { id: user.id },
              data: { money: { decrement: trade.moneyReceiving } },
            });
            await tx.user.update({
              where: { id: creatorTrade.user_id },
              data: {
                money: { increment: trade.moneyReceiving },
                totalBudget: { increment: trade.moneyReceiving },
              },
            });
          }

          // Registrar aceitante em User_Trade
          await tx.user_Trade.create({
            data: {
              trade_id: trade.id,
              user_id: user.id,
              is_sender: false,
            },
          });

          // Criar notificação para o criador
          await tx.notifications.create({
            data: {
              user_id: creatorTrade.user_id,
              type: "TRADE_ACCEPTED",
              content: `${user.username} aceitou sua oferta de troca "${trade.name}"!`,
              thumbnail: user.picture,
            },
          });
        });

        // Enviar evento em tempo real via WebSocket para o criador
        wsManager.sendToUser(creatorTrade.user_id, {
          type: "TRADE_ACCEPTED",
          payload: {
            tradeId: trade.id,
            tradeName: trade.name,
            by: user.username,
          },
        });

        return sucessResponse(null, "Troca concluída com sucesso! Cartas e saldo foram atualizados.");
      },
      {
        detail: { tags: ["Trade"], description: "Aceita diretamente uma oferta de troca cumprindo seus requisitos" },
        response: baseResponse,
      }
    )
    .post(
      "/:id/offer",
      async ({ user, prisma, params, body, set }) => {
        const id = Number(params.id);
        const { card_ids = [], money = 0 } = body as { card_ids: number[]; money?: number };

        const trade = await prisma.trade.findUnique({
          where: { id },
          include: { userTrades: true },
        });

        if (!trade) {
          set.status = 404;
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }

        if (!trade.acceptOffers) {
          set.status = 400;
          return errorResponse("Esta troca não aceita contrapropostas");
        }

        const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);
        if (creatorTrade?.user_id === user.id) {
          set.status = 400;
          return errorResponse("Você não pode enviar propostas para sua própria troca");
        }

        // Validar posse das cartas
        const userCards = await prisma.cards_user.findMany({
          where: { userId: user.id, cardId: { in: card_ids } },
        });
        const owned = new Set(userCards.map((c) => c.cardId));
        if (card_ids.some((cid) => !owned.has(cid))) {
          set.status = 400;
          return errorResponse("Você não possui todas as cartas oferecidas");
        }

        if (money > 0 && user.money < money) {
          set.status = 400;
          return errorResponse("Saldo insuficiente para ofertar");
        }

        const offer = await prisma.$transaction(async (tx) => {
          const createdOffer = await tx.trade_offers.create({
            data: {
              trade_id: trade.id,
              user_id: user.id,
              money: Number(money) || 0,
            },
          });

          if (card_ids.length > 0) {
            await tx.trade_offer_cards.createMany({
              data: card_ids.map((cid) => ({
                card_id: cid,
                trade_id: createdOffer.id,
              })),
            });
          }

          if (creatorTrade) {
            await tx.notifications.create({
              data: {
                user_id: creatorTrade.user_id,
                type: "TRADE_OFFER",
                content: `${user.username} enviou uma contraproposta na sua troca "${trade.name}"!`,
                thumbnail: user.picture,
              },
            });
          }

          return createdOffer;
        });

        if (creatorTrade) {
          wsManager.sendToUser(creatorTrade.user_id, {
            type: "TRADE_OFFER_NEW",
            payload: {
              tradeId: trade.id,
              offerId: offer.id,
              from: user.username,
            },
          });
        }

        return sucessResponse(offer, "Contraproposta enviada com sucesso!");
      },
      {
        body: t.Object({
          card_ids: t.Array(t.Number()),
          money: t.Optional(t.Number()),
        }),
        detail: { tags: ["Trade"], description: "Envia uma contraproposta para uma troca" },
        response: baseResponse,
      }
    )
    .post(
      "/offer/:offerId/accept",
      async ({ user, prisma, params, set }) => {
        const offerId = Number(params.offerId);

        const offer = await prisma.trade_offers.findUnique({
          where: { id: offerId },
          include: {
            trade_offer_cards: { include: { cards: true } },
            trades: {
              include: {
                cards: { include: { Card: true } },
                userTrades: true,
              },
            },
            users: true,
          },
        });

        if (!offer) {
          set.status = 404;
          return errorResponse("Proposta não encontrada");
        }

        const trade = offer.trades;
        const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);

        if (creatorTrade?.user_id !== user.id) {
          set.status = 403;
          return errorResponse("Apenas o criador da troca pode aceitar contrapropostas");
        }

        const alreadyAccepted = trade.userTrades.some((ut) => !ut.is_sender);
        if (alreadyAccepted) {
          set.status = 400;
          return errorResponse("Esta troca já foi finalizada");
        }

        const offeredCards = trade.cards.filter((c) => c.is_sender);
        const counterCards = offer.trade_offer_cards;

        // Executar swap atômico da proposta
        await prisma.$transaction(async (tx) => {
          // Transferir cartas do criador para o proponente
          for (const oc of offeredCards) {
            const cardRow = await tx.cards_user.findFirst({
              where: { userId: user.id, cardId: oc.card_id },
            });
            if (cardRow) {
              await tx.cards_user.update({
                where: { id: cardRow.id },
                data: { userId: offer.user_id },
              });
            }
          }

          // Transferir cartas da contraproposta para o criador
          for (const cc of counterCards) {
            const cardRow = await tx.cards_user.findFirst({
              where: { userId: offer.user_id, cardId: cc.card_id },
            });
            if (cardRow) {
              await tx.cards_user.update({
                where: { id: cardRow.id },
                data: { userId: user.id },
              });
            }
          }

          // Transferência de dinheiro da proposta
          if (offer.money > 0) {
            await tx.user.update({
              where: { id: offer.user_id },
              data: { money: { decrement: offer.money } },
            });
            await tx.user.update({
              where: { id: user.id },
              data: {
                money: { increment: offer.money },
                totalBudget: { increment: offer.money },
              },
            });
          }

          // Registrar aceitante em User_Trade
          await tx.user_Trade.create({
            data: {
              trade_id: trade.id,
              user_id: offer.user_id,
              is_sender: false,
            },
          });

          // Notificar proponente
          await tx.notifications.create({
            data: {
              user_id: offer.user_id,
              type: "TRADE_ACCEPTED",
              content: `${user.username} aceitou sua contraproposta na troca "${trade.name}"!`,
              thumbnail: user.picture,
            },
          });
        });

        wsManager.sendToUser(offer.user_id, {
          type: "TRADE_ACCEPTED",
          payload: {
            tradeId: trade.id,
            tradeName: trade.name,
            by: user.username,
          },
        });

        return sucessResponse(null, "Contraproposta aceita e troca finalizada com sucesso!");
      },
      {
        detail: { tags: ["Trade"], description: "Criador aceita uma contraproposta" },
        response: baseResponse,
      }
    )
    .delete(
      "/:id",
      async ({ user, prisma, params, set }) => {
        const id = Number(params.id);

        const trade = await prisma.trade.findUnique({
          where: { id },
          include: { userTrades: true },
        });

        if (!trade) {
          set.status = 404;
          return errorResponse("Troca não encontrada");
        }

        const creatorTrade = trade.userTrades.find((ut) => ut.is_sender);
        if (creatorTrade?.user_id !== user.id) {
          set.status = 403;
          return errorResponse("Você não tem permissão para cancelar esta troca");
        }

        const isCompleted = trade.userTrades.some((ut) => !ut.is_sender);
        if (isCompleted) {
          set.status = 400;
          return errorResponse("Esta troca já foi concluída e não pode ser cancelada");
        }

        await prisma.trade.delete({ where: { id } });
        return sucessResponse(null, "Troca cancelada com sucesso!");
      },
      {
        detail: { tags: ["Trade"], description: "Cancela uma oferta de troca ativa" },
        response: baseResponse,
      }
    )
    .get(
      "/my",
      async ({ user, prisma }) => {
        const myTrades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id, is_sender: true },
              none: { is_sender: false },
            },
          },
          include: {
            cards: { include: { Card: true } },
            trade_offers: {
              include: {
                users: {
                  select: { id: true, username: true, picture: true },
                },
                trade_offer_cards: {
                  include: { cards: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const formatted = myTrades.map((trade) => {
          const offeredCards = trade.cards.filter((c) => c.is_sender).map((c) => c.Card);
          const requestedCards = trade.cards.filter((c) => !c.is_sender).map((c) => c.Card);

          return {
            ...trade,
            offeredCards,
            requestedCards,
            offers: trade.trade_offers,
          };
        });

        return sucessResponse(formatted);
      },
      {
        detail: { tags: ["Trade"], description: "Lista as trocas ativas criadas pelo usuário logado" },
        response: baseResponse,
      }
    )
    .get(
      "/my/history",
      async ({ user, prisma }) => {
        const completedTrades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id },
            },
            AND: [
              { userTrades: { some: { is_sender: true } } },
              { userTrades: { some: { is_sender: false } } },
            ],
          },
          include: {
            cards: { include: { Card: true } },
            userTrades: {
              include: {
                User: {
                  select: { id: true, username: true, picture: true },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        const formatted = completedTrades.map((trade) => {
          const creator = trade.userTrades.find((ut) => ut.is_sender)?.User;
          const acceptor = trade.userTrades.find((ut) => !ut.is_sender)?.User;
          const offeredCards = trade.cards.filter((c) => c.is_sender).map((c) => c.Card);
          const requestedCards = trade.cards.filter((c) => !c.is_sender).map((c) => c.Card);

          return {
            ...trade,
            creator,
            acceptor,
            offeredCards,
            requestedCards,
            iWasCreator: creator?.id === user.id,
          };
        });

        return sucessResponse(formatted);
      },
      {
        detail: { tags: ["Trade"], description: "Histórico de trocas concluídas pelo usuário" },
        response: baseResponse,
      }
    );
});
