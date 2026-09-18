# AGENTS.md — Guia de Desenvolvimento para Agentes de IA

> **Manual de Instruções e Boas Práticas para Agentes Autônomos e Pair Programming**  
> Repositório: **Pokémon TCG Simulator (`tcg-simulator` / `poke-tcg-center`)**  
> Última atualização: 13 de Setembro de 2026

---

## 1. Visão Geral e Filosofia do Projeto

Você está atuando no repositório **Pokémon TCG Simulator**, uma aplicação fullstack de simulação de Pokémon TCG com colecionismo, economia gamificada, abertura de booster packs e missões.

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
  bun dev               # Iniciar backend em modo watch (porta 8080)
  bun seed              # Executar seeds do banco
  bun build             # Rodar script de build do backend
  ```
- **No Frontend (`apps/www`):**
  ```bash
  cd apps/www
  bun dev               # Iniciar Next.js dev server (porta 3000)
  bun run build         # Validar build do Next.js
  ```
- ⚠️ **NUNCA** execute comandos com `yarn` ou `pnpm`. Evite `npm install` na raiz para não desconfigurar o monorepo do Bun.

---

## 3. Diretrizes do Backend (Elysia.js + Prisma)

### 3.1. Padrão de Resposta Padronizada
Todas as rotas da API devem seguir estritamente o contrato de resposta fornecido por `src/lib/mount-response.ts`:

```typescript
import { sucessResponse, errorResponse } from "../lib/mount-response";

// Sucesso:
return sucessResponse(data, "Mensagem opcional para toast no frontend");

// Erro:
set.status = 400; // ou 404, 401, 500
return errorResponse("Mensagem de erro interna", "Mensagem para toast do usuário");
```

Estrutura JSON gerada:
```json
{
  "ok": true,
  "data": { ... },
  "toast": "Operação realizada com sucesso!",
  "error": null
}
```

### 3.2. Estrutura de Rotas e Controladores
- Os controladores ficam em `src/controller/*.controller.ts`.
- Devem ser registrados em `src/index.ts` usando `.use(meuController)`.
- Use os schemas do Elysia (`t.Object`, `t.String`, `t.Number`, etc.) para tipar `body`, `query`, `params` e `response`.
- Sempre use o middleware JWT para rotas privadas:
  ```typescript
  .use(jwt)
  .decorate("user", {} as User)
  .onBeforeHandle(getUserUserMiddleware as any)
  ```

### 3.3. Transações Financeiras e de Estoque
- Sempre que houver débito/crédito de moedas (`User.money`) e alteração de cartas/pacotes, **utilize `prisma.$transaction([ ... ])`** para garantir atomicidade.
- Nunca faça deduções de saldo sem verificar antes se `user.money >= custo`.

### 3.4. Cuidado Crítico com Nomenclatura no Prisma
Atenção à inconsistência histórica nas chaves estrangeiras do schema:
- Algumas tabelas usam camelCase: `Cards_user.userId`, `Cards_user.cardId`, `Packages_User.userId`, `Packages_User.packageId`.
- Outras tabelas usam snake_case: `User_Purchase.user_id`, `User_Purchase.card_id`, `QuestUser.user_id`, `QuestUser.quest_id`, `Trade_Card.user_id`.
- ⚠️ **Sempre confira `prisma/schema.prisma` antes de escrever queries para não causar erros de tipagem em tempo de execução.**

### 3.5. Escopo de Usuário em Queries (Isolamento de Dados)
- ⚠️ **MANDATÓRIO:** Nunca faça queries de recursos do usuário (cartas, compras, recompensas, missões) sem incluir o filtro do ID do usuário autenticado (`where: { userId: user.id }` ou `where: { user_id: user.id }`).
- Nunca confie apenas em IDs passados via corpo de requisição se o recurso pertencer ao usuário logado.

---

## 4. Diretrizes do Frontend (Next.js 15 App Router)

### 4.1. Estrutura de Diretórios em `apps/www`
- `src/app/(app)/`: Páginas protegidas da aplicação com navegação principal compartilhada (`layout.tsx`).
- `src/components/ui/`: Primitivas visuais do Radix UI estilizadas com Tailwind.
- `src/components/`: Componentes globais (`header.tsx`, `avatar.tsx`, `reward-modal.tsx`).
- `src/hooks/`: Hooks reutilizáveis (`use-api.ts`, `use-auth.ts`, `use-toast.ts`).
- `src/context/`: Contextos React (`UserContext.tsx`).
- `src/modules/`: Componentes ricos organizados por domínio (`home`, `inventory`, `ranking`, `colection`).

### 4.2. Comunicação com a API
- Utilize preferencialmente o hook `useApi()` em componentes client-side:
  ```typescript
  const { get, post, patch, loading } = useApi();
  const res = await post('/packages/buy-many', { packagesId: [1, 2] });
  ```
- Para sincronização de estado com o servidor, combine `useApi` com `@tanstack/react-query`:
  ```typescript
  const qClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['minha-query'],
    queryFn: async () => {
      const res = await get('/meu-endpoint');
      return res.data.data;
    }
  });

  // Após mutações bem-sucedidas:
  await qClient.invalidateQueries({ queryKey: ['user'] });
  ```

### 4.3. Estilo e Design System
- Fonte padrão dos títulos e cabeçalhos: `font-syne` (Syne).
- Tema: Compatível com tema claro e escuro (`next-themes`, classes Tailwind `dark:`).
- Interatividade: Forneça sempre feedback visual em ações assíncronas (`LoaderSimple`, `disabled` em botões durante requisições, modais de confirmação ou toasts informativos).

---

## 5. Anti-Padrões & Armadilhas Conhecidas (Evite a todo custo!)

| Anti-Padrão | Consequência | Ação Correta |
|---|---|---|
| **Hardcodar URL da API** (`https://poke-tcg-center.fly.dev` ou `localhost:8080`) | Impede alternância entre dev e prod | Sempre usar `process.env.NEXT_PUBLIC_API_URL` com fallback seguro |
| **Ignorar `user.id` em queries** | Vazamento de cartas/compras entre usuários | Sempre filtrar por `userId: user.id` ou `user_id: user.id` |
| **Cache global sem identificador de usuário** | Usuário A vê o progresso de missões do Usuário B | Incluir `user.id` na chave de cache em memória |
| **Sorteio com `if (getted <= rarity)` sequencial** | Probabilidades distorcidas onde certas raridades nunca caem | Usar amostragem cumulativa proporcional |
| **Executar `npm install` na raiz** | Criação de lockfiles concorrentes e quebra do Bun | Usar apenas `bun install` ou `bun add` |
| **Esquecer de invalidar a query `user` após compras** | Saldo em tela não atualiza após comprar pacotes/cartas | Chamar `qClient.invalidateQueries({ queryKey: ['user'] })` |

---

## 6. Checklist Antes de Finalizar Qualquer Tarefa

1. [ ] **Tipagem TypeScript:** Nenhum `@ts-ignore` ou `any` adicionado desnecessariamente.
2. [ ] **Isolamento de Tenant:** Todas as operações com dados de usuário filtram por `user.id`.
3. [ ] **Consistência de Resposta:** Todas as novas rotas do backend usam `sucessResponse` ou `errorResponse`.
4. [ ] **Tratamento de Erros:** Erros capturados com mensagens amigáveis no `toast` e logs claros no console.
5. [ ] **Invalidação de Cache:** Ações que mudam dados no backend invalidam suas respectivas queries no TanStack Query.
6. [ ] **Responsividade:** Componentes novos ou alterados testados visualmente em mobile e desktop.
