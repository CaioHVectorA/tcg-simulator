# TODO.md — Preparação do beta e prospecção

Atualizado em 14/10/2026. `[x]` indica implementação com a evidência especificada, nunca publicação automática. Roteiro operacional: `docs/release/2026-10-14.md`.

## P0 — Correções implementadas e verificadas localmente

- [x] Validar identidade Google no servidor; rejeitar autenticação forjada por email. DTOs mínimos, segredos obrigatórios e remoção de privilégios por email.
- [x] Debitar/consumir atomicamente; persistir idempotência em checkout/abertura/doação/combate. Integração verifica concorrência, replay e saldo.
- [x] Diária, quests e resgates sem recompensa repetida. GET não apaga progresso diário.
- [x] Onboarding transacional, cinco pacotes e quests; constraints normalizadas para contas.
- [x] Validar multiplicidade/posse/elegibilidade no deck e modo GO; recomendação limitada por seis slots/20 PR.
- [x] Transferência de troca com locks e limpeza de inventário/deck/favoritos. Teste de aceitação simultânea e acesso privado.
- [x] Álbum com consumo condicionado e claim único. Teste concorrente; mantém bloqueio de cartas marcadas/ofertadas.
- [x] Recuperação de senha com token de uso único e revogação de sessões/sockets. Entrega de email real permanece abaixo.
- [x] Tradução centralizada na arquitetura existente, paridade dos quatro idiomas e jornada real de primeira abertura. Sete telas internas em EN/ES/JP sem chaves expostas/erros de navegador nos cenários cobertos.
- [x] Remover esperas artificiais de abertura; loading local, timeout, tratamento de cancelamento/erro de negócio, redução de movimento e controle de playback.
- [x] Header responsivo, contraste dos botões e foco de menu. Evidência mobile claro/escuro; ampliar matriz abaixo.
- [x] CI com banco/navegador/builds, runtime Bun fixo, readiness, workflow do SHA validado e revisão de Production. Credencial Fly configurada, com rotação pendente.
- [x] Reconstruir 28 migrations e restaurar backup em banco local descartável. Proposta de patch para drift existente preparada, sem aplicação em produção.
- [x] Registrar área e persistir seu claim. Hunting/Safari continua fora do escopo desta release.

## P0 — Ainda necessário para publicar

- [x] **Banco existente:** backup real e restauração verificada; reproduzir drift em staging, revisar/aplicar patch e registrar migrations somente após equivalência comprovada. Aceite: diff/constraints/histórico conferidos e rollback ensaiado. Não executar migração histórica cegamente.
- [x] **Operação Fly:** resolver suspensão, confirmar recursos/cobrança, segredos e uma instância sempre ativa. Aceite: readiness estável, jobs após reinício e smoke test sem duplicação.
- [ ] **Identidade/email/domínio:** conferir client Google/callback, remetente Resend, recuperação entregue, URLs HTTPS/CORS/cookies e suporte. Aceite: login Google e recuperação reais em staging, sem expor token na sessão cliente.
- [ ] **Smoke completo em staging:** cadastro → abertura → compra → quest → troca entre duas contas → GO → álbum → conversão → recuperação. Cobrir rede indisponível, sessão expirada e último pacote. Testes locais não substituem essa validação.
- [x] **CI e promoção:** branch, PR e main verdes; promoção e deploy autorizados explicitamente pelo proprietário, sem aprovação manual. SHA de código `0797f34`, Fly release 68. Documentação posterior não altera esse código publicado.
- [ ] **Observabilidade:** monitor externo, alertas de readiness/erros, logs operacionais e procedimento de incidente. Aceite: alerta e restauração ensaiados.
- [ ] **Performance representativa:** medir p50/p95, erro, pool e memória com catálogo/volume real e rede lenta. Definir metas com dados, sem prometer 0ms.
- [ ] **Matriz visual/editorial:** revisar falantes PT/EN/ES/JP, frases dinâmicas, artes reais, teclado/diálogos, claro/escuro e dispositivos adicionais. Corrigir evidências que a coorte trouxer.
- [ ] **Dependências:** avaliar React RC/tipos e vulnerabilidades resolvidas antes de release; não trocar frameworks por inferência.
- [ ] **Rotação Fly:** token do ambiente Production expira após 30 dias; rotacionar antes de 13/11/2026.

## P1 — Prospecção com evidência

- [x] Instrumentar cadastro/convidado, conversão, abertura, primeira troca/batalha e diária com eventos agregados, sem PII/conteúdo.
- [ ] Validar recebimento real dos eventos, origem de campanhas, consentimento/privacidade e deduplicação de coorte. Implementar retorno D1/D7; deduplicação local não é retenção medida.
- [ ] Landing e materiais explicam moedas virtuais, coleção e combate próprio; preparar demo/capturas reais e convite rastreável.
- [ ] Domínio/SEO: URLs públicas, canonical por página, robots/sitemap e previews reais. Infraestrutura existe; domínio final ainda precisa de confirmação.
- [ ] Revisar termos, privacidade, marcas/artes/dados e público menor de idade antes de divulgação ampla. Não assumir direitos por existência dos assets.
- [ ] Convidar 20–30 participantes após P0/smoke. Medir primeira abertura sem ajuda, conversão, D1/D7 e motivo de abandono; estabelecer metas após observar a coorte.
- [ ] Configurar feedback e acompanhamento; contato com comunidades/criadores depende de autorização específica. Nenhum contato foi realizado.
- [ ] Ampliar tráfego gradualmente com operação/ativação/retenção observadas; aquisição paga depende desses dados.

## P2 — Evolução após beta

- [ ] Coleção pública compartilhável com consentimento e projeções seguras.
- [ ] Novos filtros somente quando necessários; reconciliar #66 com funcionalidades existentes.
- [ ] Hunting/Safari (#52), PvP e outras mecânicas exigem especificação própria.
- [ ] Francês/alemão e revisão editorial ampliada, preservando i18n existente.
- [ ] Coordenação externa de cron/cache/WebSocket antes de múltiplas instâncias.
- [ ] Padronização Prisma somente com benefício e migration compatível; estética não bloqueia beta.

## Registro da revisão

98 testes Bun e nove cenários Playwright passaram localmente. Integração utiliza PostgreSQL isolado e é ignorada sem `TCG_TEST_DATABASE_URL`. Builds API/web e visual passaram localmente; CI remoto de branch/PR/main e workflow Fly Deploy passaram. Nenhuma issue foi encerrada automaticamente; #1, #55/#56, #60/#61/#72 e #73–#77 têm correções/evidências para revisão, sem afirmar escopo integral concluído.

## Evidência de publicação

Em 14/10, banco real foi preparado com backup/restauração da aplicação em cópia PostgreSQL 17, patch transacional e baseline conferido. Fly está ativo em uma máquina, com readiness 200 e CORS confirmado. Smoke real de entrada/primeira abertura/replay passou e sua conta temporária foi removida. Monitor externo, domínio personalizado, Resend/OAuth real e demais fluxos de produção continuam pendentes conforme os itens acima.

## Correção de login publicado

- [x] Investigar o endereço real informado pelo proprietário: `tcg-alpha.vercel.app`; liberar essa origem no Fly.
- [x] Cobrir a regressão de produção apontando a API para localhost; compartilhar resolução entre convidado/cliente e troca Google no servidor.
- [x] Confirmar convidado no navegador em `tcg-alpha.vercel.app`: publicação `f952ed2`, entrada em `/home`, inventário com cinco pacotes e 500 moedas; conta de teste removida. 103 testes Bun e dez cenários E2E passaram no CI da PR #83.
- [ ] Validar Google com uma identidade real. Callback da origem alpha e client ID compatível com a API foram conferidos; isso não comprova o consentimento e login completos.
- [ ] Ajustar variáveis na Vercel quando houver acesso: `API_URL` e `NEXT_PUBLIC_API_URL` devem apontar para `https://poke-tcg-center.fly.dev`. A versão publicada rejeita os domínios conhecidos do frontend e usa esse backend como fallback.

## Batalha e balanceamento

- [x] Implementar arena por turnos com energia/vida, intenção rival, escudo, troca, pausa/retomada, teclado e feedback imediato; preservar três escolhas de slots, inclusive cópias possuídas.
- [x] Persistir no journal existente, isolar jogador, rejeitar turno desatualizado e premiar conclusão uma vez. Testes HTTP incluem partida vencida, retry da ação decisiva, concorrência e usuário alheio.
- [x] Conter farm em todos os modos: sem prêmio por derrota e duas revanches remuneradas/NPC/dia UTC após primeira vitória.
- [x] Auditar catálogo real sem escrita: relatório em `docs/balance/2026-10-14.md` e script agregado reproduzível.
- [ ] Recalibrar preços/chances/diárias como uma curva, com estratégia de transição para níveis; corrigir XP proveniente dos próprios marcos monetários. Não transformar probabilidades de cópias em promessa de completar álbum.
- [ ] Medir diversão e legibilidade do duelo com jogadores; treino e ausência de limite de tempo por ação não equivalem a feedback validado de uma coorte.
