# AGENTS.md — Guia de Desenvolvimento para Agentes de IA

> **Manual de Instruções, Regras de Negócio e Boas Práticas para Agentes Autônomos e Pair Programming**  
> Repositório: **Pokémon TCG Simulator (`tcg-simulator` / `poke-tcg-center`)**  
> Última atualização: **20 de Setembro de 2026**

---

## 1. Visão Geral e Filosofia do Projeto

Você está atuando no repositório **Pokémon TCG Simulator**, uma aplicação fullstack de simulação de Pokémon TCG com colecionismo, economia gamificada, abertura de booster packs de alta fluidez, missões e mercado de trocas entre treinadores.

### Estrutura Monorepo:
- **Backend (`./` na raiz):** API REST de alta performance construída em **Elysia.js** sob o runtime **Bun**, com persistência via **Prisma ORM** e banco de dados **PostgreSQL** (Supabase).
- **Frontend (`apps/www`):** Aplicação web moderna construída em **Next.js 15** (App Router, React 18, Tailwind CSS, Radix UI, TanStack Query v5 e Framer Motion).
- **Mobile (`apps/mobile`):** **Descontinuado e removido.** Não referencie nem tente restaurar arquivos em `apps/mobile`.

---

## 2. Padrões Técnicos & Ferramentas

### 2.1. Runtime e Gerenciador de Pacotes
- **Sempre utilize `bun`** como runtime e gerenciador de pacotes padrão na raiz:
  ```bash
  bun install           # Instalar dependências
  bun dev:all           # Iniciar backend (8080) e frontend (3000) concorrentes
  bun test              # Executar suite completa de testes unitários
  bun x prisma db push  # Sincronizar schema Prisma com o banco
  ```
- **No Frontend (`apps/www`):**
  ```bash
  cd apps/www
  bun dev               # Iniciar Next.js dev server (porta 3000)
  bun run build         # Validar build do Next.js
  ```
- ⚠️ **NUNCA** execute comandos com `yarn` ou `pnpm`. Evite `npm install` na raiz para não desconfigurar o monorepo do Bun.

---

## 3. Regras de Negócio Fundamentais

### 3.1. Reclassificação Rigorosa de Raridades
- Cartas com mecânicas avançadas (**V**, **ex**, **EX**, **GX**) **NUNCA** podem ser classificadas como Comum (Tier 1) ou Rara (Tier 2). Devem ter raridade mínima $\ge 3$ (Épica).
- Cartas **VMAX**, **VSTAR** e **Megas** devem ter raridade mínima $\ge 4$ (Mística) ou Tier 5 (Lendária/God Pull).

### 3.2. Sistema de Trocas & Restrição de Decks de Batalha
- O usuário escolhe quais cartas deseja disponibilizar no mercado marcando-as individualmente na sua Coleção (`trade_marked_cards` / model `TradeMarkedCard`).
- O endpoint `/cards/my-tradeable` e a tela `/trocas` exibem **estritamente** cartas presentes em `trade_marked_cards` para o usuário autenticado.
- **Regra de Batalha:** Cartas marcadas para troca **não podem** ser utilizadas na montagem de Decks para o modo Batalha.

### 3.3. Economia Rebalanceada, Pacotes Temáticos & Revelação
- A loja oferece exatamente 12 pacotes padrão clássicos organizados em ordem estrita de preço (de 100 até 42.000 moedas: Simples, Raro, Grande, Épicos, Iniciação, Lendário, Raro Kanto, Grande Épico, Tudo ou Nada, Vórtice Sombrio, Mítico Celestial, Tempestade Elemental), além de todos os pacotes temáticos da TCGDex.
- Não utilizar divisões artificiais ("boosters supremos definitivos"); todos os pacotes padrão residem na seção "Pacotes Padrão".
- A terminologia **"lootbox" está banida** da interface e das rotas públicas em favor de *"Pacote Temático Personalizado"*.
- Pacotes personalizados possuem **teto obrigatório de 1.000.000 moedas (1M)** tanto no seletor do frontend quanto na validação do backend (`POST /packages/thematic-lootbox`), com escalonamento de volume de cartas (até 25) e chances de raridades míticas.
- **Ordem Obrigatória de Revelação:** As cartas abertas de qualquer pacote devem ser sempre reveladas em **ordem crescente de raridade** (do menos raro para o mais raro: Tier 1 $\to$ Tier 5), preservando o suspense clássico do Pokémon TCG até a última carta.
- **Identidade Visual de Boosters:** Pacotes temáticos utilizam o componente `BoosterPackArt` com acabamento metalizado e logo oficial (`logoUrl`), sem logos soltos em fundos vazios ou imagens de cartas distorcidas.
- A navegação para a Loja é instantânea e tátil (0ms), utilizando TanStack Query (`useQuery`), esqueleto pulsante (`StoreSkeleton`) e `loading.tsx`, sem engasgos de SSR.

---

## 4. Diretrizes do Backend (Elysia.js + Prisma)

### 4.1. Padrão de Resposta Padronizada
Todas as rotas da API devem seguir estritamente o contrato de resposta fornecido por `src/lib/mount-response.ts`:

```typescript
import { sucessResponse, errorResponse } from "../lib/mount-response";

// Sucesso:
return sucessResponse(data, "Mensagem opcional para toast no frontend");

// Erro:
set.status = 400; // ou 404, 401, 500
return errorResponse("Mensagem de erro interna", "Mensagem para toast do usuário");
```

### 4.2. Estrutura de Rotas e Controladores
- Os controladores ficam em `src/controller/*.controller.ts` e são registrados em `src/index.ts` usando `.use(meuController)`.
- Use os schemas do Elysia (`t.Object`, `t.String`, `t.Number`, etc.) para validação de entrada e saída.
- Sempre use o middleware JWT para rotas autenticadas:
  ```typescript
  .use(jwt)
  .decorate("user", {} as User)
  .onBeforeHandle(getUserUserMiddleware as any)
  ```

### 4.3. Operações em Lote e Performance com Supabase PgBouncer
- Evite loops sequenciais com `await prisma.model.findFirst()` dentro de coleções de usuários. Utilize conjuntos (`Set`), queries em lote (`findMany`) e inserções agregadas (`createMany({ skipDuplicates: true })`) para não estourar os limites de conexão do pooler.

### 4.4. Cuidado Crítico com Nomenclatura no Prisma
- Algumas tabelas usam camelCase: `Cards_user.userId`, `Cards_user.cardId`, `Packages_User.userId`, `Packages_User.packageId`.
- Outras tabelas usam snake_case: `User_Purchase.user_id`, `User_Purchase.card_id`, `QuestUser.user_id`, `QuestUser.quest_id`, `Trade_Card.user_id`.
- Modelos recentes: `TradeMarkedCard` (`trade_marked_cards`) usa `userId` e `cardId`.
- ⚠️ **Sempre confira `prisma/schema.prisma` antes de escrever queries.**

### 4.5. Escopo de Usuário em Queries (Isolamento de Dados)
- ⚠️ **MANDATÓRIO:** Nunca faça queries de recursos do usuário sem incluir o filtro do ID autenticado (`where: { userId: user.id }` ou `where: { user_id: user.id }`).

### 4.6. Eliminação de Laços Sequenciais em Supabase PgBouncer
- **NUNCA execute queries SQL sequenciais em laços `for`:** Com servidores em regiões distantes (ex: Supabase em `us-east-1` e cliente local no Brasil), a latência round-trip de 1.5s a 2s se multiplica por N queries.
- Sempre utilize paralelização com `Promise.all(...)` ou agregação em uma única query SQL.
- Tabelas com alto volume de consulta (`cards_user`, `packages_user`, `cards`) devem manter índices explícitos para colunas de filtro (`userId`, `cardId`, `opened`, `rarity`, `type`).

---

## 5. Diretrizes do Frontend (Next.js 15 App Router)

### 5.1. Contexto Global do Usuário Não-Bloqueante
- O `UserProvider` (`apps/www/src/context/UserContext.tsx`) **nunca deve desmontar a árvore de componentes** ou substituir `{children}` por uma tela inteira de loading. As páginas devem carregar seus próprios layouts e esqueletos locais enquanto a sessão do usuário é validada em segundo plano.
- Nunca adicione delays arbitrários (`setTimeout`) em interceptors de autenticação.

### 5.2. Preferência por Client Components com TanStack Query para Telas Interativas
- Telas com filtros dinâmicos intensos (como `/colecao` e `/loja`) funcionam como Client Components utilizando `useQuery` com `staleTime`, oferecendo respostas imediatas a cliques, estados de shimmer suaves e sincronização de query params via `window.history.pushState` sem recarregamento ou congelamento de SSR.

### 5.3. Abertura Otimizada de Pacotes
- Aberturas individuais (`pack-opening-modal.tsx`) utilizam pré-carregamento em segundo plano (`prefetchPromiseRef`) e pré-carregamento durante a tela de resumo (`phase === "summary"`), eliminando congelamentos durante a transição do rasgo.

### 5.4. Interatividade Tátil, Acessibilidade & Popovers
- Ações críticas de resgate (como "Coletar Recompensa" em missões) devem disparar áudio imediato via `soundFx` e apresentar estado de carregamento local (`LoaderSimple`) no botão acionado.
- Booster packs na Loja possuem botão informativo `(i)` com Popover do Radix UI contendo mini descrição e quantidade de cartas.
- O `ToastViewport` do Radix UI deve ser mantido no canto superior direito (`top-4 right-4`) para jamais sobrepor o menu de carrinho flutuante no canto inferior direito.
- Variantes de botão (`outline`, `ghost`, etc.) devem conter definições explícitas de cor de texto (`text-zinc-900 dark:text-zinc-50`) para prevenir botões brancos em fundo branco em tema claro.

---

## 6. Checklist Antes de Finalizar Qualquer Tarefa

1. [ ] **Tipagem TypeScript:** Nenhum `@ts-ignore` ou `any` adicionado desnecessariamente.
2. [ ] **Isolamento de Tenant:** Todas as operações com dados de usuário filtram por `user.id`.
3. [ ] **Consistência de Resposta:** Todas as novas rotas do backend usam `sucessResponse` ou `errorResponse`.
4. [ ] **Tratamento de Erros:** Erros capturados com mensagens amigáveis no `toast` e logs claros no console.
5. [ ] **Invalidação de Cache:** Ações que mudam dados no backend invalidam suas respectivas queries no TanStack Query.
6. [ ] **Contraste Visual:** Testado em modo claro e escuro sem quebra de contraste.
7. [ ] **Build Limpo:** `bun test` e `cd apps/www && bun run build` executam sem erros.
