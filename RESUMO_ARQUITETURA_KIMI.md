# 🎱 BOOL SINUCA PREMIERE — Resumo Técnico para Arquiteta (Kimi)

> **Objetivo:** Este documento resume o estado atual do projeto para que a Kimi atue como arquiteta de software e eu (executor/agente) implemente as próximas etapas de forma coordenada.

---

## 1. VISÃO GERAL

**Bool Sinuca Premiere** é um jogo de sinuca/bilhar online (mobile-first) construído em Next.js 14 + TypeScript. O projeto está em estágio avançado de protótipo com:

- Gameplay local contra BOT (2 modos: 8-Ball e Sinuca Brasileira)
- Multiplayer online funcional via Supabase Realtime + Edge Functions
- Física 2D customizada in-house
- Sistema de mira com predição visual (ghost ball + linha amarela)
- Loja, perfil, leaderboard, autenticação (Supabase Auth)
- i18n (PT/EN/ES)

---

## 2. STACK TECNOLÓGICO

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Lang | TypeScript 5.3 |
| UI | React 18 + Tailwind CSS 3.4 |
| Animações | Framer Motion |
| Estado Global | Zustand (+ persist localStorage) |
| i18n | next-intl |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| Testes E2E | Playwright |
| Ícones | Lucide React |

**Dependências principais:**
- `@supabase/supabase-js`
- `zustand`, `framer-motion`, `next-intl`, `tailwind-merge`, `clsx`

---

## 3. ESTRUTURA DO PROJETO

```
src/
├── app/[locale]/
│   ├── (mobile)/           # Layout mobile (lobby, game, shop, etc)
│   │   ├── page.tsx        # Lobby principal
│   │   ├── game/[mode]/    # Jogo local/BOT
│   │   ├── game/multiplayer/  # Jogo multiplayer
│   │   ├── shop/
│   │   ├── leaderboard/
│   │   ├── profile/
│   │   └── friends/
│   └── (desktop)/          # Layout desktop (sidebar + dashboard)
│       └── play/[mode]/
├── components/
│   ├── game/               # Componentes core do jogo (compartilhados)
│   │   ├── GameScreen.tsx      # Orquestração principal do jogo
│   │   ├── MatchTable.tsx      # Composição canvas + overlays
│   │   ├── AimOverlay.tsx      # Mira, taco, ghost ball, linha guia
│   │   ├── PoolTable.tsx       # Renderização Canvas 2D das bolas
│   │   ├── PocketedBallRack.tsx
│   │   └── input/
│   │       ├── TouchDragInput.tsx   # Input mobile (drag)
│   │       └── MousePullBackInput.tsx # Input desktop (pull-back)
│   ├── mobile/
│   │   ├── lobby/MobileLobbyScreen.tsx
│   │   ├── game/MobileGameScreen.tsx
│   │   ├── game/MultiplayerGameScreen.tsx
│   │   ├── game/GameHUD.tsx, MultiplayerGameHUD.tsx
│   │   ├── game/PowerSlider.tsx, ShootButton.tsx
│   │   ├── layout/ (Header, BottomNav, ForceLandscape)
│   │   └── shop/
│   └── desktop/
├── lib/
│   ├── engine/gameEngine.ts     # MOTOR FÍSICO + regras + BOT
│   ├── ai/botAI.ts              # IA do bot (3 dificuldades)
│   ├── audio/gameAudio.ts       # Sons (cue hit, ball hit, etc)
│   ├── multiplayer/
│   │   ├── client.ts            # Cliente multiplayer (Realtime)
│   │   └── types.ts             # Tipos de sala, shots, etc
│   ├── store/
│   │   ├── gameStore.ts         # Estado da partida (Zustand)
│   │   └── userStore.ts         # Perfil, auth, economia (Zustand + persist)
│   ├── supabase/client.ts       # Cliente Supabase + tipos
│   ├── i18n/messages/           # pt.json, en.json, es.json
│   └── shop/                    # Canvas renderers para tacos/mesas
├── types/
└── hooks/                       # useMultiplayer, useLocale, etc

supabase/
├── functions/validate-shot/     # Edge Function: validação autoritativa
└── migrations/                  # Esquema do banco (rooms, profiles, etc)

tests/
└── physics.e2e.ts               # Testes Playwright da física
```

---

## 4. ESTADO ATUAL POR MÓDULO

### ✅ 4.1 MOTOR FÍSICO (`src/lib/engine/gameEngine.ts`)
**Status:** Implementado e calibrado. Funcional.

**Constantes atuais:**
```typescript
FRICTION = 0.97
WALL_RESTITUTION = 0.80
BALL_RESTITUTION = 0.94
STOP_THRESHOLD = 0.02
COLLISION_PASSES = 2
MIN_COLLISION_SPEED = 0.02
PHYSICS_SUBSTEPS = 2
THIN_CUT_ASSIST_RADIUS = 2
TABLE_WIDTH = 800, TABLE_HEIGHT = 400
SHOT_SPEED_SCALE = 0.48
```

**Features implementadas:**
- Loop fixo 60 FPS com accumulator
- Substeps (2) para estabilidade
- Colisão bola-bola com swept collision detection (evita túneling)
- Colisão bola-borda com restituição
- Caçapas (6 posições fixas)
- Fricção por frame proporcional à velocidade
- Parada suave com threshold progressivo
- Rotação das bolas (para animação de stripe)

**Regras de jogo implementadas:**
- **8-Ball:** break shot, atribuição de grupos (solid/stripe), foul (bola branca na caçapa, bola errada primeiro), vitória na bola 8, manutenção de turno ao matar bola do grupo.
- **Sinuca Brasileira:** 3 bolas (branca, vermelha, amarela), pontuação (1 ponto contato vermelha-amarela, 2 pontos boca), vitória aos 10 pontos, respawn da vermelha.

**Bot AI:** 3 dificuldades (easy/medium/hard). Easy atira aleatório, medium mira na bola mais próxima, hard faz raycast para caçapas.

---

### ✅ 4.2 SISTEMA DE MIRA (`AimOverlay.tsx`)
**Status:** Implementado. Funcional com refinamentos recentes.

**Features:**
- Linha branca (trajetória da bola branca) com detecção de primeira colisão
- Ghost ball na posição de contato
- Linha amarela (direção pós-colisão da bola alvo) — limitada a curta distância (~30% do percurso ou 100 unidades)
- Validação de alvo: ghost ball fica vermelha se o jogador mirar na bola errada (grupo adversário ou 8 prematura)
- Cue stick SVG com gradiente, anéis decorativos, indicador de power
- Indicador circular de power ao redor da bola branca
- Suporte a rebotes em borda (até 2 para cue, 1 para target)

**Constantes alinhadas com engine:** `SHOT_SPEED=0.48`, `BALL_RESTITUTION=0.94`, `FRICTION=0.97`

---

### ✅ 4.3 RENDERIZAÇÃO (`PoolTable.tsx` + `MatchTable.tsx`)
**Status:** Implementado. Canvas 2D customizado.

**Features:**
- Mesa com feltro verde (customizável por `tableId`)
- Bordas de madeira
- Caçapas circulares
- Bolas com sombra, brilho, números
- Bolas listradas (stripe) com animação de rolagem
- Fix recente: stripe para de animar quando bola para completamente

---

### ✅ 4.4 MULTIPLAYER ONLINE
**Status:** Implementado e funcional. Arquitetura híbrida.

**Fluxo:**
1. Jogador cria sala → status `waiting` → aguarda oponente
2. Oponente entra → status `playing` → Player 1 começa
3. Durante a partida:
   - **Aim preview:** broadcast Realtime (80ms throttle)
   - **Shot start:** broadcast Realtime + persist em `room_messages`
   - **Shot final:** quando bolas param, envia estado final para Edge Function `validate-shot`
   - **Validação:** Edge Function verifica autenticação, turno, limites, grava em `room_shots`, passa turno no banco
   - **Sincronização:** oponente recebe shot via Realtime (INSERT em `room_shots`) e aplica `applyRemoteState`

**Tabela `rooms`:**
- `id`, `player_1_id`, `player_2_id`, `status`, `current_turn`, `turn_started_at`, `game_mode`, `bet_coins`, `winner_id`

**Tabela `room_shots`:**
- Grava estado final das bolas, `game_state`, ângulo, power, spin

**Timer multiplayer:** Sincronizado via `turn_started_at` do banco (30s por turno). Timeout passa turno com `ballInHand=true`.

**Problema conhecido resolvido:** `game_state.currentPlayer` na edge function representa quem ACABOU de jogar, não o próximo. A lógica de `nextPlayerId` inverte corretamente.

---

### ✅ 4.5 AUTENTICAÇÃO E PERFIL
**Status:** Implementado.

**Features:**
- Sign up / Sign in / Sign out (Supabase Auth)
- Guest mode (anônimo ou mock local)
- Perfil: username, level, xp, coins, cash, stats, equipment
- Persistência no banco (se logado) ou localStorage (Zustand persist)
- Load session automático no mount

**Tabelas:** `profiles`, `matches`, `leaderboard`

---

### ✅ 4.6 LOJA
**Status:** Implementada com dados mockados.

**Features:**
- Tabs: Tacos, Mesas, Moedas, Cash, Especial
- Renderização de tacos e mesas em Canvas
- Sistema de compra/equipar (atualiza perfil local e no banco)
- Modal de pagamento (placeholder)

**Observação:** A loja ainda usa mocks para catálogo. A economia (coins/cash) é real para o usuário logado.

---

### ✅ 4.7 LOBBY E UI MOBILE
**Status:** Implementado e polido.

**Features:**
- Force landscape overlay (bloqueia portrait)
- Header com avatar, nível, moedas
- Bottom nav: Play, Shop, Friends, Leaderboard
- Carrossel de modos de jogo (8-Ball, Sinuca BR, Snooker)
- FABs: Play (single) + Multiplayer (online)
- Modal multiplayer: criar sala / entrar por código / listar salas abertas
- Animações Framer Motion em transições

---

### ✅ 4.8 DESKTOP
**Status:** Implementado. Layout alternativo com sidebar.

---

### ✅ 4.9 ÁUDIO
**Status:** Implementado (placeholders/stubs).

**Funções:** `playCueHit`, `playBallHit`, `playWallHit`, `playPocket`, `playWin`, `playTurnChange`, `playTick`

**Observação:** Os sons atualmente são sintetizados via Web Audio API (osciladores). Precisa de assets reais.

---

### ✅ 4.10 TESTES E2E
**Status:** Playwright configurado. Testes de física existem.

**Testes em `tests/physics.e2e.ts`:**
- Break shot: desaceleração gradual
- Fricção: parada suave
- Stripe: para quando bola para
- Cushion: rebote com perda de energia
- Multi-ball: conjunto para previsivelmente

---

## 5. PROBLEMAS E UX PENDENTES (Backlog Técnico)

### 🔴 Críticos / Quebram experiência
1. **Ball-in-hand UX:** Banner de "ball-in-hand" aparece mesmo quando não é turno do jogador local. Deve ser condicionado ao turno local.
2. **Idle cue automático:** O taco deveria aparecer automaticamente quando é turno do jogador local E as bolas estão paradas. Hoje requer interação do usuário.
3. **Close target yellow guide:** Quando a bola alvo está muito perta, a linha amarela passa pelo centro da bola. Deveria iniciar na borda da bola alvo. Se muito perto, esconder ou encurtar por instabilidade visual.

### 🟡 Importantes / Melhorias de gameplay
4. **Spin (efeito):** O sistema aceita `spinX/spinY` nos tipos, mas o engine ignora completamente. A física é puramente linear. Implementar spin (backspin, topspin, sidespin) afetando trajetória pós-colisão e rebate na borda.
5. **Sons reais:** Substituir oscilladores Web Audio por assets MP3/OGG (tacada, colisão bola-bola, colisão borda, bola na caçapa, vitória, música ambiente).
6. **Tutorial / Onboarding:** Não existe tutorial para novos jogadores. O jogo lança direto na mesa.
7. **Replay / Histórico de jogadas:** Não há como rever a última tacada.
8. **Spectator mode:** Não há como assistir partidas de outros jogadores.

### 🟢 Médios / Polimento
9. **Tabela de mesas no multiplayer:** O `tableId` é passado para `MatchTable`, mas não é sincronizado entre jogadores. Cada um vê sua mesa equipada.
10. **Customização do taco na mira:** O taco na `AimOverlay` tem cores hardcoded. Deveria refletir o taco equipado.
11. **Emotes / Quick chat no multiplayer:** Existe estrutura de mensagens, mas não há UI de chat rápido durante o jogo.
12. **Leaderboard real:** A tela existe mas pode não estar puxando dados reais do banco.
13. **Sistema de amigos:** Tela existe, mas funcionalidade de adicionar/convidar não implementada.
14. **Torneios:** Não implementado.

### 🔵 Baixa prioridade / Future
15. **Clube de jogadores / Guilds**
16. **Sistema de apostas real** (hoje é simulado)
17. **Integração de pagamentos** (cash)
18. **Modo Snooker** (tela existe no lobby, mas modo não implementado no engine)

---

## 6. DECISÕES ARQUITETURAIS IMPORTANTES

### 6.1 Engine como singleton vs factory
- Existe um singleton legado `gameEngine` para singleplayer
- Multiplayer usa `createGameEngine()` (factory) para isolar estado por partida
- **Regra:** Nunca misturar os dois no mesmo ciclo de vida

### 6.2 Separação física / autoritativa
- **Local/BOT:** Engine roda 100% no cliente. Regras aplicadas localmente.
- **Multiplayer:** Engine roda no cliente para predição visual, mas o estado final é validado pela Edge Function. O estado de turno é autoritativo no banco (`rooms.current_turn`).

### 6.3 Sincronização de estado
- Multiplayer não sincroniza posição das bolas em tempo real frame-a-frame. Sincroniza apenas o estado FINAL após as bolas pararem. Isso reduz bandwidth e simplifica, mas cria delay perceptível.
- **Decisão de arquitetura:** Manter assim ou evoluir para sincronização contínua (determinista + reconciliação)?

### 6.4 Canvas 2D vs WebGL
- Atualmente Canvas 2D puro. Performance é aceitável para 16 bolas.
- Se adicionar efeitos de partículas, iluminação, ou mesas 3D, WebGL (Three.js/Babylon) pode ser necessário.

### 6.5 Mobile-first
- Todo o input é otimizado para touch (drag).
- Desktop tem input alternativo (mouse pull-back).
- A tela é forçada para landscape no mobile.

---

## 7. MÉTRICAS E DESEMPENHO ATUAL

- **Build:** Passa (`npm run build` ok)
- **Type-check:** Passa (`npm run type-check` ok)
- **Lint:** Passa
- **Bundle:** Não analisado recentemente
- **FPS:** 60 estáveis em dispositivos modernos
- **Tempo de parada:** ~1.5-2.5s (realista)
- **Tempo de resposta multiplayer:** ~200-800ms (depende da validação Edge Function)

---

## 8. PRÓXIMOS PASSOS SUGERIDOS (Roadmap Técnico)

Para a Kimi definir prioridade e arquitetura:

### Lote A — UX Core (curto prazo, alto impacto)
- [ ] Fix ball-in-hand banner (só no turno local)
- [ ] Idle cue automático
- [ ] Fix yellow guide em alvos próximos
- [ ] Sons reais (assets + integração)

### Lote B — Gameplay Avançado (médio prazo)
- [ ] Sistema de Spin (efeito na bola)
- [ ] Replay da última tacada
- [ ] Tutorial interativo
- [ ] Quick chat emotes no multiplayer

### Lote C — Infraestrutura Multiplayer (médio prazo)
- [ ] Sincronização determinista: validar se todas as plataformas produzem mesma simulação
- [ ] Reconciliação de estado se houver divergência
- [ ] Anti-cheat básico (validação de posições impossíveis)
- [ ] Reconexão automática após queda

### Lote D — Conteúdo e Monetização (longo prazo)
- [ ] Modo Snooker completo
- [ ] Torneios automatizados
- [ ] Sistema de amigos funcional
- [ ] Leaderboard global real
- [ ] Pagamentos / In-app purchases

---

## 9. INFORMAÇÕES OPERACIONAIS

**Comandos de desenvolvimento:**
```bash
npm run dev          # localhost:3000
npm run build        # build de produção
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run test:e2e     # Playwright
```

**Variáveis de ambiente necessárias:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # (Edge Function)
```

**Regras para o executor (agente):**
- Sem `any` no TypeScript
- Sem dynamic imports
- Mudanças mínimas e focadas
- Não misturar física, timer, multiplayer e layout na mesma task
- Sempre rodar `npm run type-check`, `npm run build`, `git status --short`

---

## 10. PERGUNTAS PARA A ARQUITETA (Kimi)

1. **Arquitetura de sincronização multiplayer:** Devemos evoluir para determinismo frame-a-frame (todos os clientes simulam o mesmo shot) ou manter o modelo "estado final apenas"? Qual é o melhor custo/benefício para sinuca?

2. **Sistema de spin:** Spin deve ser um vetor 2D simples (backspin/topspin/sidespin) ou precisamos de um modelo físico mais complexo (rotational physics)? Qual a abordagem mais simples que entrega valor?

3. **Anti-cheat:** Com o estado final sendo validado, o que mais precisamos proteger? Ex: validar que a trajetória das bolas é fisicamente possível (checar se não houve teleporte)?

4. **Assets de áudio:** Devemos usar um sistema de áudio baseado em sprites (um arquivo com todos os sons) ou arquivos individuais carregados sob demanda?

5. **Escalabilidade multiplayer:** Atualmente usamos Supabase Realtime + Edge Functions. Para escalar, precisaríamos de um servidor dedicado (Node.js + WebSocket) ou a arquitetura serverless atual é suficiente para lançamento?

6. **Prioridade de features:** Considerando que queremos lançar um MVP jogável o quanto antes, qual ordem de implementação você recomenda para os Lotes A-D?

---

**Documento preparado para:** Arquiteta Kimi
**Executor:** Agente de desenvolvimento (eu)
**Data:** 2026-05-11
**Projeto:** Bool Sinuca Premiere
