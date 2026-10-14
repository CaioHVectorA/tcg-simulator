# CONTEXT.md — Estado e arquitetura do SimTCG

Revisão de 14/10/2026. Código implementado, validação local e operação em produção são estados diferentes. O roteiro de publicação está em `docs/release/2026-10-14.md`.

## Produto e limites

SimTCG oferece colecionismo Pokémon com moedas virtuais, pacotes, missões, álbuns, trocas, social e batalhas próprias contra NPCs. O ciclo é entrar → primeira abertura → colecionar/comprar → cumprir metas → trocar/batalhar → retornar. Não implementa integralmente as regras oficiais do TCG, pagamentos reais ou PvP. O app mobile foi removido.

## Arquitetura

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Inicialização | `src/index.ts` | Validar configuração, ativar jobs e ouvir HTTP |
| Composição | `src/app.ts` | Elysia, segurança, locale, controladores, readiness e WebSocket; importável nos testes sem abrir porta |
| HTTP | `src/controller/` | Schemas, autenticação, autorização e contratos de negócio |
| Serviços | `src/services/` | Pacotes, batalha, recompensas, quests e recuperação |
| Domínio/infraestrutura | `src/lib/` | Economia, idempotência, locks, sorteio, cache, jobs e transferência |
| Persistência | `prisma/schema.prisma` | PostgreSQL/Supabase; Prisma 6.16.2; 28 migrations |
| Web | `apps/www/src/` | Next.js 15.5.25, React 19 RC, TanStack Query, Radix, Framer Motion |
| Idiomas | Dicionários existentes + `shared/i18n/` | PT/EN/ES/JP, mensagens de sistema e padrões dinâmicos compartilhados |
| Entrega | Docker, Fly e workflows | Bun 1.3.5, CI com PostgreSQL e navegador, deploy do SHA validado |

`Cards_user`/`Packages_User` representam cópias físicas; quantidade é agregação das linhas. Favoritos/marcações referenciam o tipo de carta. `Transaction` persiste chave, hash do pedido e resultado de operações repetíveis. Trocas relacionam participantes via `User_Trade`; cartas via `Trade_Card`. Decks usam seis slots, até 20 PR; modo GO escolhe três cartas do deck. Cartas marcadas para troca são inelegíveis.

## Correções implementadas nesta release

- OAuth usa ID token Google verificado no servidor, audience configurada, email verificado e subject único. A web troca o ID token por sessão da API em endpoint server-side, sem entregá-lo no objeto da sessão cliente.
- JWT expira em sete dias e valida `authVersion`; produção recusa segredo curto/ausente. Não existe mais privilégio por `admin@gmail.com`. Respostas privadas usam seleção mínima e nunca incluem password.
- Recuperação usa token aleatório, hash em banco, validade de 15 minutos e consumo único. Troca de senha revoga sessões anteriores e fecha sockets. Entrega real Resend depende de configuração e ainda não foi verificada.
- Cadastro, pacotes iniciais, missões e indicação são transacionais. Contas têm unicidade normalizada por email/username; dados conflitantes interrompem a migração em vez de serem descartados.
- Compra, checkout, abertura, doação e combate usam débito/consumo condicionado e idempotência. Locks de participantes têm ordem estável. Diária antiga/nova compartilha intervalo de 24h; quests e resgates não duplicam recompensa.
- Trocas revalidam conclusão e cópias na transação, transferem inventário/saldo e limpam vínculos inválidos. Ofertas privadas exigem participante/convidado autorizado. Álbum consome coleção e impede recompensa repetida ou uso de cartas marcadas/ofertadas.
- Recomendação de deck usa programação dinâmica limitada por seis cartas/20 PR. Aquecimento do buffer e ranking têm concorrência limitada; cache deduplica carregamentos simultâneos. Missões diárias são rotacionadas sem repetir candidatos e seu progresso não é apagado por GET.
- Área foi registrada e o claim usa persistência. Isso não entrega a expansão Hunting/Safari.

## Tradução e experiência

O inventário inicial de tradução encontrou centenas de frases fixas fora dos dicionários. Componentes agora passam texto/atributos pelo tradutor existente, com catálogo compartilhado para mensagens da API, álbuns, tipos e quests dinâmicas. Paridade de 519 chaves por idioma é validada. `jp` interno corresponde a `ja-JP` externamente. Cookie, localStorage, HTML lang, metadata e headers seguem a seleção.

Valores de filtros/IDs e conteúdo escrito por jogadores permanecem estáveis. Nomes/artes de cartas seguem a fonte do catálogo. Os testes cobrem fluxos específicos; ainda é necessária revisão editorial por falantes, especialmente japonês e frases dinâmicas menos frequentes. Não tratar essas evidências como certificação de tradução de toda combinação possível.

Sessão mantém as páginas montadas. API tem timeout, callbacks estáveis, cancelamento de leituras e rejeita `ok:false` em qualquer método. Inventário usa query cliente e skeleton local; a URL de abertura não consome pacotes por GET. Aberturas removem esperas artificiais, impedem duplo clique, preservam chave em resposta incerta e mantêm a última carta/último pacote montado até fechar. Batalha recebeu correção de contrato das listas, velocidade e opção de pular animação. Movimento reduzido é respeitado. Header se recolhe em telas intermediárias; botões têm contraste explícito. Imagens usam carregamento assíncrono/lazy e versão low quando solicitada.

Não há medição representativa de p50/p95 em produção ou promessa de latência zero. Imagens e rede externas continuam influenciando a experiência.

## GitHub e operação

Branch de trabalho: `agents`; upstream `origin/agents`. A documentação de 13/10 foi publicada no commit `ce14544`. A implementação foi promovida para `main` no commit `0797f34a5b3a74ac328e83d882d306da4f68f862` e publicada no Fly em 14/10/2026, após autorização explícita do proprietário.

O problema histórico de token Fly ausente foi tratado com segredo do ambiente Production e token restrito de 30 dias. main mantém os checks obrigatórios; as exigências de aprovação manual de PR e do ambiente Production foram removidas a pedido explícito do proprietário. O workflow deploy usa o SHA validado por Validate. API exige origens CORS explícitas, configuração de banco e segredo de produção.

A máquina Fly estava suspensa antes da release. O banco existente tinha drift e recebeu o patch ensaiado em uma cópia PostgreSQL 17, após backup privado. As duas novas migrations foram registradas somente após diff vazio; o histórico anterior foi preservado. Leitura agregada encontrou zero emails/nomes normalizados duplicados e zero saldos negativos em 14/10. Repetir antes da manutenção.

Cron/cache/buffer/WebSocket seguem locais ao processo. Fly foi configurado para uma máquina sempre ativa; escalar requer coordenação externa. `/ping` é liveness e `/health/ready` verifica banco; monitor/alertas externos ainda precisam ser configurados. Segredos reais Google, Resend e domínio web devem ser conferidos em staging.

## Evidências de validação

- 98 testes Bun passaram, zero falhas: domínio, i18n, cache e 15 cenários de integração com PostgreSQL local. Incluem OAuth falsificado, DTO, compras concorrentes, replay de abertura/checkout/doação, diária/quest, GO, troca privada/concorrente, álbum concorrente e recuperação.
- Nove cenários Playwright passaram: cadastro convidado → primeira abertura nos quatro idiomas; sete telas internas em EN/ES/JP; mobile, redução de movimento, foco e resposta de compra recusada. Arte de pacote de fixture/fallback não comprova todos os assets reais.
- Typecheck API e build API passaram. Build Docker passou, não embute `.env`/SQLite; runtime recusou segredo ausente e readiness respondeu 200 com PostgreSQL local.
- As 28 migrations foram aplicadas localmente. Backup local foi restaurado em `tcg_restore_test`, com histórico atualizado. Isso não valida restauração do banco real.
- Inspeção visual mobile claro/escuro foi feita; matriz completa de dispositivos, rede lenta, todos os diálogos e artes reais permanece pendente.
- CI de branch, PR e main passaram, incluindo builds API/web/Docker e os nove cenários Playwright. O workflow Fly Deploy também passou para o SHA promovido.

## Prospecção e pendências externas

Eventos agregados de entrada, abertura, conversão, primeira troca/batalha e diária foram instrumentados via Analytics. Não enviam identificadores ou conteúdo de jogador. Deduplicação é local; D1/D7 e campanhas ainda precisam de implementação/validação e dados reais.

Banco e operação Fly foram preparados. Para ampliar o beta, validar Google/Resend e o domínio personalizado, completar o smoke de troca/batalha/álbum/conversão em produção, configurar monitor externo e acompanhar uma coorte pequena. Não houve contatos de divulgação nem confirmação de direitos de marcas/artes. Prioridades e critérios estão em `TODO.md`.

## Publicação confirmada em 14/10/2026

- API: https://poke-tcg-center.fly.dev — release Fly 68, uma máquina em `gru`, iniciada e sem cordon; auto-stop desligado e mínimo de uma máquina.
- `/ping` responde; `/health/ready` respondeu 200 com `ready:true`. CORS/preflight respondeu 204 para a origem pública verificada `https://tcg-caiohvectoras-projects.vercel.app`.
- Backup completo foi salvo fora do repositório, em diretório privado; schema público/dados da aplicação foram restaurados numa cópia local PostgreSQL 17 sem erros. Patch e baseline foram ensaiados nessa cópia antes de produção.
- Contagens preservadas na manutenção: cinco contas, 1.759 cópias de cartas e 130 pacotes. Os dois índices normalizados foram conferidos; não havia migrations falhas.
- Smoke real verificou convidado, DTO sem password/authVersion, cinco pacotes iniciais, abertura, replay sem consumo adicional e raridade crescente. A conta temporária foi removida.
- O primeiro start revelou que a máquina parada ainda não havia recebido os segredos preparados; `secrets deploy` e novo start resolveram. O processo confirmou JWT de 64 caracteres e conexão ao banco. Nenhum segredo foi publicado.
- `tcgsim.com` não respondeu à verificação. O endereço Vercel acima foi confirmado como site SimTCG e usado provisoriamente; o domínio definitivo ainda precisa de confirmação do proprietário. Resend não está configurado nesta API; entrega de recuperação e OAuth real ainda não foram certificados.
- Evidência: https://github.com/CaioHVectorA/tcg-simulator/actions/runs/38590393430 e https://github.com/CaioHVectorA/tcg-simulator/actions/runs/38590969868.
