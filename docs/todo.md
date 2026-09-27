# TODO.md — Pokémon TCG Simulator

> **Backlog Estruturado de Tarefas, Roadmap e Especificações Técnicas**  
> Última Atualização: **20 de Setembro de 2026**

---

## 🎯 Status Atual do Projeto: Estável, Rebalanceado & Expandido

### ✅ Entregas Concluídas Recentemente

- [x] **Refatoração Completa da Estação de Trocas P2P (`/trocas`), UX Tátil & Seed Realista:**
  - Redesenho completo da interface `/trocas` em formato de mesa de negociação com cards no padrão "VOCÊ RECEBE" (com bordas iluminadas por raridade, zoom e brilho holográfico) ⇄ "VOCÊ ENTREGA" (com selos visuais em tempo real de cartas possuídas `✓ No Binder` vs cartas que faltam `🔒 Falta`).
  - Barra de filtros com chips táteis (*Todas as Ofertas*, *Posso Aceitar Já* com contador verde esmeralda, *God Pulls ★5*, *Místicas ★4*, *Épicas ★3*, *Com Moedas*).
  - Fluxo de criação de oferta ("Trade Builder") em 3 passos com seleção visual de cartas marcadas para troca, catálogo com filtros ágeis de raridade e comprovante em tempo real ("Trade Ticket") com cálculo da taxa diária (2.000 moedas/dia) e seletor de duração (1 a 30 dias).
  - Som exclusivo de finalização de troca (`soundFx.playTradeSuccess()`) sintetizado com harmônicos clássicos do Pokémon Trade Center.
  - Script dedicado de seed em lote (`prisma/seed/seed-trades.ts`): criação de 10 treinadores da comunidade (Red, Cynthia, Steven, Lance, Blue, Sabrina, Leon, Nemona, Misty, Brock) e 12 ofertas de trocas balanceadas com cartas registradas em `cards_user` e contrapropostas ativas no banco.

- [x] **Limpeza Visual e Textual na Landing Page e Aba de Login:**
  - Removidos textos inúteis, buzzwords técnicos ("Web Audio API", "WebSocket", "animações a 60fps", "celebrações cinematográficas") e instruções redundantes de cursor.
  - Removido texto "Abertura cinematográfica com áudio" e lista estática de bullet points da tela `/entrar`.
  - Coluna esquerda da tela de login reformulada para exibir um showcase visual autêntico com `BoosterPackArt` interativo, e simplificado banner de convidado.

- [x] **Boosters Temáticos com Visual Metalizado e Correção de Imagens 404:**
  - Corrigidas URLs quebradas na tabela `packages` para os sets swsh3, sv03.5 (151), sv04.5 (Destinos de Paldea), swsh9 (Astros Cintilantes), swsh7 (Céus em Evolução) e swsh12.5 (Realeza Absoluta).
  - Atualizado `BoosterPackArt` para suporte nativo a `logoUrl` com posicionamento centralizado, relevo metalizado e crimp dentado, substituindo logos flutuando em vazio ou cartas esticadas na loja e na abertura.

- [x] **Aumento do Teto dos Pacotes Temáticos para 1.000.000 (1M) & Revelação Crescente:**
  - Teto de investimento em ouro ampliado de 100k para 1.000.000 (1M) no backend (`POST /packages/thematic-lootbox`) e no frontend (`ThematicLootboxDialog`), com botão MAX (1M) e chips rápidos até 1M.
  - Invertida a ordem de revelação de cartas para a ordem canônica do TCG: do menos raro para o mais raro (Tier 1 ao Tier 5), garantindo suspense e deixando a melhor carta (God Pull) para o final.

- [x] **Eliminação de Jitter / Tremor do Mouse na Celebração de God Pull:**
  - Em `apps/www/src/components/max-rarity-celebration.tsx`: substituído `setMousePos` no React por `useMotionValue` + `useSpring` da GPU, e removida classe CSS conflitante `transition-transform duration-100`. Efeito 3D agora responde a 120Hz com física suave sem nenhum tremor.

- [x] **Eliminação da Tela Branca Bloqueante de Carregamento ("Carregando suas informações"):**
  - Identificada a causa raiz em `apps/www/src/context/UserContext.tsx`: o `UserProvider` envelopava todo o `(app)/layout.tsx` e substituía a árvore inteira de componentes por uma tela branca estática enquanto `/user/me` estava pendente, suprimindo cabeçalhos e esqueletos locais da Loja e outras abas.
  - Removido bloqueio do `UserProvider`, removido delay arbitrário de 3.000ms e configurado `staleTime: 60000`. O layout e os skeletons de página agora renderizam instantaneamente (0ms).

- [x] **Mini Descrição em Popover `(i)` nos Booster Packs da Loja:**
  - Adicionado botão interativo `(i)` com efeito translúcido no canto superior de cada booster pack em `apps/www/src/app/(app)/loja/pack-card/index.tsx`.
  - Ao clicar ou tocar, abre um Popover estilizado exibindo o nome do pacote, badge com a quantidade exata de cartas (`cards_quantity`), custo em moedas e uma mini descrição com a proposta, mecânica e chances de raridade (ex: Tudo ou Nada com 82% de god pull, Pacote Lendário com 65%+ de lendárias, pacotes elementais e temáticos).

- [x] **Otimização Extrema do Endpoint `POST /quests/claim-all` (de 54s para <500ms):**
  - Causa raiz: laço sequencial executando 23 a 30 queries `prisma.$queryRaw` sequenciais para o Supabase (EUA via PgBouncer), somando ~1.8s por roundtrip e totalizando 54 segundos.
  - Solução: paralelização de queries com `Promise.all`, verificação em cache curto (`questsCache`) para pular validação de missões atestadas incompletas nos últimos 30 segundos, e criação de novos índices de banco de dados (`cards_user(userId, cardId)`, `packages_user(userId, opened)` e `cards(rarity, type)`).

- [x] **Migração da Coleção (`/colecao`) para Client-Side TanStack Query (Fim do SSR Inflexível):**
  - Migração de `/colecao` para Client Component com `useQuery(['my-cards', queryString])`, eliminando a lentidão e descompasso de parâmetros causados pelo antigo SSR.
  - Adicionado `apps/www/src/app/(app)/colecao/loading.tsx` e shimmer de 18 cards durante transições de filtro, com sincronização em tempo real de favoritos e marcações de troca.

- [x] **Reclassificação Rigorosa de Raridades V, VMAX, VSTAR, ex, EX e Megas:**
  - Script e verificação no banco de dados (`prisma/seed/fix-rarities-and-trade-seed.ts`): todas as 27 cartas especiais e de promoções legadas classificadas erroneamente como Comum/Rara foram promovidas para Tier 3 (Épica) no caso de V/ex/EX/GX e Tier 4 (Mística) / Tier 5 (Lendária) no caso de VMAX, VSTAR e Megas.
  - Regra de negócio mandatória documentada no `AGENTS.md`.

- [x] **Filtros Avançados na Coleção & Correção da Contagem Total (#66):**
  - Correção crítica no HOC `withAsyncPaginatedFetchedData` (`apps/www/src/components/hoc/with-paginated-data.tsx`): repasse correto de `totalCards={payload.totalCards}` e de todos os searchParams (`type`, `rarity`, `tradeOnly`, `favorites`, `search`). A coleção não exibe mais "0 cartas no total".
  - Barra de filtros na Coleção (`apps/www/src/modules/colection/cards.tsx`) com seleção de tipo elemental (Fogo, Água, Elétrico, etc.), filtro por nível de raridade (1 a 5), abas exclusivas para "Todas", "Favoritas" e "Marcadas p/ Troca".

- [x] **Sistema de Marcação de Cartas para Troca (`trade_marked_cards`):**
  - Nova tabela no Prisma (`trade_marked_cards` / model `TradeMarkedCard`) e endpoint `POST /cards/toggle-trade-mark/:id`.
  - Botão de toggle e badge `⇄ TROCA` na Coleção.
  - Integração mandatória na aba de trocas (`apps/www/src/app/(app)/trocas/page.tsx`): o seletor de cartas na criação de oferta lista estritamente cartas marcadas para troca pelo usuário via `GET /cards/my-tradeable`.
  - Regra de sistema: cartas marcadas para troca não poderão ser utilizadas na formação de decks no futuro modo de batalha.

- [x] **Rebalanceamento Econômico & Linha de 12 Pacotes Padrão:**
  - Loja reestruturada com exatamente 12 pacotes padrão clássicos (de 100 até 42.000 moedas: Simples, Raro, Grande, Épicos, Iniciação, Lendário, Raro Kanto, Grande Épico, Tudo ou Nada, Vórtice Sombrio, Mítico Celestial, Tempestade Elemental) mais todos os 29 pacotes temáticos do TCGDex.
  - Seção "Boosters Supremos Definitivos" removida a pedido do usuário; todos os 12 pacotes padrão residem juntos na seção "Pacotes Padrão".
  - Remoção completa da nomenclatura "lootbox" em favor de "Pacote Temático Personalizado".
  - Teto de gastos de 100.000 moedas implementado no backend (`package.controller.ts`) e no seletor com chips de atalho (`thematic-lootbox-dialog.tsx`).

- [x] **Carregamento Tátil e Instantâneo da Loja (Zero Latency / Fim do SSR Lag):**
  - Migração de `/loja` de SSR bloqueante (`withAsyncFetchedData`) para Client Component nativo com TanStack Query (`useQuery`).
  - Criação de `StoreSkeleton` com silhuetas pulsantes de boosters e cartas flash, e `apps/www/src/app/(app)/loja/loading.tsx`.
  - Transição imediata de rota (0ms) e cache inteligente de 60 segundos com invalidação pós-checkout.

- [x] **Novas Missões Criativas & Feedback Tátil Instantâneo:**
  - Adicionadas 7 novas missões de alto rendimento no banco de dados (`seed-creative-quests.ts`): Mestre das Trevas, Especialista Psíquico, Poder de Titã (HP Extremo), Caçador de Místicas & Lendárias, Arsenal V & VMAX, Dinastia Eeveelution e Negociador da Liga. Recompensas entre 8.000 e 100.000 moedas sincronizadas com todos os usuários.
  - Feedback tátil imediato no botão "Coletar Recompensa": áudio disparado no momento do clique e botão específico com estado de carregamento local (`LoaderSimple`) sem latência percebida.

- [x] **Otimização da Abertura de Pacotes (Sem Engasgos/Loading no Rasgo):**
  - `pack-opening-modal.tsx`: pré-carregamento em segundo plano ativado durante a tela de resumo (`phase === "summary"`) para que aberturas consecutivas ocorram com 0ms de espera.
  - `package.controller.ts`: rota `/open-packages` otimizada para agrupar amostragem de raridade em memória por tipo de pacote, eliminando chamadas redundantes a banco de dados.

- [x] **Correções Visuais & Posicionamento de Toasts:**
  - Reposicionamento do `ToastViewport` (`apps/www/src/components/ui/toast.tsx`) para o topo superior direito (`top-4 right-4`), impedindo que a notificação cubra o botão flutuante de finalizar compra do carrinho.
  - Ajuste de contraste em variantes `outline` e `ghost` do `button.tsx` para garantir legibilidade com texto explícito em tema claro e escuro.

- [x] **Seed Realista no Mercado de Trocas:**
  - Povoamento do mercado com treinadores emblemáticos (Red, Cynthia, Steven, Lance, Misty) ofertando cartas lendárias e místicas autênticas com valores e descrições temáticas.

- [x] **Ativação do React Scan:**
  - Script do React Scan ativado em `apps/www/src/app/layout.tsx` para auditoria contínua de performance e renderizações.

- [x] **Fluxo de Convidado Humanizado & Customização de Avatar:**
  - Nicknames personalizados, botão 🎲 aleatório e endpoint `POST /auth/upgrade-guest`.
  - Modal `AvatarPickerModal` integrado ao perfil (`perfil/page.tsx`).

- [x] **Sistema Completo de Batalha Tática & Ginásios NPC:**
  - **Prisma Schema & Banco de Dados:** Modelos `UserDeckCard` (`user_deck_cards` com slot 0-5) e `UserBattleRecord` (`user_battle_records` com histórico de vitórias/derrotas, placar e recompensas) sincronizados via `prisma db push`.
  - **Battle Engine (`src/lib/battle-engine.ts`):**
    - Teto Salarial de 20 Pontos de Recrutamento (PR) baseado em raridade (T1: 1 PR até T5: 8 PR).
    - Cálculo dinâmico de Poder de Combate (CP): Base + Bônus de HP + Bônus de Subtipo (Mega +35, VMAX +30, VSTAR +25, ex/EX/GX +15) + Modificador de Terreno (+20% se tipo favorecido).
    - 6 Terrenos Elementais com vantagens estratégicas.
    - 5 Líderes de Ginásio (Brock, Misty, Lt. Surge, Erika e Giovanni) com decks completos, avatares, insígnias e escalonamento de moedas/XP.
    - Simulação em 3 rotas (Alfa, Beta e Gama com 2 cartas por rota).
  - **Regra de Isolamento de Trocas:** Cartas em `trade_marked_cards` são estritamente rejeitadas para inclusão em decks de batalha tanto na API quanto no frontend.
  - **Backend Controller (`battle.controller.ts`):** Rotas `/battle/deck`, `/battle/npcs`, `/battle/fight-npc`, `/battle/history`, `/battle/recommend-deck` e `/battle/available-cards`.
  - **Interface Web (`/batalha`):**
    - Deck Builder com slots visuais, barra de progresso de PR, CP total e modal seletor de cartas com busca e bloqueio de cartas de troca.
    - Botão "Auto-Recomendar Melhor Deck" com algoritmo guloso de otimização de CP por PR.
    - Grade de Líderes de Ginásio com status de derrotado, terrenos favoritos e botão de desafio.
    - Arena de Combate com replay animado rota a rota, placar, áudio com `soundFx` e modal de recompensas.
    - Aba de Histórico de Batalhas da Liga.

- [x] **Bateria Abrangente de Testes (Unitários, Integração & E2E):**
  - 43 testes unitários e de integração executados em 10 suites (`bun test`) com 100% de aprovação.
  - Validação de cap de 20 PR, cálculo de CP por subtipo e terreno, exclusão de cartas marcadas para troca e fluxo E2E de campanha contra os 5 ginásios.

- [x] **Reconfirmação de Internacionalização (i18n):**
  - Paridade estrita de 100% entre `pt.ts` e `en.ts` (299 chaves cada), com namespace `battle` completo.

- [x] **Revalidação de Balanceamento Econômico:**
  - God Pulls a 10M, retornos matemáticos de pacotes $\le 0.70 \times C_{\text{pack}}$, recompensas progressivas e finitas.

---

## 🚀 Próximas Entregas Planejadas

### 🎴 Colecionismo e Recursos Sociais
- [ ] **Compartilhamento Público de Pasta / Binder Virtual (#44)**
  - *Descrição:* Rota pública compartilhável (`/binder/:username` ou `/colecao/:id`) com visualização de fichário folheável para exibir coleções em redes sociais.
- [ ] **Menu Lateral / Sidebar Moderna (#48)**
  - *Descrição:* Implementar barra de navegação retrátil lateral para telas médias/grandes (desktop), mantendo menu inferior no mobile.
- [ ] **Senha opcional para usuários Convidado e Google (#49)**
  - *Descrição:* Permitir que contas migradas adicionem uma senha segura para permitir login tradicional por email/senha em qualquer dispositivo.

---

## 🌐 Internacionalização Completa (i18n)
*(Planejado e documentado em `docs/i18n-architecture.md`)*

### Escopo de Idiomas Planejados:
1. 🇧🇷 **Português do Brasil (`pt-BR`)** — Idioma padrão.
2. 🇺🇸 **Inglês (`en-US`)** — Idioma universal para a comunidade competitiva (#74).
3. 🇪🇸 **Espanhol (`es-ES`)** — Comunidade hispanofalante (#75).
4. 🇯🇵 **Japonês (`ja-JP`)** — Cartas originais e público asiático (#76).
5. 🇫🇷 **Francês (`fr-FR`)** e 🇩🇪 **Alemão (`de-DE`)** (#77).

---

## 📋 Resumo de Comandos Úteis para Desenvolvedores

```bash
# Instalar dependências
bun install

# Iniciar Backend e Frontend juntos (Ambiente Concorrente com logs coloridos)
bun dev:all

# Iniciar apenas o Backend (porta 8080)
bun dev:back

# Iniciar apenas o Frontend (porta 3000)
bun dev:front

# Executar suite completa de testes unitários
bun test

# Executar migrações e sincronizar schema no banco
bun x prisma db push
```
