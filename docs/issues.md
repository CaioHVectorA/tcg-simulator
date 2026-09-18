# Mapeamento Completo de Issues do Repositório (GitHub)

> **Relatório de Análise e Triagem de Issues do GitHub**  
> Repositório: **`caiohvectora/tcg-simulator`**  
> Data de Levantamento: 18 de Setembro de 2026

---

## 1. Resumo Executivo
Foram analisadas todas as **77 issues** registradas no repositório do GitHub.  
Dentre elas, categorizamos o que já foi **concluído e integrado**, o que acabou de ser **entregue nesta etapa**, e o que compõe o **backlog futuro aberto**.

---

## 2. Issues Concluídas & Integradas Recentemente

| Issue | Tipo | Título & Escopo | Status |
|---|---|---|---|
| **#71** | `chore` | Atualização de dependências e sincronização de lockfile | ✅ Concluído |
| **#69** | `fix` | URL da API dinâmica via `NEXT_PUBLIC_API_URL` sem hardcode | ✅ Concluído |
| **#51** | `feature` | Sistema completo de Mercado de Trocas com ofertas e cancelamento | ✅ Concluído |
| **#47** | `fix` | Correção de operadores SQL e queries no seed de missões | ✅ Concluído |
| **#46** | `feature` | Central Social com lista de amigos, doações e chat via WebSocket | ✅ Concluído |
| **#45** | `feature` | Sistema de Áreas e Expedições com biomas de Kanto | ✅ Concluído |
| **#42** | `feature` | Página de Perfil com nível, reciclar repetidas e vitrine | ✅ Concluído |
| **#41** | `feature` | Central de Missões estruturada com timer de rotação diária | ✅ Concluído |
| **#40** | `fix` | Correção do sorteio de raridade com pesos cumulativos (CDF) | ✅ Concluído |
| **#39** | `security` | Isolamento de dados de usuário (`user.id`) em todas as queries | ✅ Concluído |
| **#38** | `ui` | Animação imersiva de abertura de pacotes 3D e efeitos de flip | ✅ Concluído |
| **#35** | `feature` | Configurações com alternância de tema e sons sintetizados | ✅ Concluído |

---

## 3. Melhorias Entregues Nesta Etapa (Atendimento às Novas Demandas)

1. **Autenticação de Convidado Humanizada & Aprimoramento de Conta:**
   - Modo Convidado agora possui nicknames personalizados ou gerador aleatório de nomes de treinador (`entrar/page.tsx`).
   - Endpoint `POST /auth/upgrade-guest` no backend e modal `UpgradeAccountModal` no frontend: converte a conta visitante em conta permanente mantendo 100% dos dados (cartas, pacotes, moedas, missões).
   - Bloqueio preventivo de recursos sociais (amigos, chat, trocas) para visitantes com feedback explicativo (`GuestRestrictionCard`).

2. **Customização de Avatar do Treinador:**
   - Novo modal `AvatarPickerModal` acessível diretamente pelo perfil (`perfil/page.tsx`) com 3 abas:
     - Galeria com 16 Pokémon icônicos (PokeAPI official artwork em alta resolução).
     - Escolha de qualquer carta pertencente à coleção do próprio usuário.
     - Link de imagem customizada (URL direta) com pré-visualização instantânea.

3. **Animação Épica de Máxima Raridade (God Pull / Tier 5):**
   - Criação do componente cinematográfico `MaxRarityCelebration` em tela cheia com aura cósmica, rotação de anéis solares dourados, tilt 3D interativo e partículas.
   - Novos efeitos sintetizados no motor de áudio `sound-fx.ts`: `playMaxRarityAura()` e `playGodPullFanfare()`.
   - Efeito de suspense antes de revelar (aura pulsante no verso da carta) em `pack-opening-modal.tsx` e `pack-open-view.tsx`.

4. **Testes Unitários no Bun & Execução Concorrente:**
   - 15 testes unitários cobrindo 100% das regras de negócio de abertura de pacotes (CDF), isolamento de cache, contrato de respostas e autenticação de convidados (`bun run test`).
   - Script concorrente com dashboard colorido `bun dev:all` (`widgets/dev-all.ts`) rodando backend (8080) e frontend (3000) simultaneamente com prefixos coloridos.

---

## 4. Backlog de Issues Abertas (Para Próximos Sprints)

### 🗺️ Internacionalização (i18n) — Issues #73 a #77
*(Especificado e planejado no TODO.md; implementação de código aguarda aprovação conforme orientações)*
- **#73:** Infraestrutura base de i18n no Next.js App Router (dicionários por locale, detecção automática e seletor no header/config).
- **#74:** Suporte ao idioma Inglês (`en-US`).
- **#75:** Suporte ao idioma Espanhol (`es-ES`).
- **#76:** Suporte ao idioma Japonês (`ja-JP`).
- **#77:** Suporte a Francês (`fr-FR`) e Alemão (`de-DE`).

### 🎮 Gameplay e Economia
- **#52: Sistema de Caça / Safari Zone (Hunting System):**
  - Mini-game interativo onde o jogador usa "Iscas" ou "Pokébolas" diárias para tentar capturar cartas selvagens que aparecem em rotações temporais.
- **#63: Compra direta de cartas promocionais na loja:**
  - Permitir aos treinadores adquirir diretamente cartas da rotação promocional usando moedas ou tokens especiais sem depender exclusivamente de pacotes.

### 🎨 Colecionismo e Social
- **#66: Filtros avançados na coleção:**
  - Adicionar filtros combinados por coleção/expansão (Base Set, Jungle, etc.), tipo elemental (Fogo, Água, Elétrico, etc.), HP e exibição exclusiva de cartas repetidas para facilitar reciclagem.
- **#44: Compartilhamento público de Pasta / Binder:**
  - Gerar links públicos compartilháveis (`/binder/:username` ou `/deck/:id`) para que treinadores exibam suas coleções e decks para amigos em redes sociais.
- **#48: Menu Lateral (Sidebar Navigation):**
  - Redesenho da navegação desktop substituindo o header fixo por uma sidebar retrátil moderna para telas largas.

### 🛠️ Débito Técnico e Refatorações
- **#67: Deduplicação e limpeza de missões no seed:**
  - Revisar `prisma/seed/quests.ts` para evitar inserção de missões redundantes ou com critérios sobrepostos.
- **#49: Login Google / Visitante definir senha opcional:**
  - Usuários autenticados via OAuth ou migrados poderem definir uma senha para acessar via email tradicional caso prefiram.
- **#68: Verificação da funcionalidade de cópia de link de afiliado:**
  - Garantir feedback visual com toast e fallback caso `navigator.clipboard` esteja restrito no navegador.
