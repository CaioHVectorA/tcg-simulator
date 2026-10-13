# AGENTS.md — Guia de trabalho

Atualizado em 13/10/2026. Repositório: `CaioHVectorA/tcg-simulator`.

## Como usar a documentação

- `AGENTS.md`: regras para alterar o projeto.
- `CONTEXT.md`: arquitetura, domínio, evidências e limites conhecidos.
- `TODO.md`: prioridades e critérios de aceite para lançamento.
- Documentos em `docs/`, `context.md` e `docs/todo.md` são referências históricas; não substituem os três arquivos acima. Havendo divergência, confira o código e registre a decisão.
- Não declare uma funcionalidade pronta somente porque existe uma tela ou um teste. Diferencie implementação, verificação local e operação em produção.

## Produto e estrutura

SimTCG é uma experiência de colecionismo Pokémon com moedas virtuais, abertura de pacotes, missões, álbuns, trocas, social e batalhas próprias contra NPCs. Não implemente regras oficiais de TCG ou pagamentos reais por inferência.

- API: `src/index.ts`, Bun, Elysia, Prisma 6 e PostgreSQL/Supabase.
- Web: `apps/www`, Next.js 15 App Router, React 19 RC conforme manifests, Tailwind, Radix, TanStack Query v5 e Framer Motion. Confira versões resolvidas no lockfile.
- Dados: `prisma/schema.prisma`, migrations e seeds; ferramentas em `widgets/`.
- `apps/mobile` foi descontinuado e removido; não restaurar.

## Fluxo de desenvolvimento

1. Confira `git status`, branch, upstream e instruções antes de editar. Faça fetch quando precisar comparar GitHub; preserve alterações existentes.
2. Leia os controladores, serviços, consumidores e modelos relacionados à mudança.
3. Faça a menor alteração coerente com o domínio. Não aproveite uma correção para trocar frameworks, renomear todas as tabelas ou expandir o produto.
4. Valide os comportamentos afetados e atualize contexto/backlog quando o estado mudar.
5. Informe o que foi executado, o que falhou e o que não foi verificado. Nunca transforme relatórios antigos em medições atuais.

Use Bun; nunca yarn ou pnpm, e não use npm install na raiz:

```bash
bun install --frozen-lockfile
bun dev:all
bun dev:back
bun dev:front
bun test
bun run build
cd apps/www && bun run build
```

`bun run build` na raiz gera o bundle da API; não constrói o frontend. Verifique o resultado, pois `widgets/build.ts` atualmente apenas imprime falhas. Seeds e comandos Prisma que escrevem no banco exigem conhecer o ambiente alvo. Não execute `bun seed`, `prisma db push`, resets ou scripts de benchmark contra produção durante uma revisão. Em produção, use migrations revisadas e backup; `db push` serve somente para desenvolvimento controlado.

## Regras de negócio que devem permanecer

- V, ex, EX e GX: raridade mínima Tier 3. VMAX, VSTAR e Mega: mínima Tier 4.
- Revelação de qualquer pacote: raridade crescente, Tier 1 → 5, inclusive lote e buffer.
- Loja: 12 pacotes padrão na seção “Pacotes Padrão”, em preço crescente, de 100 a 42.000 moedas: Simples, Raro, Grande, Épicos, Iniciação, Lendário, Raro Kanto, Grande Épico, Tudo ou Nada, Vórtice Sombrio, Mítico Celestial e Tempestade Elemental; temáticos separados por coleção TCGdex.
- Use “Pacote Temático Personalizado” na interface. O endpoint legado `/packages/thematic-lootbox` existe; migrar nome público com compatibilidade, sem quebrar clientes.
- Personalizado: mínimo 500, máximo 1.000.000 moedas, até 25 cartas; validar no backend e frontend.
- Temáticos usam `BoosterPackArt` e `logoUrl`, acabamento metalizado e proporções preservadas.
- `/cards/my-tradeable` e `/trocas`: somente cartas marcadas pelo usuário em `TradeMarkedCard`. Cartas marcadas ficam indisponíveis para batalha.
- Deck tático atual: 6 cartas, teto 20 PR; modo GO tem seleção de 3 cartas. Validar posse, multiplicidade e elegibilidade no servidor ao salvar e ao lutar.
- Resgate de álbum consome cópias da coleção. Exigir confirmação clara, transação e prevenção de resgate repetido; reconciliar decks, favoritos e negociação.
- Moedas, recompensas e consumo de inventário são decisões do servidor. Débito e concessão precisam ser atômicos, resistentes a concorrência e repetição.

## API, segurança e persistência

- Controladores em `src/controller/`, registrados explicitamente em `src/index.ts`; serviços em `src/services/`, lógica pura em `src/lib/`.
- Respostas de negócio usam `sucessResponse(data, toast)` e `errorResponse(error, toast)` de `src/lib/mount-response.ts`, com status HTTP coerente. O nome `sucessResponse` é o contrato existente.
- Rotas privadas usam JWT e `getUserUserMiddleware`; valide parâmetros com schemas Elysia. Não copie casts `any` como padrão para código novo.
- Dados privados precisam de escopo por ID autenticado. Recursos públicos e operações entre participantes exigem projeção e autorização explícitas; nunca confiar em userId enviado pelo cliente.
- Confira nomes reais no schema: `Cards_user.userId/cardId`, `Packages_User.userId/packageId`, `User_Purchase.user_id/card_id`, `QuestUser.user_id/quest_id`, `TradeMarkedCard.userId/cardId`. `Trade_Card` usa `card_id/trade_id/is_sender`; o vínculo com usuário está em `User_Trade`.
- Nunca retornar `password` ou objetos completos de usuário em respostas públicas/privadas. Use `select` e DTOs mínimos.
- Nunca imprimir DATABASE_URL, tokens, senhas ou segredos. Não expor detalhes internos de exceções ao usuário.
- Produção deve falhar ao iniciar sem segredos obrigatórios; não aceitar defaults `secret`/`TEST`. OAuth precisa de prova de identidade verificada no servidor. E-mail não concede privilégios: usar autorização administrativa explícita.
- Quantidades, IDs e moedas são inteiros com limites. Checar saldo antes da transação não protege contra requisições simultâneas; condicione o débito e verifique contagens de atualização/consumo dentro da transação.
- Evite SQL sequencial em loops: use agregação, `findMany`, `createMany` e concorrência limitada quando necessário. Não substitua N+1 por paralelismo ilimitado que esgote o pool.
- Preserve índices e constraints; toda mudança de schema precisa de estratégia de migration, dados existentes e rollback.
- Cache, buffers e WebSocket são locais ao processo. Não assumir coordenação entre máquinas ou execução confiável de cron com auto-stop.

## Frontend e experiência

- `UserProvider` mantém `{children}` montados enquanto valida sessão; loading e erro são locais.
- Telas interativas usam TanStack Query com chaves que incluam usuário/filtros quando aplicável. Mutação invalida todos os dados afetados, inclusive saldo e inventário.
- Preserve navegação imediata, esqueletos locais, `loading.tsx` e prefetch da abertura, sem prometer latência de rede de 0ms ou adicionar delays de autenticação.
- Ações de recompensa: feedback sonoro imediato via `soundFx`, loading no botão e prevenção de duplo clique; servidor continua sendo a garantia contra repetição.
- Loja mantém popover informativo por pacote. Toast no canto superior direito (`top-4 right-4`); botões outline/ghost com texto explícito em claro e escuro.
- Teste teclado, foco dos diálogos, mobile, estados vazios, falha de rede e redução de movimento em mudanças visuais.
- i18n existente: `pt`, `en`, `es`, `jp`, `LanguageContext`, dicionários TS, cookie/localStorage `tcg_locale`, cabeçalhos `X-Locale`/`Accept-Language`. Não introduzir uma segunda arquitetura sem necessidade. `jp` interno corresponde a `ja` nos padrões externos.

## Critério de conclusão

- Sem novo `@ts-ignore`/`any` desnecessário; sem vazamento de dados entre usuários.
- Respostas e erros coerentes, invalidação de cache e isolamento de ambiente.
- Testes relevantes para segurança, concorrência e domínio; não duplicar a implementação num teste e chamar isso de integração.
- Executar `bun test` e build web; validar build API quando afetado. Falhas devem ser explicitadas.
- Mudanças visuais: claro/escuro e mobile verificados ou limitação relatada.
- Deploy, migration e publicação não são consequência automática de editar documentação. Nunca subir `main` apenas para sincronizar, pois push dispara deploy.
