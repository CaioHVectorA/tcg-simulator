# CONTEXT.md — Visão Arquitetural, Domínio & Estado do Sistema

> **Documentação Canônica de Contexto do Pokémon TCG Simulator**  
> Repositório: **`tcg-simulator` (`poke-tcg-center`)**  
> Última Atualização: **20 de Setembro de 2026**

---

## 1. Visão Geral do Produto & Arquitetura

O **Pokémon TCG Simulator** é uma plataforma web fullstack gamificada voltada para entusiastas de Pokémon Trading Card Game. O sistema reúne:
- Simulação tátil de abertura de booster packs em alta resolução com física de rasgo e celebração cinematográfica.
- Gestão de coleção com álbuns temáticos por região, marcação de cartas para trocas e inspeção detalhada.
- Economia equilibrada com fluxo de moedas, linha de 12 pacotes até 100.000 moedas, missões diárias/progressivas e progressão por níveis de XP.
- Mercado aberto de trocas entre treinadores com proteção de inventário e regras para decks de batalha.

### 1.1. Arquitetura Monorepo
```mermaid
graph TD
    Client["Browser Web Client (Next.js 15)"] -->|HTTP / REST + JWT| API["Backend API (Elysia.js + Bun 8080)"]
    API -->|Prisma ORM (Port 6543)| Supabase["PostgreSQL (Supabase PgBouncer)"]
    Client -->|Assets WebP| CDN["TCGdex CDN / PokeAPI"]
```

- **Backend (`./`):** Construído sobre o runtime **Bun** utilizando o framework **Elysia.js**. Persistência através de **Prisma ORM** conectado a um banco de dados **PostgreSQL** hospedado no Supabase com PgBouncer.
- **Frontend (`apps/www`):** Aplicação **Next.js 15** utilizando App Router, React 18, Tailwind CSS, Radix UI, TanStack Query v5 e Framer Motion.
- **Áudio & Efeitos:** Motor sonoro sintetizado em tempo de execução via Web Audio API (`apps/www/src/lib/sound-fx.ts`), dispensando arquivos estáticos pesados.

---

## 2. Camada de Dados & Modelos do Prisma

### 2.1. Inconsistências Conhecidas de Nomenclatura
O schema histórico possui uma mescla de convenções em chaves estrangeiras que devem ser rigorosamente observadas:
- **camelCase:**
  - `cards_user`: `userId`, `cardId`
  - `packages_user`: `userId`, `packageId`
  - `trade_marked_cards`: `userId`, `cardId`
- **snake_case:**
  - `user_purchase`: `user_id`, `card_id`
  - `quest_user`: `user_id`, `quest_id`
  - `trade_card`: `user_id`, `trade_id`, `card_id`
  - `user_trade`: `user_id`, `trade_id`

### 2.2. Modelos Centrais
1. **`User` (`users`):**
   - Campos essenciais: `id`, `username`, `email`, `money`, `level`, `xp`, `rarityPoints`, `isGuest`, `picture`.
   - Admin reservado: `admin@gmail.com` (possui abertura ilimitada de pacotes para testes e administração).
2. **`Card` (`cards`):**
   - Dados provenientes do TCGdex: `id`, `card_id`, `name`, `image_url`, `rarity` (1: Comum, 2: Rara, 3: Épica, 4: Mística, 5: Lendária), `hp`, `type`.
   - **Regra de Raridade:** Cartas V/ex/EX/GX são no mínimo Tier 3 (Épica); VMAX/VSTAR/Mega são no mínimo Tier 4 (Mística) ou Tier 5 (Lendária).
3. **`TradeMarkedCard` (`trade_marked_cards`):**
   - Registro de cartas que o usuário marcou para negociação. Cartas aqui presentes são as únicas elegíveis para criação de ofertas em `/trocas` e **não poderão ser usadas em decks de batalha**.
4. **`Package` (`packages`):**
   - Booster packs padrão e temáticos. Contém probabilidades ponderadas (`common_rarity`, `rare_rarity`, `epic_rarity`, `legendary_rarity`, `full_legendary_rarity`) e preço fixo.
5. **`Quest` (`quests`) e `QuestUser` (`quest_user`):**
   - Missões com níveis de metas (`levelGoals`), recompensas escalonadas (`levelRewards`) e consultas SQL dinâmicas parametrizadas (`queryCheck`).
6. **`Trade` (`trades`), `Trade_Card`, `Trade_Offer_Cards`:**
   - Negociações públicas no mercado com suporte a solicitação de cartas, moedas e contrapropostas.

---

## 3. Economia & Progressão Gamificada

### 3.1. Escala Monetária e Linha de 12 Pacotes Padrão
A economia foi calibrada para comportar o ganho sustentável de ouro a partir das missões e futuras batalhas. A loja possui 12 pacotes padrão clássicos organizados em ordem estrita de preço, além de 29 pacotes temáticos da TCGDex:
1. **Pacote simples** — 100 🪙
2. **Pacote raro** — 200 🪙
3. **Grande pacote** — 600 🪙
4. **Pacote épicos** — 2.000 🪙
5. **Pacote de Iniciação** — 2.500 🪙
6. **Pacote lendário** — 5.000 🪙
7. **Pacote Raro Kanto** — 5.000 🪙
8. **Grande pacote épico** — 10.000 🪙
9. **Pacote tudo ou nada** — 10.000 🪙
10. **Pacote Vórtice Sombrio** — 12.500 🪙
11. **Pacote Mítico Celestial** — 15.000 🪙
12. **Pacote Tempestade Elemental** — 42.000 🪙

*Observação:* Todos os pacotes padrão são exibidos juntos na seção "Pacotes Padrão", sem divisões artificiais ("boosters supremos definitivos").

### 3.2. Carregamento Tátil Instantâneo da Loja (Sem SSR Lag)
- `/loja` migrado de HOC de SSR bloqueante (`withAsyncFetchedData`) para Client Component nativo com TanStack Query (`useQuery`).
- Transição imediata de rota (0ms de latência percebida) com feedback visual contínuo através de `StoreSkeleton` e `loading.tsx`.
- Cache em memória com revalidação inteligente, garantindo que retornos à Loja ocorram com 0ms de espera.

### 3.3. Pacotes Temáticos Personalizados
- Substituição da denominação "lootbox" por *Pacote Temático Personalizado*.
- Teto rigoroso de investimento: **100.000 moedas**.
- Algoritmo de sorte proporcional baseado no valor investido com proteção contra cartas repetidas no mesmo lote.

### 3.3. Trilha de Recompensas Diárias & XP
- Trilha diária com crescimento exponencial, concedendo boosters raros nos marcos finais da semana.
- Progressão de nível com base em XP acumulado em aberturas e missões.

---

## 4. Fluxos de Interface & Experiência do Usuário (UX)

### 4.1. Abertura Otimizada de Pacotes
- **Zero Latency:** Pré-carregamento em segundo plano no momento da montagem do modal (`pack-opening-modal.tsx`) e pré-carregamento imediato do próximo pacote durante a tela de resumo (`phase === "summary"`).
- **Abertura em Lote (`BatchOpeningModal`):** Otimização no backend (`/open-packages`) gerando todas as cartas em memória agrupadas por tipo de pacote, executando um único `createMany` e reduzindo o tempo de resposta em 95%.
- **Celebração God Pull:** Animação especial em tela cheia com efeito sonoro `playGodPullFanfare()` quando uma carta Tier 5 é sorteada.

### 4.2. Coleção Inteligente & Client-Side Caching (Sem SSR Bloqueante)
- A tela `/colecao` opera como Client Component com TanStack Query (`useQuery(['my-cards', queryString])`), cache de 30 segundos e esqueleto de cards durante a navegação.
- Transições de filtros (Tipo elemental, Nível de raridade, Busca por nome, Abas Todas/Favoritas/Marcadas p/ Troca) são instantâneas, sincronizando a URL via `window.history.pushState` sem desmonte de árvore ou engasgos de SSR.
- Modal de alta resolução com botões de favoritar e marcar para troca com atualização reativa do grid.

### 4.3. Mercado de Trocas Confiável
- Povoado com treinadores emblemáticos (Red, Cynthia, Steven, Lance, Misty) ofertando cartas lendárias reais.
- O seletor de criação de oferta lista exclusivamente cartas marcadas pelo usuário na coleção.
- Taxa diária de manutenção de oferta: 2.000 moedas por dia de listagem.

### 4.4. Acessibilidade & Contraste
- Definição explícita de cores de texto (`text-zinc-900 dark:text-zinc-50`) em todas as variantes de botão para erradicar botões brancos sobre fundo branco em tema claro.
- `ToastViewport` fixado no canto superior direito (`top-4 right-4`), mantendo o caminho desimpedido para o carrinho de compras flutuante.

### 4.5. Mini Descrições `(i)` nos Booster Packs
- Botão translúcido interativo `(i)` no canto superior direito de cada pacote na Loja.
- Abre um Popover com nome, contagem exata de cartas (`cards_quantity`), custo e uma mini descrição contextualizando o que o pacote entrega (ex: taxas de god pull do Tudo ou Nada, foco de tipos elementais, etc.).

---

## 5. Práticas para Desenvolvimento Contínuo

- **Runtime Obrigatório:** `bun` em todos os scripts e execuções.
- **Ambiente de Desenvolvimento:** `bun dev:all` inicia o ecossistema completo com painel unificado.
- **Contrato de API:** Sempre usar `sucessResponse` e `errorResponse` de `src/lib/mount-response.ts`.
- **Testes Unitários:** `bun test` antes de submeter alterações de lógica crítica.
