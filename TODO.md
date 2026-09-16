# TODO.md — Pokémon TCG Simulator

> **Backlog de Tarefas, Correções e Roadmap de Evolução**  
> Status atualizado em: 15 de Setembro de 2026

---

## 🚨 Prioridade 0: Correções Críticas (Bugs Identificados)

- [x] **Corrigir cálculo de probabilidade de raridade na abertura de boosters**
  - *Arquivo:* `src/lib/open-package.ts`
  - *Ação:* Amostragem cumulativa (Cumulative Distribution Function - CDF) implementada proporcionalmente aos pesos de cada raridade.

- [x] **Corrigir vazamento de estado em cartas promocionais compradas na loja**
  - *Arquivo:* `src/controller/store.controller.ts`
  - *Ação:* Isolamento por tenant com `where: { user_id: user.id, card_id: { not: null } }`.

- [x] **Corrigir verificação de posse no resgate do Gengar Especial**
  - *Arquivo:* `src/controller/special.controller.ts`
  - *Ação:* Verificação estrita com `userId: user.id` e `Card: { card_id: GENGAR_CARD_ID }`.

- [x] **Corrigir cálculo de índice e raridade 0 no Cron de Cartas Promocionais**
  - *Arquivo:* `src/lib/cards-cron.ts`
  - *Ação:* Raridade mínima calibrada em 1 (`Math.floor(Math.random() * 2) + 1`) e seleção aleatória segura em `cards`.

- [x] **Corrigir colisão de cache de missões entre usuários**
  - *Arquivo:* `src/controller/quests.controller.ts`
  - *Ação:* Cache em memória particionado por usuário: `quest-${user.id}-${quest.quest_id}`.

- [x] **Tornar dinâmica a URL da API no Frontend**
  - *Arquivo:* `apps/www/src/lib/api.ts`
  - *Ação:* Suporte dinâmico a `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"` e derivação de `WS_URL`.

- [x] **Corrigir e reestruturar rota de criação de trocas no Backend**
  - *Arquivo:* `src/controller/trade.controller.ts`
  - *Ação:* Geração de hash SHA-256 única, múltiplos itens/moedas, verificação de posse e transações atômicas `prisma.$transaction`.

- [x] **Corrigir queries SQL com operadores incorretos nas missões**
  - *Arquivo:* `prisma/seed/quests.ts`
  - *Ação:* Operadores ajustados para `>= $GOAL` e retorno estrito de booleanos `mission_complete`.

- [ ] **Corrigir Dockerfile de deploy**
  - *Arquivo:* `Dockerfile`
  - *Problema:* Faz `ADD` de `bun.lockb` e expõe porta 3000 em vez de 8080.
  - *Ação:* Atualizar Dockerfile para o estado atual do repositório e alinhar porta com `fly.toml`.

---

## 📦 Prioridade 1: Funcionalidades Essenciais & Backlog Concluído

### 🤝 Sistema de Trocas (Trades)
- [x] Interface completa de Trocas em `apps/www/src/app/(app)/trocas/page.tsx`:
  - [x] Feed público de trocas disponíveis com filtros por carta desejada, raridade e "Apenas que posso cumprir".
  - [x] Modal de criação de troca: catálogo de cartas pesquisável, seleção de cartas a oferecer e cartas desejadas, além de moedas adicionais.
  - [x] Minhas trocas ativas com cancelamento seguro e devolução das cartas ao inventário.
  - [x] Histórico de trocas concluídas e aceitas.
- [x] Suporte a contra-propostas e ofertas personalizadas (`POST /trades/:id/offer` e `POST /trades/offer/:offerId/accept`).
- [x] Notificação em tempo real via WebSocket e sino quando uma troca recebe proposta ou é aceita.

### 👤 Perfil, Progressão & Configurações de Usuário
- [x] Página de Perfil em `apps/www/src/app/(app)/perfil/page.tsx`:
  - [x] Nível de Treinador com barra de XP progressiva baseada em Pontos de Raridade e orçamento.
  - [x] Avatar customizável, estatísticas de cartas totais, cartas raras e taxa de conclusão.
  - [x] Vitrine das 4 cartas mais raras da coleção do jogador.
  - [x] Reciclagem de cartas duplicadas (`POST /user/recycle-duplicates`) com conversão em moedas.
  - [x] Modal de edição de perfil (nome e avatar).
- [x] Página de Configurações em `apps/www/src/app/(app)/config/page.tsx`:
  - [x] Seletor de temas (Claro / Escuro / Sistema) integrado com `next-themes`.
  - [x] Controle de efeitos sonoros sintetizados (liga/desliga com persistência em `localStorage`).
  - [x] Informações da conta e atalho de logout.

### 🗺️ Sistema de Áreas & Expedições
- [x] Módulo de Áreas no Backend e Frontend (`/areas`):
  - [x] 6 biomas progressivos de Kanto desbloqueados por Nível de Treinador (Pallet, Viridian, Mt. Moon, Cerulean, Cinnabar, Planalto Índigo).
  - [x] Expedição diária com cooldown e recompensas atômicas de moedas e cartas temáticas da região.
  - [x] Modal de celebração e resgate de expedição com animação de recompensa.

### 💬 Social, Amigos & Chat em Tempo Real
- [x] WebSocket unificado (`ws-manager.ts` e `WebSocketContext.tsx`):
  - [x] Registro e presença online em tempo real.
  - [x] Hub Social (`/social`) com abas para Amigos, Pedidos Recebidos, Pedidos Enviados e Busca de Treinadores.
  - [x] Doação diária de moedas entre amigos (`POST /user/donate`).
  - [x] Diálogo de Chat privado em tempo real com histórico persistido no banco, confirmação de leitura e listener de WebSocket.
  - [x] Central de Notificações com popover no cabeçalho e contador de não lidas.

### 🎯 Sistema de Missões Estruturado
- [x] Central de Missões (`/missoes`):
  - [x] Cronômetro regressivo dinâmico para a próxima rotação diária (10h).
  - [x] Abas de categorização: Todas, Diárias, Progressão e Concluídas.
  - [x] Resumo de estatísticas de conclusão e botão de coleta em lote de recompensas pendentes.
  - [x] Efeito sonoro sintetizado ao resgatar moedas.

---

## 🎨 Prioridade 2: UX, Animações e Experiência do Jogador

- [x] **Experiência Imersiva de Abertura de Pacotes**:
  - *Arquivos:* `apps/www/src/components/pack-opening-modal.tsx` e `apps/www/src/app/(app)/abrir-pacote/[id]/page.tsx`
  - Pacote 3D flutuante com reflexo metálico e animação de rasgar o topo.
  - Iluminação radial dinâmica de fundo que se transforma de acordo com a raridade da carta (Azul suave para Comum, Safira para Rara, Ametista para Épica e Raios Solares Dourados para Lendária).
  - Revelação 3D carta por carta com verso estilizado Pokémon, brilho holográfico e efeitos sonoros sintetizados (rasgo de pacote, flip, sinos de raridade e fanfarra lendária).
  - Resumo de abertura com contagem de raridades e atalhos para abrir outro ou ir à coleção.

- [x] **Modal Universal de Detalhes da Carta (CardDetailModal)**:
  - Imagem expandida com efeito 3D reativo à posição do cursor do mouse.
  - Efeito foil holográfico que se move com o cursor.
  - Exibição de HP, tipo, raridade em estrelas e quantidade de cópias na coleção.

---

## 🚀 Prioridade 3: Próximos Passos (Backlog Futuro)

- [ ] **Simulador de Batalhas TCG (PVP/PVE)**:
  - Construção de Decks (mínimo de 60 cartas do inventário do jogador).
  - Batalha em turnos simples contra IA ou outros jogadores com cálculo de fraquezas e energias.
- [ ] **Álbum / Binder Virtual**:
  - Visualização de coleção em estilo "fichário" folheável, com slots vazios para cartas ainda não descobertas de cada coleção.
- [ ] **Conquistas e Títulos de Perfil**:
  - Badges especiais (ex: "Mestre do Fogo", "Colecionador Lendário") exibíveis no perfil e no ranking.
