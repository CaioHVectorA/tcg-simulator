# CONTEXT.md — Estado e arquitetura do SimTCG

Revisão de 13/10/2026, baseada no código local, refs obtidas com `git fetch origin` e consultas ao GitHub. Este documento descreve evidências; não certifica produção.

## Produto

O ciclo central é entrar → receber recursos iniciais → comprar/abrir pacotes → colecionar → cumprir missões/álbuns → ganhar moedas → trocar e batalhar → voltar para recompensas diárias. A experiência de abertura e o fichário são diferenciais visíveis. O combate é uma mecânica própria de NPCs, não um simulador integral das regras oficiais de Pokémon TCG.

Há landing page, cadastro/login por senha, convidado e conversão para conta permanente, integração Google, perfil/avatar, coleção/favoritos, inventário, loja e promoções, missões, recompensa diária, ranking, indicação, social/chat/notificações, trocas, álbuns e batalha. Presença de código não significa fluxo validado em produção.

## GitHub e baseline

- Repositório: https://github.com/CaioHVectorA/tcg-simulator
- Branch revisada: `agents`, HEAD `047d094`, igual a `origin/agents` antes desta revisão documental.
- `origin/main`: `e2b9320`; `agents` contém três commits adicionais: otimizações de banco/cache, fichário/resgate e buffer/mode GO. A diferença abrange 26 arquivos.
- `origin/develop`: `8f125eb`, ancestral do HEAD local (36 commits de diferença); não há motivo para sobrescrever o trabalho com essa branch antiga.
- Upstream local de `agents` apontava para `origin/main`; deve acompanhar `origin/agents`.
- Nenhum PR aberto no momento da consulta. Issues abertas incluem itens já parcialmente implementados; títulos/IDs foram conferidos, sem encerrar issues automaticamente.
- Os cinco últimos runs consultados de “Fly Deploy” falharam. No último, de 28/09/2026, o token de deploy chegou vazio: `no access token available`.
- Evidência: https://github.com/CaioHVectorA/tcg-simulator/actions/runs/36367658589

## Mapa de responsabilidades

| Camada | Local | Papel |
| --- | --- | --- |
| Inicialização API | `src/index.ts` | CORS, JWT, helmet, Swagger, `/ping`, `/ws`, controladores e crons |
| HTTP/domínio | `src/controller/*.controller.ts` | Autorização, validação, persistência e respostas |
| Serviços | `src/services/` | Pacotes, batalha e buffer de sorteios |
| Lógica e infraestrutura | `src/lib/` | Engine de batalha, sorteio, cache TTL, quests SQL, ranking, cron e WebSocket |
| Persistência | `prisma/schema.prisma` | PostgreSQL com conexão pooler e `DIRECT_URL` para acesso direto |
| Web | `apps/www/src/app/` | App Router, landing, login e páginas do grupo `(app)` |
| UI e estado | `components/`, `modules/`, `context/`, `hooks/` na web | Aberturas, fichário, layout, API, sessão e cache cliente |
| Idiomas | `apps/www/src/i18n/`, `src/i18n/` | Dicionários próprios e negociação de locale |
| Operação | `Dockerfile`, `fly.toml`, `.github/workflows/`, `widgets/` | API no Fly, scripts locais/build/seed |

`area.controller.ts` existe, mas não é registrado em `src/index.ts`; a página `/areas` não comprova API operacional. Não há app mobile.

## Dados e invariantes

`Card` e `Package` são catálogos. `Cards_user` e `Packages_User` representam cópias possuídas; quantidade é agregada sobre linhas, não um campo de saldo. `FavoriteCard` e `TradeMarkedCard` identificam o tipo de carta por usuário, não cada cópia individual.

`User` concentra saldo e progressão; `rarityPoints` também recebe recompensas chamadas XP. `User_Purchase` guarda compras; `Transaction` tem chave única de idempotência usada, por exemplo, em resgate de álbum. Ter o modelo não significa que toda mutação seja idempotente.

Trocas envolvem `Trade`, `User_Trade`, `Trade_Card`, ofertas e solicitações. Social usa relações de amizade, mensagens, doações e notificações. Missões têm metas/recompensas por nível e `QuestUser` com vínculo único por usuário/missão. Decks são slots em `UserDeckCard`; resultados em `UserBattleRecord`.

Álbuns oficiais são definidos no controlador; resgate consome uma cópia por alvo, registra claim e concede moedas/pontos. Se acabam as cópias, limpa vínculos de favoritos, marcações e deck. Validar concorrência e negociação ativa permanece necessário.

## Fluxos principais

- Autenticação: bcrypt + JWT próprio para API; NextAuth Google na web. Cadastro/convidado/Google tentam conceder cinco pacotes básicos e missões. Falhas nessas concessões são capturadas separadamente, podendo deixar onboarding incompleto.
- Loja: `/store/data` é público; checkout privado consulta preços no servidor, cria compras/inventário e debita moedas. O campo `query.key` existe, mas não é usado para idempotência no handler.
- Pacotes: `PackageService` compra e abre individualmente/em lote; personalizado aceita 500–1M e até 25 cartas. Sorteio usa pool por raridade; resultado é ordenado antes da resposta. Buffer pré-sorteia 20 aberturas por pacote e repõe em background; não elimina round-trips de persistência.
- Coleção: catálogo/posse, favoritos e marcação de troca; consumidores cliente usam cache e filtros.
- Batalha: modo tático usa seis cartas até 20 PR, três rotas, tipos/terrenos/sinergia. Modo GO recebe três cartas escolhidas e usa simulação própria; limites precisam de testes diretos do serviço. Não há PvP comprovado.
- Missões/ranking: queries analíticas e crons; parte da cache e presença fica em memória. Reinício perde estado transitório.
- Idiomas: português, inglês, espanhol e japonês já implementados em dicionários TS. Paridade de algumas chaves nos testes não comprova tradução completa, SEO localizado ou ausência de texto fixo.

## Configuração e deploy

| Variável | Consumidor | Observação |
| --- | --- | --- |
| `DATABASE_URL` | Prisma/API | PostgreSQL pooler; nunca logar |
| `DIRECT_URL` | Prisma | Conexão direta para migrations |
| `SECRET_JWT` | API | Atualmente tem fallback inseguro |
| `CLIENT_URL` | CORS/API | Fallback atual permite origens amplas |
| `PORT` | API | 8080 por padrão |
| `NEXT_PUBLIC_API_URL` | Web | Fallback aponta para API Fly; configurar local/staging explicitamente |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth | Secret tem fallback; URL faz parte da configuração operacional |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth | Há aliases legados `CLIENT_ID`/`SECRET_GOOGLE` |
| `RESEND_KEY` | Ação de relatório | Remetente de teste e destinatário fixo no código |
| `FLY_API_TOKEN` | GitHub Actions | Último run recebeu valor vazio |

`.env.example` só documenta banco e conexão direta. Arquivos `.env`/`.env.local` não foram copiados nem seus valores expostos.

Docker instala dependências do workspace, gera Prisma e executa `src/index.ts`; não publica a web. `.dockerignore` não exclui explicitamente `.env*` e cópias SQLite. O workflow faz deploy ao push em `main`, sem job prévio de teste/build. `fly.toml` usa região `gru`, 1 GB e mínimo zero máquinas, sem check de readiness do banco nem etapa explícita de migration. Auto-stop exige decisão sobre crons e WebSocket.

As migrations versionadas vão até fevereiro de 2025, enquanto o schema possui modelos/índices posteriores. É necessário provar reconstrução de banco vazio e upgrade antes de deploy. Não se inferiu o estado do banco remoto nem se executaram seeds/migrations.

## Riscos concretos encontrados

1. `/auth/google` aceita email/nome/imagem sem verificar token Google ou sessão confiável; para conta Google existente, pode emitir JWT com base somente no email informado.
2. `SECRET_JWT || "secret"` e `NEXTAUTH_SECRET || "TEST"`; logs de URL do banco e token de login.
3. Privilégio de abertura/inventário ilimitado baseado em `admin@gmail.com` em `PackageService`, independente de `isAdmin`.
4. `/user/me` retorna usuário completo, incluindo hash de senha; revisar outros DTOs também.
5. Checkout aceita `quantity: t.Number()` sem inteiro positivo/teto. Quantidade negativa pode inverter o débito de moedas.
6. Compras verificam saldo fora da transação; abertura consulta pacote disponível antes de consumi-lo. Corridas podem debitar além do saldo ou conceder duas aberturas. Transação sozinha não valida precondições concorrentes.
7. `.dockerignore` permite entrada de arquivos de ambiente no contexto de build; bancos SQLite antigos são rastreados. Classificar conteúdo antes de remover e tratar eventual exposição.
8. `fightNpcGo` resolve seleção via Map por cardId: IDs repetidos não revalidam quantidade de cópias e escolhas não são limitadas ao deck salvo.
9. Domínios divergem: metadata usa `tcg-simulator.com`, tema NextAuth usa `tcgsim.com`, API usa Fly. Não foi comprovada titularidade/configuração desses domínios.

## Verificação e limites

`bun test`: 75 passaram, zero falhas, 13 arquivos descobertos. Parte dos testes replica regras localmente; não representa E2E HTTP, PostgreSQL real, OAuth ou concorrência. `tests/user.controller.ts` não segue o padrão `.test.ts` e não se deve assumir que foi executado.

Build web passou: Next.js resolvido 15.5.25, compilação, checagem de tipos e geração de 23 páginas concluídas. Não foram feitos deploy, mudanças de banco, testes de carga, inspeção visual em browser ou auditoria integral de segurança. Relatório de performance de 04/10 é histórico, não medição desta revisão.

## Direção de lançamento

O núcleo do produto já existe. O próximo marco é um beta confiável com aquisição mensurável: fechar os bloqueios P0, validar onboarding com pessoas reais, medir primeira abertura e retorno, e só então ampliar divulgação. Novos modos, idiomas e recursos não substituem confiabilidade do ciclo central.
