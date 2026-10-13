# TODO.md — Do código ao beta com prospecção

Atualizado em 13/10/2026. Backlog orientado por evidência do código e GitHub. Itens sem checkbox concluído ainda exigem trabalho/verificação. Estimativas comerciais abaixo são metas propostas, não resultados observados.

## Diagnóstico

O produto tem um núcleo funcional amplo, mas ainda não está pronto para divulgação aberta. Segurança de autenticação, integridade econômica, migrations e operação precisam passar pelos critérios abaixo. A última tentativa automática de deploy falhou por token Fly ausente.

## P0 — Bloqueios antes de disponibilizar o beta

- [ ] **Verificar identidade Google no backend.** `src/controller/auth.controller.ts`: substituir confiança em email por ID token verificado ou ponte autenticada de servidor. Aceite: token falso/expirado, emissor/audience incorretos e email arbitrário não emitem JWT; fluxo legítimo e indicação continuam funcionando.
- [ ] **Eliminar defaults e exposição de segredos.** JWT/NextAuth devem exigir secrets em produção; remover logs de DATABASE_URL/token e sanitizar erros. Aceite: boot falha com configuração incompleta, logs não revelam credenciais e origens CORS são explícitas. Avaliar rotação dos segredos que possam ter sido expostos.
- [ ] **Remover privilégios por email.** `PackageService`: usar autorização por `isAdmin` e controles explícitos. Aceite: cadastrar `admin@gmail.com` não concede inventário ou aberturas ilimitadas.
- [ ] **Respostas de usuário com projeção segura.** `/user/me` e demais handlers: DTO sem senha/hash, campos internos ou dados privados de terceiros. Aceite: testes HTTP verificam payloads e escopo de usuário.
- [ ] **Corrigir multiplicidade no modo GO.** `fightNpcGo` usa Map por cardId e aceita IDs repetidos sem contar cópias; também não exige vínculo das escolhas com o deck salvo. Aceite: uma única cópia não pode ocupar três posições e a seleção obedece à regra de produto definida para o modo.
- [ ] **Validar quantidades e limites.** Checkout/pacotes/doações: inteiros positivos, limite por pedido, IDs válidos, moedas finitas. Aceite: zero, negativos, frações, grandes volumes e itens repetidos não criam saldo/inventário indevido.
- [ ] **Proteger economia contra concorrência/replay.** Débito condicional e consumo verificável dentro da transação; aplicar idempotência vinculada ao usuário/operação. Aceite: duas aberturas simultâneas do mesmo pacote concedem uma; compras simultâneas não deixam saldo negativo; retry retorna resultado consistente. Cobrir também recompensas, trocas, doações, álbuns e batalhas.
- [ ] **Reproduzir schema com migrations.** Comparar migrations com modelos/índices atuais e criar evolução revisada. Aceite: PostgreSQL vazio e cópia de staging chegam ao mesmo schema via `prisma migrate deploy`, com backup/restauração ensaiados. Não usar `db push` como solução de produção.
- [ ] **Fechar contexto Docker.** Excluir `.env`, `.env.*` mantendo exemplo quando necessário, bancos locais e artefatos indevidos; revisar SQLite rastreado. Aceite: imagem/contexto sem credenciais nem dados privados, install com lockfile e imagem construída em CI.
- [ ] **Restabelecer deploy e separar ambientes.** Configurar `FLY_API_TOKEN` no GitHub com escopo adequado, secrets da API/web e alvo staging. Aceite: deploy staging verde, web e API acessíveis por HTTPS, URLs/OAuth/CORS corretos. Evidência do bloqueio: https://github.com/CaioHVectorA/tcg-simulator/actions/runs/36367658589
- [ ] **CI antes de release.** Testes Bun, build web/API e validação Prisma em PR; corrigir exit code do build API em falha; proteger branch de release. Aceite: teste ou build quebrado impede promoção.

## P1 — Operação e qualidade do beta

- [ ] **Runbook de release.** Escolher hospedagem web, domínio canônico e API; documentar responsáveis, variáveis, migrations, smoke test, rollback, backups e suporte. Unificar domínios de SEO/NextAuth/links.
- [ ] **Readiness e monitoramento.** Distinguir liveness de banco/cache pronto, registrar erros sem dados sensíveis e criar alertas úteis. Aceite: falha de banco/deploy é detectada e há procedimento de recuperação.
- [ ] **Crons e estado em memória.** Definir instância sempre ativa ou agendador externo; garantir execução única dos jobs e estratégia de WebSocket/cache em múltiplas instâncias. Aceite: missões/promoções/ranking funcionam após reinício e inatividade.
- [ ] **Onboarding recuperável.** Garantir cinco pacotes iniciais e quests sem estado parcial silencioso; revisar criação concorrente/normalização e unicidade de contas. Aceite: falha no meio do cadastro pode ser recuperada sem bônus duplicado.
- [ ] **E2E em staging isolado.** Cadastro/convidado → abertura → compra → missão → troca entre duas contas → batalha → álbum → conversão de conta. Cobrir sessão expirada, rede indisponível, autorização e repetição. Evitar banco real de produção.
- [ ] **Batalhas novas.** Testes do serviço e HTTP para modo GO, repetição de IDs, posse/marcação, escolha de três dentro da regra de seis, recompensas e abuso de chamadas. Não assumir cobertura por testes do modo antigo.
- [ ] **Álbuns e negociação.** Confirmar consumo em UI, excluir cartas reservadas quando aplicável e revalidar multiplicidade do deck após consumo/troca. Aceite: colecionar não corrompe oferta ou deck e resgate concorrente não duplica prêmio.
- [ ] **UX com evidência visual.** Mobile/desktop, claro/escuro, teclado/foco, movimento reduzido, imagens/avatar, estados vazios e rede lenta; evitar engasgos de abertura e checkout. Registrar cenários e resultados.
- [ ] **Carga representativa.** Medir p50/p95, taxa de erros, pool PostgreSQL e memória no pico de abertura/quest; limitar aquecimento do buffer e queries paralelas. Definir metas com base nas medições, sem prometer 0ms de rede.
- [ ] **Recuperação de conta e suporte.** Fluxo seguro de recuperação, email transacional configurado, tratamento de erros Resend e canal de feedback. Validar remetente e resposta do provedor.
- [ ] **Compatibilidade de dependências.** Revisar React RC/tipos React 18, runtime e versões resolvidas; registrar avaliação de vulnerabilidades atualizada antes de release.
- [ ] **Áreas.** Decidir registrar e validar `areaController` ou sinalizar funcionalidade indisponível sem chamadas quebradas. Hunting/Safari permanece expansão de produto.

## P1 — Prospecção: transformar visita em jogador que volta

- [ ] **Posicionamento honesto.** Landing explica coleção, abertura e batalha própria; CTA claro para experimentar como convidado. Explicitar moedas virtuais e caráter independente do projeto.
- [ ] **Medição do funil.** Eventos propostos: `landing_view`, `guest_created`, `first_pack_opened`, `account_upgraded`, `first_trade_completed`, `first_battle_completed`, `daily_reward_claimed`, `return_d1`, `return_d7`. Definir deduplicação, origem de campanha e privacidade. Vercel Analytics existente não comprova esse funil.
- [ ] **Beta inicial acompanhado.** Meta proposta: 20–30 participantes com perfil de colecionador. Preparar roteiro curto, canal de feedback e registro de problemas; priorizar conclusão da primeira abertura sem ajuda.
- [ ] **Retenção antes de volume.** Medir tempo até primeira abertura, conversão convidado→conta, retorno D1/D7 e motivos de abandono. Definir metas a partir da primeira coorte; não inventar taxa de sucesso.
- [ ] **Material de divulgação.** Demo curta da abertura/fichário, capturas reais, página compartilhável e convite rastreável. Preparar conteúdos e lista de comunidades/criadores; contato externo depende de escopo autorizado.
- [ ] **SEO consistente.** Domínio real, canonical por página, robots/sitemap, preview social com imagem e idiomas coerentes com URL/cookie. Evitar canonical da landing em todas as páginas e validar `?lang=` de fato.
- [ ] **Preparação de confiança.** Revisar termos/privacidade, uso de artes/marcas/dados TCGdex e tratamento de público menor de idade com profissionais adequados antes de divulgação ampla ou monetização. Esta revisão não confirma direitos/licenças.
- [ ] **Release gradual.** Abrir convites após P0 e smoke test; acompanhar a primeira coorte, corrigir incidentes e só ampliar tráfego com operação estável. Não investir em aquisição paga antes de entender ativação/retenção.

## P2 — Evolução após validar o beta

- [ ] Binder/coleção pública compartilhável, com consentimento e sem dados privados.
- [ ] Filtros adicionais somente após identificar necessidade; revisar o que já existe (#66).
- [ ] Hunting/Safari (#52), PvP e novas mecânicas: especificação própria após validação do ciclo atual.
- [ ] Francês/alemão e revisão editorial completa; manter a arquitetura i18n existente até haver motivo comprovado para migrar.
- [ ] Padronização de nomes Prisma apenas se trouxer benefício, com migration compatível; não bloqueia beta por estética.

## Reconciliação com issues do GitHub

Consulta de 13/10/2026. Não encerrar sem validar o escopo original e anexar evidência:

| Issues | Evidência atual / próximo passo |
| --- | --- |
| #1 testes | 75 testes descobertos; falta integração real e CI |
| #2 / #70 WebSocket | `/ws` e manager presentes; validar reconnect, autorização e múltiplas instâncias |
| #5 favoritos | `FavoriteCard` e endpoint presentes; validar fluxo |
| #11 batalhas | NPC tático e GO presentes; escopo oficial/PvP não entregue |
| #55 / #56 social/trocas | Código presente; confirmar fluxo entre contas e concorrência |
| #63 promocionais | Checkout compra cartas; backlog antigo estava desatualizado |
| #64 resgate em lote | `/quests/claim-all` presente; validar atomicidade |
| #67 missão completada | Título real trata persistência de conclusão, não deduplicação de seed |
| #73–#77 i18n/deploy | Dicionários próprios presentes; tradução completa e deploy ainda exigem validação |
| #60 / #61 / #72 | Reproduzir diária, Google+indicação e estado de promoção antes de fechar |

## Evidências desta revisão

- [x] Fetch e comparação de main/agents/develop, issues, PRs e runs.
- [x] Mapeamento de arquitetura, modelos, fluxos, configuração e riscos; reescrita documental.
- [x] `bun test`: 75 pass, 0 fail, 13 arquivos, 1.192 assertions.
- [x] Build web: `bun run build` em `apps/www` passou, incluindo compilação, checagem de tipos e geração de 23 páginas. Next resolvido: 15.5.25.
- [ ] E2E, verificação visual, carga, reconstrução de banco e deploy: não executados nesta tarefa documental.

## Critério de liberação

Beta: todos os P0 atendidos, web/API staging e migrations comprovados, fluxo principal E2E sem falhas críticas, rollback e suporte definidos. Prospecção ampliada: beta operável, funil medido e problemas de ativação/retorno tratados. Funcionalidades novas não compensam falhas nesses critérios.
