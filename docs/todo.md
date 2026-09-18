# TODO.md — Pokémon TCG Simulator

> **Backlog Estruturado de Tarefas, Roadmap e Especificações Técnicas**  
> Última Atualização: **18 de Setembro de 2026**

---

## 🎯 Status Atual do Projeto: Estável & Expandido

### ✅ Entregas Concluídas Recentemente
- [x] **Fluxo de Convidado Humanizado & Upgrade de Conta:**
  - Suporte a nicknames personalizados e botão 🎲 de gerador de nomes aleatórios de treinador em `apps/www/src/app/entrar/page.tsx`.
  - Endpoint `POST /auth/upgrade-guest` no backend (`auth.controller.ts`) mantendo 100% de cartas, pacotes, moedas, missões e histórico.
  - Modal interativo de conversão de conta (`UpgradeAccountModal`) e selo de visitante no `HeaderMenu`.
  - Bloqueio preventivo de recursos sociais (amigos, chat, trocas) para visitantes com feedback visual amigável (`GuestRestrictionCard`).
- [x] **Sistema de Customização de Avatar de Treinador:**
  - Modal `AvatarPickerModal` integrado ao perfil (`perfil/page.tsx`) com 3 opções:
    - Galeria de 16 Pokémon e Treinadores icônicos (PokeAPI official artwork).
    - Seleção de arte de qualquer carta pertencente à coleção do usuário.
    - URL personalizada com pré-visualização ao vivo em moldura circular.
  - Endpoint `PATCH /user/profile` recebendo `picture` e invalidando cache global do usuário.
- [x] **Animações de Abertura Imersiva & Celebração God Pull (Tier 5):**
  - Sequência cinematográfica em tela cheia `MaxRarityCelebration` com rotação de raios solares, anéis de energia, aura cósmica, partículas e tilt 3D interativo da carta.
  - Motor sonoro sintetizado via Web Audio API (`sound-fx.ts`): novos métodos `playMaxRarityAura()` e `playGodPullFanfare()`.
  - Efeito de suspense (aura pulsante no verso da carta) em `pack-opening-modal.tsx` e `pack-open-view.tsx`.
- [x] **Suite de Testes Unitários com Bun:**
  - 15 testes unitários (`tests/auth.test.ts`, `tests/cache.test.ts`, `tests/mount-response.test.ts`, `tests/open-package.test.ts`, `tests/user.controller.ts`) passando 100% em ~250ms via `bun test` ou `bun run test`.
  - Correção de bug no sorteio de raridade (`src/lib/open-package.ts`): uso de `??` (nullish coalescing) e fallback seguro para pools não vazios.
- [x] **Script de Desenvolvimento Concorrente:**
  - `bun dev:all` (`widgets/dev-all.ts`) executando backend (porta 8080) e frontend (porta 3000) simultaneamente com logs prefixados coloridos e dashboard no terminal.
- [x] **Mapeamento Completo de Bibliotecas, APIs e Issues:**
  - `docs/libraries-and-apis.md`: detalhamento do runtime Bun, Elysia, Next 15, TCGdex SDK/CDN e motor de áudio.
  - `docs/issues.md` e `issues.md`: triagem das 77 issues do repositório GitHub.

---

## 🚨 Prioridade 0: Débito Técnico & Alinhamento de Infraestrutura

- [x] **Alinhar Dockerfile com arquitetura Bun e Fly.io**
  - *Arquivo:* `Dockerfile` e `.dockerignore`
  - *Ação:* Atualizado `COPY bun.lockb` para `bun.lock*` e incluído `apps/www/package.json` para resolução de workspaces do Bun com `.dockerignore` otimizado.
- [ ] **Refatorar inconsistência de Foreign Keys no Prisma**
  - *Arquivo:* `prisma/schema.prisma`
  - *Ação:* Padronizar camelCase ou snake_case em migração controlada (`Cards_user.userId` vs `User_Purchase.user_id`).
- [ ] **Deduplicação de missões redundantes no seed (#67)**
  - *Arquivo:* `prisma/seed/quests.ts`
  - *Ação:* Remover missões com critérios duplicados ou IDs conflitantes.

---

## 🎮 Prioridade 1: Economia e Gameplay Avançado

- [ ] **Sistema de Caça / Safari Zone — Hunting System (#52)**
  - *Descrição:* Área especial onde cartas selvagens raras aparecem periodicamente. O jogador consome "Iscas" ou "Safari Balls" obtidas em missões para tentar capturá-las com taxa de captura dinâmica baseada em raridade e HP.
- [ ] **Compra direta de cartas promocionais (#63)**
  - *Descrição:* Permitir que o jogador adquira cartas promocionais em destaque na loja diretamente por moedas ou insígnias, sem depender de pacotes.
- [ ] **Modo de Batalha de Decks TCG (PVP/PVE)**
  - *Descrição:* Construtor de Decks (mínimo 60 cartas) e motor de regras simplificado por turnos contra IA ou treinadores amigos.

---

## 🎴 Prioridade 2: Colecionismo e Recursos Sociais

- [ ] **Filtros Avançados na Coleção (#66)**
  - *Descrição:* Filtros combinados por Coleção/Série (Base Set, Scarlet & Violet), tipo elemental (Fogo, Água, etc.), HP mínimo/máximo e filtro "Apenas Repetidas" para reciclagem em lote.
- [ ] **Compartilhamento Público de Pasta / Binder Virtual (#44)**
  - *Descrição:* Rota pública compartilhável (`/binder/:username` ou `/colecao/:id`) com visualização de fichário folheável para exibir coleções em redes sociais.
- [ ] **Menu Lateral / Sidebar Moderna (#48)**
  - *Descrição:* Implementar barra de navegação retrátil lateral para telas médias/grandes (desktop), mantendo menu inferior no mobile.
- [ ] **Senha opcional para usuários Convidado e Google (#49)**
  - *Descrição:* Permitir que contas migradas adicionem uma senha segura para permitir login tradicional por email/senha em qualquer dispositivo.

---

## 🌐 Prioridade 3: Internacionalização Completa (i18n)
*(Planejado e documentado — **NÃO IMPLEMENTAR CÓDIGO** até aprovação final)*

### Visão Geral da Arquitetura de i18n
O simulador já utiliza dados de cartas do **TCGdex**, que nativamente possui suporte a múltiplos idiomas (`/pt/`, `/en/`, `/es/`, `/ja/`, `/fr/`, `/de/`). A internacionalização tornará a plataforma 100% acessível para a comunidade global de Pokémon TCG.

### Escopo de Idiomas Planejados:
1. 🇧🇷 **Português do Brasil (`pt-BR`)** — Idioma padrão.
2. 🇺🇸 **Inglês (`en-US`)** — Idioma universal para a comunidade competitiva (#74).
3. 🇪🇸 **Espanhol (`es-ES`)** — Comunidade hispanofalante (#75).
4. 🇯🇵 **Japonês (`ja-JP`)** — Cartas originais e público asiático (#76).
5. 🇫🇷 **Francês (`fr-FR`)** e 🇩🇪 **Alemão (`de-DE`)** (#77).

### Estrutura Arquitetural Proposta:
- **Biblioteca Recomendada:** `next-intl` (leve, nativo para Next.js 15 App Router com zero overhead de cliente).
- **Estrutura de Diretórios de Dicionários:**
  ```
  apps/www/src/messages/
  ├── pt.json
  ├── en.json
  ├── es.json
  ├── ja.json
  ├── fr.json
  └── de.json
  ```
- **Namespaces de Tradução:**
  - `common`: Botões genéricos ("Confirmar", "Cancelar", "Fechar", "Salvar", "Voltar").
  - `auth`: Telas de login, registro, modo convidado e upgrade de conta.
  - `header`: Itens de menu, moedas, notificações e perfil.
  - `packs`: Rasgar pacote, virar carta, raridades ("Comum", "Rara", "Lendária", "God Pull").
  - `cards`: Tipos de Pokémon, HP, ataques, descrições e fraquezas.
  - `trades`: Mercado de trocas, filtros, criar oferta, aceitar proposta.
  - `social`: Amigos, solicitações, chat, status online e doações.
  - `quests`: Missões diárias, objetivos, cronômetro de rotação.
  - `areas`: Biomas de Kanto e expedições.
- **Integração com TCGdex Dinâmico:**
  - Parâmetro de locale injetado nas requisições da API de cartas: `https://api.tcgdex.net/v2/{lang}/cards/{id}`.
  - CDN de imagens adaptada para o idioma ativo: `https://assets.tcgdex.net/{lang}/{set}/{cardId}/high.webp`.
- **Componente Seletor de Idioma:**
  - Dropdown com bandeiras no `HeaderMenu` e nas `Configurações`, com persistência em cookie `NEXT_LOCALE`.

---

## 📋 Resumo de Comandos Úteis para Desenvolvedores

```bash
# Instalar dependências
bun install

# Iniciar Backend e Frontend juntos (Ambiente Concorrente com logs coloridos)
bun dev:all

# Iniciar apenas o Backend (porta 8080)
bun dev:back

# Iniciar apenas o Frontend (porta 3000)
bun dev:front

# Executar suite completa de testes unitários
bun test

# Executar migrações e seeds do banco
bun seed
```
