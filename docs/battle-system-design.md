# Game Design Document (GDD): Sistema Tático de Batalha Pokémon (PokeClash Arena)

> **Documento de Game Design & Arquitetura de Batalhas para o Pokémon TCG Simulator**  
> **Status:** Proposta de Game Design (Desacoplado do Código)  
> **Autores:** Caio & Antigravity  
> **Versão:** 1.0 — Setembro de 2026  

---

## 1. O Problema Fundamental: Por que o TCG Tradicional Não Funciona Aqui?

No Pokémon TCG tradicional (competitivo oficial), um deck requer **60 cartas** rigorosamente balanceadas entre:
- **Pokémon Básicos e Linhas Evolutivas** (Estágio 1, Estágio 2).
- **Cartas de Energia** (Básicas e Especiais) para alimentar cada ataque.
- **Cartas de Treinador** (Apoiadores, Itens, Ferramentas, Estádios) que compõem 60% a 70% de todo o motor de compra, busca e reciclagem do deck.

### A Realidade do Nosso Simulador:
1. **Colecionamos estritamente cartas de Pokémon:** Não existem cartas de energia, poções ou cartas de apoiador nos inventários dos jogadores.
2. **Disparidade de Estágios:** Um jogador pode ter um *Charizard ex* sem ter *Charmander* ou *Charmeleon*. Forçar regras de evolução deixaria 80% das cartas mais legais inutilizáveis.
3. **Pacing Mobile/Web Rápido:** Uma partida de TCG oficial dura entre 20 a 45 minutos com centenas de ações manuais de embaralhar. Nosso simulador exige confrontos rápidos, eletrizantes, de **2 a 4 minutos**, com alta dose de tensão psicológica, blefe e estratégia.

---

## 2. A Solução: *PokeClash Arena* (Fusão Gwent + Marvel Snap + Blefe)

O **PokeClash Arena** é um sistema tático de batalha assimétrico focado em **minidecks**, **controle de rotas**, **gestão de recursos escassos** e **mecânica de blefe (Face-Down)**.

### Visão Geral da Partida:
- **Duração:** 3 Rounds rápidos (Melhor de 3 ou Maior Pontuação em 3 Rotas).
- **Tamanho do Deck:** **6 Pokémon** selecionados da sua coleção.
- **Mão do Jogador:** Você compra todas as suas cartas ou tem acesso limitado (estilo Gwent, onde a gestão de cartas entre os rounds define a vitória).
- **O Tabuleiro:** 3 Rotas de Confronto (**Arena Alfa**, **Arena Beta**, **Arena Gama**), cada uma com uma condição climática/terreno elemental aleatório (ex: *Terreno Elétrico*, *Mar Tempestuoso*, *Cratera Vulcânica*).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                       CAMPO ADVERSÁRIO                      │
   │   [ Rota 1: Vulcão ]     [ Rota 2: Selva ]    [ Rota 3: Mar ] │
   │      [ ? ] Blefe            [ Charizard ]         [ Blastoise ]│
   ├─────────────────────────────────────────────────────────────┤
   │                         ZONA NEUTRA                         │
   │                   CLIMA: TEMPESTADE DE AREIA                │
   ├─────────────────────────────────────────────────────────────┤
   │                        SEU CAMPO                            │
   │      [ M Rayquaza ]         [ ? ] Blefe           [ Venusaur ]  │
   │   [ Rota 1: Vulcão ]     [ Rota 2: Selva ]    [ Rota 3: Mar ] │
   └─────────────────────────────────────────────────────────────┘
```

---

## 3. Minidecks & Regra do Teto Salarial de Poder (Salary / Power Cap)

### 3.1. Por que um Teto Salarial?
Se os jogadores pudessem colocar 6 cartas Místicas ou Lendárias (Tier 4 e 5), o jogo se tornaria estritamente *Pay-to-Win* ou baseado em sorte pura de quem abriu mais God Pulls.

Para criar um metagame profundo, competitivo e acessível:
- Todo jogador tem um **Orçamento de Montagem de Deck (Deck Cap)** de **20 Pontos de Recrutamento (PR)**.
- Cada Pokémon consome PR com base na sua Raridade e Força Bruta:

| Raridade / Categoria | Custo em Pontos de Recrutamento (PR) | Papel Estratégico no Minideck |
|---|---|---|
| **Comum (Tier 1)** | **1 PR** | Peão de sacrifício, carta de blefe para rounds descartáveis, ativadores de combo. |
| **Rara (Tier 2)** | **2 PR** | Suporte confiável, bônus de tipo, cartas de transição sólida. |
| **Épica (Tier 3)** | **4 PR** | Atacantes de impacto médio-alto, Pokémon V, ex clássicos. |
| **Mística (Tier 4)** | **6 PR** | Titãs de campo, cartas decisivas de round, habilidades climáticas fortes. |
| **Lendária / God Pull (Tier 5)** | **8 PR** | Hiper-carregadores de rota (*Game Finishers*). |

> **Exemplo de Composição de Deck Válido (Total = 20 PR):**
> 1. *Mega Rayquaza EX* (Mística) = **6 PR**
> 2. *Gengar ex* (Épica) = **4 PR**
> 3. *Pikachu Ilustração Rara* (Épica) = **4 PR**
> 4. *Scyther* (Rara) = **2 PR**
> 5. *Pidgey* (Comum) = **1 PR** (Blefe barato)
> 6. *Oddish* (Comum) = **1 PR** (Blefe barato)
> **Total:** $6 + 4 + 4 + 2 + 1 + 1 = 18 \le 20 \text{ PR}$ (Válido!)

---

## 4. Além da Raridade: Como Calcular o Poder de Combate Real (CP Formula)

### 4.1. O Problema do "Mega Rayquaza" apontado pelo Jogador
> *"Um Mega Rayquaza é considerado como épica por raridade básica do set, mas é um freaking Mega Rayquaza com 220 de vida! Não faz sentido ele perder para um Pokémon aleatório só pela etiqueta de raridade."*

No Pokémon TCG Simulator, as cartas possuem dados ricos na API (e no banco) que antes não eram explorados em combate:
- **HP (Pontos de Vida):** Varia de 30 até 340 HP.
- **Sufixos e Subtipos no Nome:** `Mega` / `M-`, `VMAX`, `VSTAR`, `ex`, `EX`, `GX`, `Tera`, `Radiant`, `Tag Team`.
- **Tipo Elemental Primário:** Fogo, Água, Grama, Elétrico, Psíquico, Luta, Escuridão, Metal, Dragão, Incolor.
- **Raridade Histórica (1 a 5).**

### 4.2. Fórmula Oficial de Poder de Combate (Combat Power - CP)

O poder numérico final de cada Pokémon na arena é calculado dinamicamente:

$$\mathbf{CP} = \mathbf{Base}_{\text{Raridade}} + \mathbf{B\hat{o}nus}_{\text{HP}} + \mathbf{B\hat{o}nus}_{\text{Subtipo}} + \mathbf{Modificador}_{\text{Terreno \& Fraqueza}}$$

Onde:

#### A. Base de Raridade:
- Tier 1 (Comum): $25 \text{ CP}$
- Tier 2 (Rara): $45 \text{ CP}$
- Tier 3 (Épica): $70 \text{ CP}$
- Tier 4 (Mística): $100 \text{ CP}$
- Tier 5 (Lendária): $130 \text{ CP}$

#### B. Bônus de HP (Escalar proporcionalmente a vitalidade da carta):
$$\mathbf{B\hat{o}nus}_{\text{HP}} = \left\lfloor \frac{\text{HP}}{10} \right\rfloor \times 2$$
*(Exemplo: 220 HP concede $+44 \text{ CP}$; 330 HP concede $+66 \text{ CP}$; 60 HP concede apenas $+12 \text{ CP}$)*.

#### C. Bônus de Subtipo e Forma Especial:
Análise semântica do nome da carta e metadados:
- **Sufixo `Mega` ou `M-`:** $+35 \text{ CP}$ *(Reconhece o titã supremo!)*
- **Sufixo `VMAX` ou `Tag Team`:** $+30 \text{ CP}$
- **Sufixo `Tera` ou `VSTAR`:** $+25 \text{ CP}$
- **Sufixo `ex` ou `GX` ou `EX`:** $+15 \text{ CP}$
- **Sufixo `Radiant`:** $+10 \text{ CP}$

---

### 4.3. Demonstração Prática da Fórmula (Estudo de Caso Mega Rayquaza):

#### Caso A: Mega Rayquaza EX (Classificado como Tier 3 Épica pelo set original, 220 HP)
- Base Tier 3: $70$
- Bônus de HP ($220 \text{ HP} \to 22 \times 2$): $+44$
- Bônus de Subtipo (`Mega` $+35$ + `EX` $+15$): $+50$
- **CP Total Sem Terreno:** $\mathbf{164 \text{ CP}}$!
- **Resultado:** Mesmo sendo Tier 3 na etiqueta de raridade bruta, sua força de combate real supera até mesmo uma carta Tier 4 genérica sem mega-evolução! O sistema faz justiça à imponência do monstro lendário.

#### Caso B: Caterpie (Tier 1 Comum, 40 HP, Básico)
- Base Tier 1: $25$
- Bônus de HP ($40 \text{ HP} \to 4 \times 2$): $+8$
- Bônus Subtipo: $0$
- **CP Total:** $\mathbf{33 \text{ CP}}$.

#### Caso C: Charizard VMAX (Tier 5 Lendária, 330 HP)
- Base Tier 5: $130$
- Bônus de HP ($330 \text{ HP} \to 33 \times 2$): $+66$
- Bônus Subtipo (`VMAX`): $+30$
- **CP Total:** $\mathbf{226 \text{ CP}}$.

---

## 5. Dinâmica de Blefe & Estratégias Estilo Gwent / Marvel Snap

### 5.1. Cartas Viradas para Baixo (Face-Down Play)
Em cada turno/round, os jogadores colocam **uma carta virada para baixo** na rota de sua escolha.
- O oponente vê apenas o verso oficial da carta Pokémon e o valor do teto salarial restante do adversário.
- Você pode colocar uma carta de $33 \text{ CP}$ (Caterpie) fingindo ser o seu *Mega Rayquaza*, forçando o oponente a gastar o melhor recurso dele para defender aquela rota!

### 5.2. O Sistema de "Snap / Desafio do Treinador" (Apostas)
- Em qualquer momento antes de revelar o round decisivo, um jogador pode declarar **"Blefe / Desafio" (Snap)**.
- Declarar o Snap dobra a recompensa de XP e Moedas da partida.
- O oponente tem 10 segundos para:
  1. **Aceitar:** O round continua com aposta dobrada.
  2. **Recuar (Fold):** O oponente desiste daquele round/partida perdendo apenas a aposta mínima, poupando seu ranking.

### 5.3. Rounds Assíncronos & Conservação de Mão (Mecânica Gwent)
- A partida ocorre em até **3 Rounds**.
- O vencedor de 2 Rounds ganha o confronto.
- **Cartas jogadas são descartadas após o round.**
- Se você perceber que o adversário usou o *Charizard VMAX* dele no Round 1, você pode intencionalmente **Passar o Turno** (desistir do Round 1 usando apenas cartas fracas de 1 PR).
- No Round 2 e 3, o adversário estará sem seu principal monstro, enquanto você ainda tem seu arsenal de cartas de elite intacto!

---

## 6. Vantagens Elementais e Terrenos Dinâmicos

Cada uma das 3 rotas possui um **Terreno Elemental Sorteado**:

| Terreno | Tipos Favorecidos (+20% CP) | Efeito Especial do Terreno |
|---|---|---|
| **Vulcão Ativo** | Fogo, Dragão | Pokémon com mais de 150 HP ganham $+15 \text{ CP}$ adicional por queima. |
| **Abismo Marinho** | Água, Elétrico | Fraquezas elétricas ativam o dobro de dano. |
| **Floresta Ancestral** | Grama, Inseto | Pokémon comuns (1 PR) ganham camuflagem e não podem ser revelados até o fim do combate. |
| **Câmara Psíquica** | Psíquico, Escuridão | Permite espiar 1 carta virada para baixo do oponente. |
| **Dojo de Combate** | Luta, Metal | Anula bônus de subtipos (`Mega`/`VMAX`); vence a força pura e HP. |

---

## 7. Roteiro de Implementação Futura (Roadmap Técnico)

1. **Fase 1 (Extração de Metadados):**
   - Script de enriquecimento no banco para computar e armazenar o `combat_power` de cada carta na tabela `cards` usando a fórmula de CP (lendo `hp`, `rarity`, e regex de sufixos no `name`).
2. **Fase 2 (Construtor de Minideck na UI):**
   - Tela em `apps/www/src/app/(app)/batalha/deck` com indicador visual do Teto Salarial (0/20 PR) e seleção de 6 Pokémon do inventário.
3. **Fase 3 (Motor de Batalha PvE / Treinadores da IA):**
   - Modo "Desafio de Ginásio": O jogador enfrenta Líderes de Ginásio (Brock, Misty, Giovanni) controlados pelo backend.
4. **Fase 4 (Multiplayer PvP em Tempo Real):**
   - Utilização do WebSocket já existente (`src/controller/ws.controller.ts`) para pareamento de salas, envio de jogadas ocultas e sincronização de Snaps/revelações.

---

> *Este Game Design Document consolida a visão para que o Pokémon TCG Simulator tenha uma experiência de jogo competitiva, viciante e justa, honrando o colecionismo do app e a verdadeira grandeza de monstros lendários como o Mega Rayquaza.*
