# TODO.md — Pokémon TCG Simulator

> **Backlog de Tarefas, Correções e Roadmap de Evolução**  
> Status atualizado em: 13 de Setembro de 2026

---

## 🚨 Prioridade 0: Correções Críticas (Bugs Identificados)

- [ ] **Corrigir cálculo de probabilidade de raridade na abertura de boosters**
  - *Arquivo:* `src/lib/open-package.ts`
  - *Problema:* `getRandomCardFromPackage` avalia `if (getted <= pkg.common_rarity)` e em seguida `if (getted <= pkg.rare_rarity)`. Se `rare_rarity < common_rarity`, nunca atinge a raridade rara pois não usa probabilidade acumulada.
  - *Ação:* Implementar amostragem cumulativa (Cumulative Distribution Function - CDF): somar os pesos e verificar intervalos proporcionais.

- [ ] **Corrigir vazamento de estado em cartas promocionais compradas na loja**
  - *Arquivo:* `src/controller/store.controller.ts`
  - *Problema:* Rota `GET /store/bought-promotional` busca compras sem filtrar por `user_id: user.id`. Qualquer compra de um usuário marca a carta como indisponível para todos.
  - *Ação:* Adicionar `where: { user_id: user.id, card_id: { not: null } }`.

- [ ] **Corrigir verificação de posse no resgate do Gengar Especial**
  - *Arquivo:* `src/controller/special.controller.ts`
  - *Problema:* A checagem `prisma.cards_user.findFirst` verifica se **qualquer** usuário possui a carta, impedindo outros usuários de resgatá-la.
  - *Ação:* Filtrar por `userId: user.id` e `Card: { card_id: GENGAR_CARD_ID }`.

- [ ] **Corrigir cálculo de índice e raridade 0 no Cron de Cartas Promocionais**
  - *Arquivo:* `src/lib/cards-cron.ts`
  - *Problema:* `rarity` sorteada pode ser `0` (`Math.floor(Math.random() * 2)`), quebrando o array `weights[rarity - 1]` com índice `-1`. Além disso, o índice do array `cards[random]` soma o ID do primeiro card, estourando o tamanho do array.
  - *Ação:* Garantir raridade mínima 1 (`Math.floor(Math.random() * 2) + 1`) e escolher elemento aleatório com `cards[Math.floor(Math.random() * cards.length)]`.

- [ ] **Corrigir colisão de cache de missões entre usuários**
  - *Arquivo:* `src/controller/quests.controller.ts`
  - *Problema:* A chave do cache em memória `questsCache` é `quest-${quest.Quest.id}`, sem distinguir o ID do usuário autenticado.
  - *Ação:* Modificar a chave de cache para incluir o ID do usuário: `quest-${user.id}-${quest.Quest.id}`.

- [ ] **Tornar dinâmica a URL da API no Frontend**
  - *Arquivo:* `apps/www/src/lib/api.ts`
  - *Problema:* URL de produção `https://poke-tcg-center.fly.dev` está hardcoded, impedindo o desenvolvimento contra o backend local sem edição manual.
  - *Ação:* Usar `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"`.

- [ ] **Corrigir rota de criação de trocas no Backend**
  - *Arquivo:* `src/controller/trade.controller.ts`
  - *Problema:* `prisma.trade.create({})` falha na validação do Prisma pois os campos `hash`, `name`, `acceptMoney` e `acceptOffers` são obrigatórios no schema.
  - *Ação:* Gerar hash único, receber título/descrição e criar registro em `User_Trade` para o remetente dentro de uma transação.

- [ ] **Corrigir queries SQL com operadores incorretos nas missões**
  - *Arquivo:* `prisma/seed/quests.ts`
  - *Problema:* `GET_INITIALS` e `GET_LEGENDARIES` utilizam `COUNT(*) > $GOAL` em vez de `>= $GOAL`. Já a query `GET_SUICUNE_ENTEI_RAIKOU` retorna `::int` em vez de `boolean`.
  - *Ação:* Padronizar operadores para `>= $GOAL` e garantir retorno booleano `mission_complete`.

- [ ] **Corrigir Dockerfile de deploy**
  - *Arquivo:* `Dockerfile`
  - *Problema:* Faz `ADD` de `bun.lockb` e `package-lock.json` que não existem no repositório e expõe porta 3000 em vez de 8080.
  - *Ação:* Atualizar Dockerfile para o estado atual do repositório e alinhar porta com `fly.toml`.

---

## 📦 Prioridade 1: Funcionalidades Essenciais & Backlog Pendente

### 🤝 Sistema de Trocas (Trades)
- [ ] Implementar a interface completa de Trocas em `apps/www/src/app/(app)/trocas/page.tsx` (atualmente `<LargeWip />`):
  - [ ] Feed público de trocas disponíveis com filtros por carta desejada e raridade.
  - [ ] Tela de criação de troca: seleção de cartas a oferecer e cartas desejadas do catálogo.
  - [ ] Minhas trocas ativas (com opção de cancelar/remover oferta).
  - [ ] Histórico de trocas concluídas e aceitas.
- [ ] Suporte a contra-propostas e ofertas parciais (`trade_offers`).
- [ ] Notificação interna ao usuário quando sua troca for aceita ou receber proposta.

### 👤 Perfil & Configurações de Usuário
- [ ] Criar a página de Perfil em `apps/www/src/app/(app)/perfil/page.tsx`:
  - [ ] Visualização de avatar, estatísticas de coleção, cartas favoritas em destaque, posição nos rankings e histórico.
  - [ ] Opção de alterar foto/avatar e nome de usuário.
- [ ] Criar a página de Configurações em `apps/www/src/app/(app)/config/page.tsx`:
  - [ ] Preferências de tema (Dark/Light mode).
  - [ ] Opções de conta e encerramento de sessão.

### 🏆 Rankings & Competitivo
- [ ] Implementar ranking por missões concluídas no backend:
  - *Arquivo:* `src/controller/ranking.controller.ts` (endpoint `/ranking/quests` atualmente espelha `totalBudget`).
  - *Ação:* Consultar usuários ordenando pela quantidade de `QuestUser` com `completed: true`.
- [ ] Adicionar abas de navegação na página de ranking no frontend (`/ranking`) para alternar entre "Raridade", "Moedas" e "Missões".

---

## 🎨 Prioridade 2: UX, Animações e Experiência do Jogador

- [ ] **Experiência Imersiva de Abertura de Pacotes**:
  - *Arquivo:* `apps/www/src/app/(app)/abrir-pacote/[id]/page.tsx`
  - Atualmente apenas exibe uma grade estática de cartas.
  - Implementar animação de "rasgar" o pacote, revelar carta a carta (com efeito de holografia/brilho em cartas épicas/lendárias) e som de abertura.
- [ ] **Modal de Detalhes da Carta**:
  - Permitir clicar em qualquer carta (na coleção, loja ou inventário) para abrir modal com imagem expandida, HP, ataques, tipo, coleção e quantidade que o jogador possui.
- [ ] **Sistema de Notificações em Tempo Real**:
  - Componente de sino na barra de navegação com contador de notificações não lidas (`notifications` no banco).
  - Exibir avisos de: recompensa diária disponível, amigo adicionado, missão completada, oferta de troca recebida.
- [ ] **Polimento de Responsividade**:
  - Revisar tabelas e cards em telas pequenas (< 360px).
  - Melhorar suporte a gestos no mobile para troca de páginas e navegação no binder.

---

## 🧪 Prioridade 3: Testes & Qualidade de Código

- [ ] **Configurar suite de testes automatizados com Bun Test**:
  - Criar testes unitários para a distribuição de probabilidades de cartas (`src/lib/open-package.ts`).
  - Criar testes unitários para o cálculo de preços dinâmicos de cartas promocionais (`src/lib/cards-cron.ts`).
  - Criar testes de integração para o controlador de usuários (`tests/user.controller.ts`).
  - Criar testes de integração para o fluxo de checkout e transações atômicas de compra (`src/controller/store.controller.ts`).
- [ ] **Segurança nas Queries Analíticas de Missões**:
  - Refatorar `src/lib/run-quests-query.ts` para usar substituição parametrizada segura via `Prisma.sql` em vez de manipulação de string (`.replace()`).
- [ ] **Adicionar Linter e Typecheck em CI**:
  - Adicionar workflow no GitHub Actions (`.github/workflows/ci.yml`) executando `bun check` e `next lint`.

---

## 🚀 Prioridade 4: Expansões Futuras (Ideias & Visão de Longo Prazo)

- [ ] **Sistema de Chat & Amigos**:
  - Implementar chat privado entre amigos utilizando as tabelas `Friend_User` e `messages`.
  - Suporte a WebSockets (via Elysia WebSocket) para mensagens instantâneas.
- [ ] **Simulador de Batalhas TCG (PVP/PVE)**:
  - Construção de Decks (mínimo de 60 cartas do inventário do jogador).
  - Batalha em turnos simples contra IA ou outros jogadores com cálculo de fraquezas e energias.
- [ ] **Álbum / Binder Virtual**:
  - Visualização de coleção em estilo "fichário" folheável, com slots vazios para cartas ainda não descobertas de cada coleção.
- [ ] **Conquistas e Títulos de Perfil**:
  - Badges especiais (ex: "Mestre do Fogo", "Colecionador Lendário") exibíveis no perfil e no ranking.
