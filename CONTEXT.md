# CONTEXT.md — Pokémon TCG Simulator (SimTCG)

> **Documento de Contexto Arquitetural, Domínio e Estado do Projeto**  
> Última atualização: 13 de Setembro de 2026

---

## 1. Visão Geral do Projeto

O **Pokémon TCG Simulator** (também identificado internamente como `poke-tcg-center` e `SimTCG`) é uma plataforma web fullstack gamificada para entusiastas de Pokémon Trading Card Game (TCG).

A proposta central do sistema é permitir que jogadores:
1. **Colecionem cartas**: Mais de 1.000 cartas de diversas coleções de Pokémon TCG cadastradas no banco com atributos como raridade, HP, tipo e imagens em alta resolução.
2. **Abram pacotes (Booster Packs)**: Simulação da abertura de boosters tradicionais e temáticos com probabilidades reais baseadas em faixas de raridade.
3. **Gerenciem economia virtual**: Moedas obtidas através de recompensas diárias (*bounty* escalável), sistema de afiliados/indicações, missões e conquistas.
4. **Cumpram missões**: Missões gerais multi-nível (metas cumulativas) e missões diárias rotativas validadas diretamente contra o banco de dados via consultas SQL analíticas.
5. **Comprem na Loja**: Compra individual ou em lote de booster packs e ofertas promocionais relâmpago de cartas avulsas com precificação dinâmica via algoritmo.
6. **Disputem Rankings**: Tabelas de classificação por Pontos de Raridade (soma de raridades obtidas), Patrimônio Financeiro (orçamento total) e Missões completadas.
7. **Social & Trocas (Em desenvolvimento)**: Sistema de amizades, doação de moedas, notificações internas, chat de mensagens e mercado P2P de trocas (1x1 ou ofertas flexíveis).

---

## 2. Estrutura do Repositório (Monorepo)

O projeto é configurado como um monorepo gerenciado pelo **Bun** (`workspaces: ["apps/*", "./"]`):

```
tcg-simulator/
├── .github/                  # Workflows de CI/CD
├── apps/
│   └── www/                  # Frontend Next.js 15 (App Router)
├── db/                       # Scripts e dados auxiliares de banco
├── docs/                     # Documentações do projeto (ERD, todo.md original)
├── prisma/                   # Schema Prisma, migrations e seeds
│   ├── seed/                 # Scripts de população de cards, pacotes, missões e users
│   ├── schema.prisma         # Schema central PostgreSQL
│   └── prisma.config.ts      # Configuração Prisma v7+
├── public/                   # Assets públicos do backend
├── src/                      # Backend Elysia.js (Bun Runtime)
│   ├── controller/           # Controladores de rota REST
│   ├── helpers/              # Singletons (Prisma client) e constantes
│   ├── lib/                  # Utilitários, rotinas de cron e lógica de negócio
│   ├── middlewares/          # JWT e Swagger
│   └── index.ts              # Ponto de entrada do servidor Elysia (porta 8080)
├── tests/                    # Diretório de testes (atualmente vazio)
├── widgets/                  # Scripts de build e automações Bun
├── Dockerfile                # Configuração de container Docker
├── fly.toml                  # Configuração de deploy no Fly.io (região gru)
├── package.json              # Dependências raiz e scripts
└── tsconfig.json             # Configuração TypeScript raiz
```

> **Nota Histórica:** Existia anteriormente um app mobile em React Native (`apps/mobile`), que foi descontinuado e completamente removido no commit `49791e1` para concentrar esforços na aplicação Web.

---

## 3. Tecnologias Utilizadas

### 3.1. Backend (`/`)
- **Runtime:** [Bun](https://bun.sh) (v1.1+) — execução ultra-rápida de TypeScript e gerenciador de pacotes nativo.
- **Framework Web:** [Elysia.js](https://elysiajs.com) (v1.1.5) — framework web tipado e focado em performance para Bun.
- **ORM & Banco:** [Prisma](https://www.prisma.io) (v6.16.2 / v7.2.0) conectando-se a um banco de dados **PostgreSQL** hospedado na **Supabase**.
- **Autenticação:** JWT (`@elysiajs/jwt`) + `bcrypt` para hash de senhas e geração de usuários convidados (*guest*).
- **Agendamento de Tarefas:** `@elysiajs/cron` para rotinas periódicas (rotação diária de cartas promocionais e missões diárias).
- **Documentação da API:** `@elysiajs/swagger` gerando OpenAPI em `/swagger`.
- **SDK Externo:** `@tcgdex/sdk` utilizado nos scripts de seed para importar cartas e expansões oficiais.
- **Segurança & Infra:** `elysia-helmet`, `@elysiajs/cors`, `@grotto/logysia` para logs estruturados.

### 3.2. Frontend (`apps/www`)
- **Framework:** [Next.js 15](https://nextjs.org) (App Router com React 18).
- **Estilização:** [Tailwind CSS](https://tailwindcss.com) v3.4, `tailwindcss-animate`, variáveis CSS nativas e tipografia personalizada (`font-syne`).
- **Componentes UI:** [Radix UI](https://www.radix-ui.com) primitives (Dialog, Sheet, DropdownMenu, Tabs, Toast, Progress, etc.), customizados no estilo shadcn/ui.
- **Animações:** `framer-motion` (utilizado no carrinho flutuante, revelações de cartas especiais e transições).
- **Gerenciamento de Estado de Servidor:** `@tanstack/react-query` v5 para cache, prefetch, sincronização e invalidação reativa.
- **Requisições HTTP:** `axios` encapsulado em hooks personalizados (`useApi`, `useFetch`).
- **Autenticação:** `next-auth` integrado para suporte a login social (Google) e persistência de sessão via cookies.
- **Ícones:** `lucide-react` e `@radix-ui/react-icons`.

---

## 4. Arquitetura do Banco de Dados & Modelos

O banco de dados relacional PostgreSQL possui 21 tabelas mapeadas no Prisma:

```mermaid
erDiagram
    User ||--o{ Cards_user : "possui"
    User ||--o{ Packages_User : "possui"
    User ||--o{ User_Purchase : "compra"
    User ||--o{ QuestUser : "progresso"
    User ||--o{ Friend_User : "amizades"
    User ||--o{ messages : "envia/recebe"
    User ||--o{ notifications : "recebe"
    User ||--o{ ReferrerProtocol : "cria"
    User ||--o{ Referred : "indicado"
    User ||--o{ User_Trade : "participa"
    User ||--o| User_Ranking : "posição"

    Card ||--o{ Cards_user : "instanciado em"
    Card ||--o{ Promotional_Cards : "em destaque"
    Card ||--o{ Trade_Card : "em negociação"
    Card ||--o{ trade_offer_cards : "em oferta"
    Card ||--o{ User_Purchase : "comprado avulso"

    Package ||--o{ Packages_User : "instanciado em"
    Package ||--o{ User_Purchase : "comprado"

    Quest ||--o{ QuestUser : "associada"
    Trade ||--o{ User_Trade : "participantes"
    Trade ||--o{ Trade_Card : "cartas da troca"
    Trade ||--o{ trade_offers : "ofertas de troca"
    Trade ||--o| trade_requests : "solicitação direta"
```

### Principais Entidades:
- **`User`**: Conta do jogador. Guarda saldo (`money`), `totalBudget` (para ranking monetário), `rarityPoints` (pontuação para ranking de colecionador), timestamp do último resgate (`last_daily_bounty`), nível de recompensa diária (`daily_bounty_level`), avatar (`picture`), status `isAdmin`, `isGuest` e provedor de autenticação (`email`, `google`, `guest`).
- **`Card`**: Carta de Pokémon. Identificador TCG único (`card_id`), `name`, `image_url`, `rarity` (1=Comum, 2=Rara, 3=Épica, 4=Lendária, 5=Ultra/Full Art), `hp` e `type`.
- **`Package`**: Booster pack. Guarda probabilidades de drop (`common_rarity`, `rare_rarity`, `epic_rarity`, `legendary_rarity`, `full_legendary_rarity`), `price`, `cards_quantity`, e `tcg_id` (se for pacote temático de uma expansão específica).
- **`Packages_User` & `Cards_user`**: Tabelas de posse. `Packages_User` controla pacotes não abertos (`opened = false`), enquanto `Cards_user` armazena cada carta individual do inventário do usuário.
- **`Quest` & `QuestUser`**: Sistema de missões. A `Quest` guarda um array de metas (`levelGoals: Int[]`), recompensas (`levelRewards: Int[]`), descrições por nível (`description: String[]`) e a query analítica parametrizada em SQL (`queryCheck`). `isDiary` e `isDiaryActive` determinam se é uma missão diária.
- **`Trade`, `Trade_Card`, `User_Trade`, `trade_offers`, `trade_requests`**: Estrutura avançada de trocas entre jogadores com suporte a dinheiro na troca, ofertas parciais e pedidos diretos 1x1.
- **`Promotional_Cards`**: Cartas promocionais exibidas na loja com desconto sobre o `original_price`, renovadas diariamente via cron.
- **`ReferrerProtocol` & `Referred`**: Sistema de código de convite único com recompensa financeira ao resgatar convidados qualificados.

---

## 5. Módulos Funcionais e Regras de Negócio

### 5.1. Autenticação & Gestão de Usuários (`/auth`, `/user`)
- **Login Convencional**: Email e senha com hash bcrypt.
- **Modo Convidado (`/auth/guest`)**: Criação instantânea com 1 clique de usuário temporário com nome aleatório `Convidado {id}`, gerando token JWT de acesso imediato.
- **Login Social Google (`/auth/google`)**: Autenticação OAuth que cadastra o usuário com foto e email do Google.
- **Bounty Diário (`/user/bounty` & `/user/bounty-time`)**: Coleta diária de moedas a cada 24 horas. O valor escala com base no número de dias ausente e no nível acumulado (`daily_bounty_level`).
- **Sistema de Amigos (`/user/friends`, `/user/requests`)**: Envio, aceitação, rejeição e remoção de amizades.

### 5.2. Loja & Carrinho Flutuante (`/store`, `/packages`, `apps/www/src/app/(app)/loja`)
- **Vitrine Híbrida**: Pacotes normais (8 cartas, 16 cartas), pacotes temáticos de expansões (ex: XY, Sun & Moon) e cartas avulsas promocionais.
- **Carrinho Flutuante Reativo (`kart-floating.tsx`, `use-kart.tsx`)**: Permite adicionar múltiplos boosters e cartas ao carrinho com persistência e checkout atômico em batch (`/store/checkout` com transação Prisma).
- **Modal de Sucesso & Recompensa**: Feedback visual com animações comemorativas (`reward-modal.tsx`, `purchase-success-modal.tsx`).

### 5.3. Abertura de Pacotes (`/packages/open`, `/packages/open-packages`)
- Ao abrir um booster:
  1. O backend busca o pool de cartas correspondente (filtrando por `tcg_id` ou geral).
  2. Um algoritmo sorteia as cartas baseado nas raridades configuradas no pacote.
  3. O pacote em `packages_user` é marcado como `opened = true`.
  4. As cartas sorteadas são inseridas em lote em `cards_user`.
  5. Os `rarityPoints` do usuário são incrementados proporcionalmente às cartas obtidas.

### 5.4. Missões & Quests Engine (`/quests`)
- Missões permanentes possuem vários níveis de progressão (ex: ter 10, 50, 100 cartas; ter 3, 5, 10 cartas de fogo).
- Missões diárias rotacionam todos os dias às 10h da manhã (selecionando 3 missões ativas).
- **Motor de Validação**: O backend executa o SQL salvo em `quest.queryCheck` substituindo `$GOAL` pela meta do nível atual e `$USER_ID` pelo ID do usuário autenticado. Se `mission_complete` retornar verdadeiro, o botão de resgate fica disponível.
- O resgate (`PATCH /quests/get-reward/:id`) credita as moedas, incrementa `currentLevel` ou marca como `completed`.

### 5.5. Rankings (`/ranking`)
- **Ranking Geral de Raridade (`/ranking`)**: Ordenado por `rarityPoints DESC`.
- **Ranking Financeiro (`/ranking/monetary`)**: Ordenado por `totalBudget DESC`.
- **Ranking de Missões (`/ranking/quests`)**: Previsto para ranquear por missões concluídas.

---

## 6. Infraestrutura, Scripts & Execução

### Variáveis de Ambiente Necessárias
```ini
# Backend (.env)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="seu_jwt_secret"
CLIENT_URL="http://localhost:3000"
PORT="8080"

# Frontend apps/www (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:8080" # ou URL de produção
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu_nextauth_secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Comandos de Desenvolvimento
```bash
# Instalar dependências (na raiz)
bun install

# Iniciar servidor backend Elysia (porta 8080 com hot-reload)
bun dev

# Rodar seeds no banco de dados
bun seed

# Iniciar aplicação web Next.js 15 (porta 3000)
cd apps/www
bun dev
```

---

## 7. Diagnóstico Técnico: Pontos de Atenção & Bugs Identificados

Durante a varredura profunda no código-fonte, foram identificados os seguintes problemas críticos que precisam de correção:

1. **Bug de Probabilidade de Raridade no Sorteio de Boosters (`src/lib/open-package.ts`)**:
   - No método `getRandomCardFromPackage`, a checagem `if (getted <= pkg.common_rarity) return "common"` seguida de `if (getted <= pkg.rare_rarity)` não é cumulativa. Se `common_rarity = 0.5` e `rare_rarity = 0.3`, qualquer número menor que 0.5 cai em "common", e números maiores que 0.5 são maiores que 0.3, logo nunca caem em "rare". É necessário usar faixas cumulativas de probabilidade acumulada (`cumulative distribution`).

2. **Vazamento de Dados em Cartas Compradas na Loja (`src/controller/store.controller.ts`)**:
   - O endpoint `GET /store/bought-promotional` executa `prisma.user_Purchase.findMany({ where: { card_id: { not: null } } })` sem filtrar por `user_id: user.id`. Logo, se um jogador comprar uma carta promocional, ela é exibida como já comprada para **todos** os usuários da plataforma.

3. **Bug no Resgate do Gengar Especial (`src/controller/special.controller.ts`)**:
   - A query `prisma.cards_user.findFirst({ where: { Card: { card_id: GENGAR_CARD_ID } } })` não filtra por `userId: user.id`. Apenas o primeiro jogador que resgatou o Gengar consegue a carta; para todos os demais jogadores o sistema retorna "Você já possui esse card!".

4. **Crash em Potencial no Cron de Cartas Promocionais (`src/lib/cards-cron.ts`)**:
   - Linha 5: `rarity = [Math.floor(Math.random() * 2), 2, 3, 4, 4, 5][index]`. Quando o índice é 0, a raridade pode ser sorteada como `0`. A função `getPrice(rarity)` acessa `weights[rarity - 1]`, resultando em `weights[-1]` (`undefined`), quebrando a execução do cron.
   - Linha 22: O índice aleatório soma `firstId?.id || 1` a uma posição de array `cards[random]`, causando estouro de índice (`cards[random] = undefined`).

5. **Colisão no Cache Global de Missões (`src/controller/quests.controller.ts`)**:
   - O cache em memória utiliza como chave `quest-${quest.Quest.id}` sem incluir o `user.id`. Se o usuário A consultar suas missões e o usuário B consultar nos próximos 5 segundos, o usuário B recebe os dados e o progresso do usuário A.

6. **URL da API Hardcoded no Frontend (`apps/www/src/lib/api.ts`)**:
   - `const baseURL = "https://poke-tcg-center.fly.dev"` está fixado no código e comentado o localhost, impedindo testes locais contra o backend local sem alterar o arquivo manualmente. Deve usar `process.env.NEXT_PUBLIC_API_URL`.

7. **Rotas Inexistentes no Menu do Usuário (`apps/www/src/components/header.tsx`)**:
   - O menu do usuário aponta para `/perfil` e `/config`, mas nenhuma dessas rotas existe no App Router, gerando erro 404 ao clicar.

8. **Tela de Trocas Incompleta (`apps/www/src/app/(app)/trocas/page.tsx`)**:
   - A página de trocas apenas renderiza o componente `<LargeWip />` ("Funcionalidade em desenvolvimento"), embora o backend já possua um `trade.controller.ts` parcial (que também contém falha na criação de trocas sem os campos obrigatórios `name` e `hash`).

9. **Dockerfile Desatualizado (`Dockerfile`)**:
   - O Dockerfile tenta copiar `bun.lockb` e `package-lock.json` que foram removidos do repositório, e expõe a porta `3000` enquanto o `fly.toml` escuta na porta `8080`.
