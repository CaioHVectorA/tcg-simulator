# PokeClash Arena — Relatório de Síntese de Sprint e Matriz de Priorização Executiva
## Produtor / Design Liaison — Alinhamento de Equipe, Gestão de Escopo e Ordens de Serviço (OS)

**Data de Emissão:** 27 de Setembro de 2026  
**Autor:** Intermediador (Produtor & Design Liaison)  
**Destinatários:** Game Designer, Tech Lead / Desenvolvedor (Dev), Beta Tester Alpha, Beta Tester Beta  
**Status do Documento:** Aprovado & Oficial  
**Versão do Projeto:** v2.0.0-rc1  

---

## 1. Sumário Executivo & Papel do Intermediador

Como **Intermediador (Produtor / Design Liaison)** da equipe autônoma de desenvolvimento de jogos do **Pokémon TCG Simulator**, a responsabilidade deste relatório é convergir a visão conceitual do **Game Designer**, as restrições arquiteturais e de engenharia do **Desenvolvedor**, e as evidências práticas levantadas pelos dois agentes de qualidade (**Beta Tester Alpha** e **Beta Tester Beta**).

A presente sprint consolidou a entrega da feature central **PokeClash Arena (Módulo de Batalhas 3-Lanes)** e o sistema de internacionalização (**i18n** em 4 idiomas: Português, Inglês, Espanhol e Japonês). O ambiente de testes com Bun revelou uma base sólida com 75 testes automatizados aprovados (13 arquivos de teste). No entanto, o escrutínio dos Beta Testers revelou divergências matemáticas fundamentais entre o Game Design Document (GDD v2.0.0) e a Engine, além de falhas críticas de integridade de dados e exploits de backend que exigem remediação prioritária antes do rollout público.

```
       ┌────────────────────────┐
       │     GAME DESIGNER      │
       │  (Visão GDD / Regras)  │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │     INTERMEDIADOR      │ ◀─── Relatórios Alpha & Beta
       │   (Produtor / Escopo)  │
       └───────────┬────────────┘
                   │
         [Ordens de Serviço]
                   │
                   ▼
       ┌────────────────────────┐
       │      DEV / ENGINE      │
       │ (Correção P0/P1/Testes)│
       └────────────────────────┘
```

---

## 2. Análise Crítica dos Relatórios de Testes

### 2.1. Relatório do Beta Tester Alpha (Playability, UX & Coerência Visual)
* **Pontos Fortes:**
  - A interface tática em tema Neon Cyberpunk Dark (Syne + JetBrains Mono) apresentou forte apelo estético e consistência visual nas 3 abas principais (`deck`, `gyms`, `history`).
  - O fluxo tático de seleção de cartas por slot, o cálculo dinâmico de Combat Power (CP) e Recruitment Points (PR), e o painel de feedback sonoro/visual com animações de vitória/derrota foram avaliados com nota 9.2/10 em usabilidade e engajamento.
* **Alertas e Divergências de Design:**
  - **Divergência Crítica de PR (GDD vs Engine):** O GDD v2.0.0 estipula a tabela de PR como:
    * Tier 1 = 1 PR, Tier 2 = 2 PR, Tier 3 = 3 PR, Tier 4 = 5 PR, Tier 5 = 8 PR.
    * A Engine em `src/lib/battle-engine.ts` implementou: Tier 3 = 4 PR e Tier 4 = 6 PR.
    * *Impacto no Game Design:* Essa divergência impede a formação da composição icônica descrita no GDD: 1 Ultra Rara (Tier 5 - 8 PR) + 1 Rara Holo (Tier 4 - 5 PR) + 1 Incomum (Tier 3 - 3 PR) + 1 Comum (Tier 2 - 2 PR) + 2 Básicas (Tier 1 - 1 PR cada) = $8 + 5 + 3 + 2 + 1 + 1 = 20$ PR. Na engine atual, essa composição totalizava 22 PR, invalidando a estratégia mestre.
  - **FOUT no SSR (Flash of Unstyled Translation):** Durante o carregamento inicial, a UI apresentava um flash em inglês ou chaves brutas antes da hidratação do cookie de idioma.
  - **Prefetch Prematuro de Boosters:** O modal de abertura de pacotes executava o consumo do pacote via API prematuramente durante o hover/hover prefetch, consumindo saldo do usuário sem clique consciente.

### 2.2. Relatório do Beta Tester Beta (Exploits Técnicos, Segurança & Edge Cases)
* **EXP-BATTLE-001 (Deck Fantasma pós-troca em `fightNpc` - Severidade: P0):**
  - O endpoint `POST /battle/fight-npc` confiava unicamente no snapshot pré-salvo na tabela `user_battle_decks`, sem revalidar se o jogador ainda era o detentor legítimo das 6 cartas na tabela `cards_user` no momento do combate.
  - Um usuário mal-intencionado podia salvar um deck com cartas Tier 5 de alto CP, transferi-las via sistema de trocas para outra conta ou vendê-las, e continuar vencendo os Líderes de Ginásio (Giovanni, Sabrina, etc.) indefinidamente, gerando moedas e XP infinitos.
* **BUG-BATTLE-002 (Fallback Inválido do `recommendDeck` - Severidade: P1):**
  - O endpoint `GET /battle/recommend-deck` executava um fallback ingênuo `sortedByPr.slice(0, 6)` quando o algoritmo guloso falhava em atingir 6 cartas $\le 20$ PR. Se a coleção do usuário continha apenas cartas de alto custo (ex: 6 cartas Tier 4 com 5/6 PR cada), o endpoint recomendava um deck de 30 PR, induzindo o cliente a tentar salvar um deck que seria imediatamente rejeitado com erro 400 pelo backend.
* **BUG-PKG-004 (Validação de IDs Não-Contíguos em `buyManyPackages` - Severidade: P0):**
  - Em `src/services/package.service.ts:282-288`, a validação de integridade utilizava a fórmula linear: `id > packagesCount + first.id || id < first.id`. Se o banco de dados sofresse deleções ou utilizasse IDs dispersos/não-contíguos (ex: pacotes IDs 1, 3, 7), a compra múltipla de pacotes legítimos falhava com erro de validação espúrio.
* **BUG-I18N-006 (Chaves Faltantes de Internacionalização - Severidade: P1):**
  - As chaves `common.edit` e `collection.favorites` estavam ausentes dos arquivos de localização (`apps/www/src/i18n/locales/*.ts`), vazando texto cru `collection.favorites` na visualização mobile e nos filtros de cartas.

---

## 3. Matriz de Priorização Executiva (Sprint Priorities)

Para manter o foco da equipe e garantir a entrega de valor com estabilidade absoluta, estabelecemos a seguinte matriz de prioridades:

| ID | Prioridade | Componente | Descrição Resumida | Racional Executivo |
| :--- | :---: | :--- | :--- | :--- |
| **EXP-BATTLE-001** | **P0** | Backend (`battle.service.ts`) | Revalidação de inventário ativo (`cards_user`) e teto de PR em `fightNpc` | **Bloqueante de Produção.** Evita duplicação de cartas e combate fantasma pós-troca. |
| **BUG-PKG-004** | **P0** | Backend (`package.service.ts`) | Consulta SQL `where: { in }` para IDs de pacotes em `buyManyPackages` | **Bloqueante de Produção.** Desbloqueia compras de pacotes com IDs reais do banco de dados. |
| **ALIGN-PR-001** | **P1** | Engine (`battle-engine.ts`) | Reajuste da tabela de PR: Tier 3 = 3 PR, Tier 4 = 5 PR | **Essencial de Balanceamento.** Alinha o código 1:1 com o GDD v2.0.0 aprovado. |
| **BUG-BATTLE-002** | **P1** | Backend (`battle.service.ts`) | Fallback seguro com erro amigável quando $\sum PR \le 20$ for inviável | **Essencial de Usabilidade.** Evita sugerir decks ilegais que frustram o jogador. |
| **BUG-I18N-006** | **P1** | Frontend (`i18n/locales/*.ts`) | Inclusão de `common.edit` e `collection.favorites` em pt, en, es, jp | **Essencial de UI/UX.** Garante paridade em 100% dos idiomas e zero strings brutas. |
| **PERF-SSR-001** | **P2** | Frontend (`layout.tsx`) | Leitura de cookie `tcg_locale` no SSR para erradicar o FOUT | **Refinamento de UX.** Estabilidade visual imediata no primeiro byte renderizado. |
| **UX-BOOSTER-002** | **P2** | Frontend (`pack-opening-modal.tsx`) | Remoção de consumo prematuro de pacote em prefetch hover | **Refinamento de UX.** Evita transações financeiras indesejadas no cliente. |
| **TYPE-ELY-003** | **P2** | Backend (`*.controller.ts`) | Tipagem estrita com `t.Integer()` em endpoints com IDs e contadores | **Refinamento de Engenharia.** Fortalece validação de tipos em runtime no Elysia. |

---

## 4. Política de Blindagem de Escopo (Scope Creep Quarantine)

> [!WARNING]
> **DIRETRIZ DE ESCOPO FECHADO:**
> Com base nas diretrizes do Produtor, **está estritamente proibido** o início ou implementação de recursos fora do Core Loop da Sprint nesta fase de estabilização.

Ficam formalmente **congelados para a Sprint v2.1+**:
1. **Feature #52 (Safari Zone / Captura Selvagem):** Mecânica complexa envolvendo taxa de fuga, iscas e pedras, que desviaria o foco da consolidação da Batalha de Ginásios.
2. **Feature #63 (Compra Direta de Cartas Avulsas / Marketplace):** Criaria pressão inflacionária na economia antes de validarmos a curva de drop dos Thematic Lootboxes e Booster Packs.
3. **Feature #44 (Compartilhamento Público de Binder / Pasta de Cartas via URL):** Demanda infraestrutura de OpenGraph dinâmico e SSR público com permissões de privacidade granulares.
4. **Feature #48 (Redesenho Estrutural da Sidebar Global):** A navegação atual atende com excelência ao fluxo entre Coleção, Batalha, Loja e Perfil; refatorações estéticas de shell estão fora do escopo crítico.

---

## 5. Ordens de Serviço (OS) Executáveis para o Desenvolvedor (Dev)

As Ordens de Serviço a seguir devem ser executadas pontualmente pelo time de desenvolvimento:

### OS-DEV-001: Validação de Posse de Cartas em Tempo Real no Combate (`fightNpc`)
* **Severidade:** P0 (Crítica)
* **Arquivo Alvo:** `src/services/battle.service.ts`
* **Método:** `fightNpc(userId: string, npcId: string)`
* **Ação Técnica Requerida:**
  1. Antes de invocar `battleEngine.simulateMatch`, buscar todos os registros de `cards_user` onde `user_id == userId` e `card_id` pertença aos 6 IDs do deck salvo.
  2. Verificar se a quantidade de cada carta na posse do usuário é suficiente para cobrir os slots do deck salvo.
  3. Verificar se nenhuma das cartas em posse possui `is_marked_for_trade: true`.
  4. Recalcular a soma de PR com os dados atualizados das cartas e validar `totalPr <= 20`.
  5. Se qualquer validação falhar, abortar a batalha lançando erro descritivo e amigável: `"Você não possui mais todas as cartas deste deck ou uma delas está em negociação."`
* **Critério de Sucesso:** Teste de exploit `should demonstrate Ghost Card / Desync vulnerability: fightNpc without inventory re-validation` deve ser atualizado para esperar rejeição com erro 400.

---

### OS-DEV-002: Correção de Bounds e Validação em `buyManyPackages`
* **Severidade:** P0 (Crítica)
* **Arquivo Alvo:** `src/services/package.service.ts`
* **Método:** `buyManyPackages`
* **Ação Técnica Requerida:**
  1. Substituir a checagem matemática que assume IDs sequenciais (`id > packagesCount + first.id || id < first.id`).
  2. Extrair o array de IDs únicos: `const uniqueIds = Array.from(new Set(packagesId));`.
  3. Executar consulta via Prisma: `const packages = await prisma.packages.findMany({ where: { id: { in: uniqueIds } } });`.
  4. Garantir que `packages.length === uniqueIds.length`, lançando erro caso algum ID solicitado não exista.
* **Critério de Sucesso:** Teste `should demonstrate buyManyPackages non-contiguous ID flaw` passa a validar com sucesso a compra de pacotes arbitrários e dispersos.

---

### OS-DEV-003: Sincronização da Tabela de Recruitment Points (GDD $\leftrightarrow$ Engine)
* **Severidade:** P1 (Alta)
* **Arquivo Alvo:** `src/lib/battle-engine.ts`
* **Constante/Função:** `calculateCardPr(rarity: number): number`
* **Ação Técnica Requerida:**
  1. Ajustar o mapeamento de PR:
     ```typescript
     // GDD v2.0.0 Especificação Oficial:
     // Tier 1 (Comum) = 1 PR
     // Tier 2 (Incomum) = 2 PR
     // Tier 3 (Rara) = 3 PR (era 4)
     // Tier 4 (Rara Holo) = 5 PR (era 6)
     // Tier 5 (Ultra Rara / Secret) = 8 PR
     const PR_MAP: Record<number, number> = {
       1: 1,
       2: 2,
       3: 3,
       4: 5,
       5: 8,
     };
     ```
  2. Atualizar as asserções de testes em `tests/battle.test.ts` e `tests/battle-simulation-suite.test.ts` para refletir a nova pontuação matemática (ex: Tier 3 agora soma 3 PR, Tier 4 soma 5 PR).
* **Critério de Sucesso:** A composição clássica $[8, 5, 3, 2, 1, 1]$ soma exatamente 20 PR e é aceita com sucesso pela engine.

---

### OS-DEV-004: Fallback Seguro e Bounded Knapsack em `recommendDeck`
* **Severidade:** P1 (Alta)
* **Arquivo Alvo:** `src/services/battle.service.ts`
* **Método:** `recommendDeck(userId: string)`
* **Ação Técnica Requerida:**
  1. No algoritmo de seleção de cartas, caso o deck selecionado não atinja 6 cartas mantendo o teto de 20 PR, NÃO utilizar o fallback ingênuo de fatiar `slice(0, 6)`.
  2. Executar um algoritmo de substituição decrescente (downgrade search) buscando cartas de Tier 1 e Tier 2 no acervo do jogador para preencher os 6 slots respeitando $\le 20$ PR.
  3. Se o jogador tiver menos de 6 cartas válidas ou a coleção não permitir formar um deck com $\le 20$ PR, retornar erro amigável instruindo o jogador: `"Coleção insuficiente para montar um deck tático válido (mínimo de 6 cartas com até 20 PR). Abra novos pacotes para obter cartas básicas!"`.
* **Critério de Sucesso:** `recommendDeck` nunca retorna uma recomendação com PR $> 20$.

---

### OS-DEV-005: Paridade de Chaves de Tradução i18n
* **Severidade:** P1 (Alta)
* **Arquivos Alvo:** `apps/www/src/i18n/locales/{pt,en,es,jp}.ts`
* **Ação Técnica Requerida:**
  1. Adicionar `common.edit` em todos os idiomas:
     - `pt`: `"Editar"`
     - `en`: `"Edit"`
     - `es`: `"Editar"`
     - `jp`: `"編集"`
  2. Adicionar `collection.favorites` em todos os idiomas:
     - `pt`: `"Favoritas"`
     - `en`: `"Favorites"`
     - `es`: `"Favoritas"`
     - `jp`: `"お気に入り"`
* **Critério de Sucesso:** A suíte `tests/beta-tester-exploits.test.ts` (teste `I18N Translation Parity & Leaks`) passa com 0 chaves não resolvidas.

---

## 6. Critérios de Aceite da Sprint (Definition of Done - DoD)

1. **Integridade de Segurança:** Nenhuma transação de combate (`fightNpc`) pode ser completada utilizando cartas fora da posse atual do jogador ou em negociação ativa.
2. **Integridade Econômica:** A compra múltipla de pacotes aceita qualquer conjunto de IDs válidos existentes no banco de dados.
3. **Fidelidade às Regras:** A tabela de PR da Engine reflete com 100% de exatidão o GDD v2.0.0 aprovado.
4. **Paridade Linguística:** Zero chaves brutas vazando na interface do cliente em qualquer um dos 4 idiomas suportados.
5. **Automação:** Todos os 75+ testes automatizados continuam executando com 100% de aprovação no ambiente Bun (`bun test`).

---

**Assinado:**  
*Produtor & Design Liaison — Pokémon TCG Simulator Project*
