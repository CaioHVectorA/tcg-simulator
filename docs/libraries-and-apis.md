# Mapeamento de Bibliotecas, APIs e Origem dos Dados

> **Documentação de Arquitetura, Tecnologias e Proveniência de Dados**  
> Repositório: **Pokémon TCG Simulator (`tcg-simulator` / `poke-tcg-center`)**  
> Data: 18 de Setembro de 2026

---

## 1. Visão Geral da Arquitetura

O projeto é estruturado como um monorepo de alta performance executado sob o runtime **Bun**:
- **Backend (API REST + WebSockets):** Localizado na raiz (`./`), desenvolvido com **Elysia.js** e **Prisma ORM**, conectado ao PostgreSQL (Supabase).
- **Frontend (Web SPA / SSR):** Localizado em `apps/www`, desenvolvido em **Next.js 15** (App Router), **React**, **Tailwind CSS**, **Radix UI** e **TanStack Query**.

---

## 2. Mapeamento de Bibliotecas do Backend

| Biblioteca | Versão | Função Principal no Sistema |
|---|---|---|
| **`elysia`** | `^1.1.5` | Framework web ultrarrápido construído sobre o runtime Bun. Roteamento, middlewares e tipagem estática ponta-a-ponta. |
| **`@elysiajs/jwt`** | `^1.1.0` | Autenticação via JSON Web Tokens com assinatura segura (`auth.controller.ts`, `ws.controller.ts`). |
| **`@elysiajs/cors`** | `^1.1.1` | Gerenciamento de políticas de Cross-Origin Resource Sharing para requisições do frontend. |
| **`@elysiajs/cron`** | `^1.1.1` | Execução de tarefas agendadas em segundo plano (rotação diária de cartas promocionais e missões). |
| **`@elysiajs/swagger`** | `^1.1.1` | Geração automática de documentação OpenAPI/Swagger em `/swagger`. |
| **`@elysiajs/static`** | `^1.1.1` | Servidor de arquivos estáticos da pasta `public/`. |
| **`@sinclair/typebox`** | `^0.34.14` | Validação de schemas em tempo de compilação e execução (`t.Object`, `t.String`, etc.). |
| **`@prisma/client` / `prisma`** | `6.16.2` | ORM para modelagem, migrações e consultas tipadas ao banco de dados PostgreSQL. |
| **`@grotto/logysia`** | `^0.1.4` | Middleware de logging estruturado de requisições HTTP e latência. |
| **`bcrypt` / `@types/bcrypt`** | `^5.1.1` | Hash criptográfico unidirecional com salt para senhas de usuários e upgrades de conta. |
| **`@tcgdex/sdk`** | `^2.5.1` | SDK oficial da comunidade TCGdex para consulta e importação de cartas de Pokémon TCG. |
| **`dotenv`** | `^17.2.3` | Carregamento de variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `PORT`). |
| **`elysia-helmet`** | `^2.0.0` | Headers HTTP de segurança padrão da indústria para a API. |

---

## 3. Mapeamento de Bibliotecas do Frontend (`apps/www`)

| Biblioteca | Versão | Função Principal no Sistema |
|---|---|---|
| **`next`** | `15.0.2` | Framework React com App Router, server components, otimização de imagens e rotas dinâmicas. |
| **`react` / `react-dom`** | `19.0.0-rc` / React 18 | Biblioteca central de renderização de interfaces de usuário reativas. |
| **`@tanstack/react-query`** | `^5.62.11` | Gerenciamento de estado de servidor, cache, refetching, mutações e invalidação atômica de queries. |
| **`framer-motion`** | `^11.15.0` | Biblioteca de animações complexas: abertura física de pacotes 3D, God Pull celebration e transições de página. |
| **`@radix-ui/react-*`** | `^1.1.x` - `^2.1.x` | Primitivas de UI headless acessíveis: Dialog, DropdownMenu, Tabs, Sheet, Popover, Switch, Progress, Tooltip, HoverCard. |
| **`lucide-react`** | `^0.460.0` | Conjunto consistente e moderno de ícones vetoriais. |
| **`tailwindcss` / `tailwind-merge`** | `^2.5.4` | Framework CSS utilitário com fusão dinâmica de classes e tema customizado (Syne font). |
| **`next-themes`** | `^0.3.0` | Alternância instantânea de temas Claro / Escuro / Sistema sem flash de renderização. |
| **`axios`** | `^1.7.7` | Cliente HTTP utilizado internamente pelo hook customizado `useApi` para interceptação e bearer tokens. |
| **`react-hook-form` / `zod`** | `^7.53` / `^3.23` | Validação de formulários declarativa (registro, login, criação de trocas). |
| **`recharts`** | `^2.13.3` | Gráficos e visualizações de progresso de coleção e estatísticas no perfil do treinador. |
| **`embla-carousel-react`** | `^8.5.1` | Carrosséis responsivos de pacotes na loja e banners de destaques. |
| **`react-simple-typewriter`** | `^5.0.1` | Efeito de digitação em textos dinâmicos de diálogos e boas-vindas. |

---

## 4. De Onde Vem a API das Cartas? (Proveniência dos Dados)

### 4.1. Provedor Principal: TCGdex
A base de cartas e pacotes do simulador é alimentada pelo **TCGdex**, uma API pública, colaborativa e multilíngue de Pokémon TCG mantida pela comunidade open-source.

- **Website Oficial:** [https://www.tcgdex.net/](https://www.tcgdex.net/)
- **Documentação da API:** [https://tcgdex.dev/](https://tcgdex.dev/)
- **Repositório GitHub:** `tcgdex/cards-database`
- **Endpoints Utilizados:**
  - Cartas em Português: `https://api.tcgdex.net/v2/pt/cards/`
  - Pacotes e Coleções: `https://api.tcgdex.net/v2/pt/series/` e `/sets/`
- **CDN de Imagens WebP de Alta Resolução:**
  - Qualidade Padrão: `https://assets.tcgdex.net/pt/{set}/{cardId}/low.webp`
  - Alta Qualidade: `https://assets.tcgdex.net/pt/{set}/{cardId}/high.webp`
  - Helper do Projeto: `apps/www/src/lib/load-tcg-img.ts`

### 4.2. Normalização de Raridade no Simulador
Como o Pokémon TCG possui dezenas de raridades textuais ("Common", "Rare Holo V", "Secret Rare", "Illustration Rare"), o simulador normaliza tudo para uma escala numérica inteira de **1 a 5**:

| Escala (DB) | Rótulo | Raridade Original TCGdex | Taxa Típica em Booster |
|---|---|---|---|
| **1** | Comum | Common, Uncommon, Energy | ~50% a 70% |
| **2** | Rara | Rare, Holo Rare | ~20% a 30% |
| **3** | Épica | Ultra Rare, Radiant Rare, V, GX, EX | ~10% a 15% |
| **4** | Lendária | Secret Rare, Special Illustration Rare | ~3% a 5% |
| **5** | Ultra Rara / God Pull | Hyper Rare, Gold Secret, Alternate Art VMAX | ~0.5% a 1% |

### 4.3. Provedor Secundário: PokeAPI (Sprites e Avatares)
Para avatares de perfil e sprites oficiais de Pokémon e Treinadores, utiliza-se a CDN oficial do **PokeAPI**:
- Base: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/`
- Renderização em SVG/PNG transparente de alta fidelidade para avatares do sistema (`Pikachu`, `Charizard`, `Gengar`, `Mewtwo`, etc.).

---

## 5. Motor de Síntese Sonora Sem Arquivos Externos

O simulador adota uma abordagem de alto desempenho para efeitos sonoros (`apps/www/src/lib/sound-fx.ts`):
- **Web Audio API Nativa:** Todos os efeitos (rasgar de pacote, clique de flip de carta, sinos de carta rara, aura épica, fanfarra lendária e o novo God Pull Fanfare) são **sintetizados diretamente no navegador via osciladores, filtros biquad e envelopes de ganho**.
- **Vantagens:** Latência zero, zero dependência de downloads de arquivos `.mp3`/`.wav` externos, funciona offline e não consome banda do usuário.
