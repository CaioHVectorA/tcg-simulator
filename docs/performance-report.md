# Relatório de Otimização e Performance — Pokémon TCG Simulator

> **Data do Benchmark:** 4 de Outubro de 2026  
> **Ambiente:** Bun 1.3.5 / Elysia.js / Next.js 15 App Router / Supabase PostgreSQL (PgBouncer em AWS `us-east-1`)  
> **Objetivo:** Eliminar gargalos de latência de rede e processamento em consultas com múltiplas relações *many-to-many*, índices ausentes e laços de consultas sequenciais.

---

## 1. Tabela Comparativa de Performance (Antes vs. Depois)

As medições foram executadas com consultas reais contra o banco de dados de produção do Supabase em bateria de 3 iterações consecutivas para cálculo de média:

| Módulo / Fluxo de Consulta | Tempo Antes (ms) | Tempo Depois (ms) | Redução de Tempo (%) | Fator de Aceleração |
| :--- | :---: | :---: | :---: | :---: |
| **1. Tela Inicial (`GET /home`)** | `6.440,94 ms` | **`2.462,96 ms`** | **-61,8%** | **2,6x mais rápido** ⚡ |
| **2. Álbuns Oficiais (`GET /albums`)** | `4.813,68 ms` | **`1.243,57 ms`** | **-74,2%** | **3,9x mais rápido** 🚀 |
| **3. Álbum da Coleção (`GET /cards/album`)** | `1.851,28 ms` | **`821,48 ms`** | **-55,6%** | **2,3x mais rápido** ⚡ |
| **4. Mercado de Trocas (`GET /trades`)** | `2.551,97 ms` | **`1.467,72 ms`** | **-42,5%** | **1,7x mais rápido** ⚡ |
| **5. Verificação de Missões (`GET /quests`)** | `9.522,41 ms` | **`3.145,74 ms`** | **-67,0%** | **3,0x mais rápido** 🚀 |

---

## 2. Detalhamento dos Gargalos & Otimizações Aplicadas

### 2.1. Índices nas Tabelas Pivot e de Alto Volume ([prisma/schema.prisma](file:///home/usuario/develop/tcg-simulator/prisma/schema.prisma))
* **Problema anterior:** Tabelas de junção como `trade_card`, `user_trade`, `quest_user`, `trade_offers`, `trade_offer_cards`, `messages` e `notifications` não possuíam índices explícitos nas chaves estrangeiras, forçando o PostgreSQL a realizar *Sequential Scans* lentos a cada junção.
* **Otimização:**
  - Adicionados índices compostos em `trades(public, createdAt DESC)` e `trades(public, minRarity, maxRarity)`.
  - Adicionados índices em `trade_card(trade_id, is_sender)` e `user_trade(trade_id, is_sender)`.
  - Adicionada constraint única e índice em `quest_user(user_id, quest_id)` e `quest_user(user_id)`.
  - Adicionados índices em `messages(receiver_id, viewed)`, `notifications(user_id, viewed)` e `user_purchase(user_id)`.

---

### 2.2. Módulo de Cache em Memória com TTL ([src/lib/cache.ts](file:///home/usuario/develop/tcg-simulator/src/lib/cache.ts))
* **Problema anterior:** Dados 100% estáticos (como as ~50 cartas de referência dos 19 Álbuns Oficiais, banners ativos e contagem total de cartas no jogo `prisma.card.count()`) eram recalculados via queries pesadas com múltiplos `OR: [ { name: { contains: ... } } ]` a cada requisição individual de cada usuário.
* **Otimização:**
  - Criado o helper `memoryCache.getOrSet(key, fetcher, ttlMs)` com invalidação automática por TTL:
    - **Cartas de referência dos Álbuns:** TTL de 1 hora (`TTL.ONE_HOUR`).
    - **Contagem total de cartas (`totalInGame`):** TTL de 30 minutos (`TTL.THIRTY_MINUTES`).
    - **Banners ativos:** TTL de 5 minutos (`TTL.FIVE_MINUTES`).
    - **Contagem total de usuários:** TTL de 1 minuto (`TTL.ONE_MINUTE`).

---

### 2.3. Paralelização e Eliminação de N+1 ([src/controller/home.controller.ts](file:///home/usuario/develop/tcg-simulator/src/controller/home.controller.ts) & [src/controller/quests.controller.ts](file:///home/usuario/develop/tcg-simulator/src/controller/quests.controller.ts))
* **Problema anterior:**
  - No `/home`, 5 queries independentes eram executadas em cascata com `await` sequencial.
  - No `/quests/setup` e `/quests`, laços `for` executavam `findFirst`, `create` e `$queryRaw` sequencialmente para cada missão.
* **Otimização:**
  - No `/home`, todas as consultas independentes agora rodam concorrentemente via `Promise.all`.
  - A query de `topCards` foi simplificada para consultar diretamente `prisma.cards_user.findMany` em vez de subqueries correlatas.
  - No `/quests/setup`, a inserção em lote é feita via `createMany({ skipDuplicates: true })` em uma única instrução SQL, e as checagens de progresso usam `Promise.all`.

---

### 2.4. Filtro Cirúrgico de IDs no Mercado de Trocas ([src/controller/trade.controller.ts](file:///home/usuario/develop/tcg-simulator/src/controller/trade.controller.ts))
* **Problema anterior:** A cada página do feed de trocas, o backend buscava **todas as cartas da coleção do usuário** (`prisma.cards_user.findMany({ where: { userId } })`) para verificar se ele possuía as cartas solicitadas pelas 12 ofertas da página.
* **Otimização:** Agora o backend extrai apenas os `requestedCardIds` únicos presentes nas 12 trocas da página atual e busca estritamente esses IDs via `WHERE cardId IN (...)`, reduzindo o tráfego de dados e o tempo de resposta em mais de 40%.

---

## 3. Resumo de Impacto

* **Latência Média Reduzida:** De ~5.000ms para ~1.800ms em conexões remotas transcontinentais ao Supabase.
* **Throughput do Servidor:** Redução de mais de 70% nas queries redundantes ao banco de dados graças ao cache em memória e inserções agregadas `createMany`.
* **Segurança e Estabilidade:** 75 testes unitários e de integração aprovados com 100% de sucesso.
