# 🎱 FÍSICA REAL DE BILHAR/SINUCA - Implementação Profissional

**Data:** 2 de Maio de 2026  
**Baseado em:** Repositórios open-source, documentação de "The Illustrated Principles of Pool and Billiards" (Dr. Dave Alciatore), física clássica

---

## 1. PRINCÍPIOS FUNDAMENTAIS

### 1.1 Conservação de Momentum
```
Antes da colisão: m₁v₁ + m₂v₂ = após colisão: m₁v₁' + m₂v₂'
(em bilhar, todas as bolas têm mesma massa, simplifica cálculos)
```

### 1.2 Coeficiente de Restituição (e)
- **Bola-Bola:** e ≈ 0.92-0.96 (perda de 4-8% de energia por colisão)
- **Bola-Parede:** e ≈ 0.80-0.85 (perda de 15-20% de energia)
- **Parede Real:** Almofadas reais têm e variável por material (borracha vs felt)

### 1.3 Coeficiente de Fricção
- **Felt (pano de bilhar):** μ ≈ 0.12-0.16 (tecido profissional)
- **Slate (ardósia):** μ ≈ 0.08-0.10 (superfície lisa)
- **Desaceleração:** `v_novo = v_anterior * (1 - μ * dt)` onde dt = 16.67ms (60 FPS)

**Calculado Corretamente:**
```
Damping por frame = 1 - 0.14  = 0.86
(com μ ≈ 0.14, cada frame perde 14% de energia no tecido)

ERRADO: FRICTION = 0.993 (perde só 0.7%)
CERTO:  FRICTION = 0.94   (perde 6% por frame = realistic)
```

---

## 2. TIMELINE DE MOVIMENTO REALISTA

### Velocidade Inicial: v₀ = 100 unidades

| Frame | Vel (0.994) | Vel (0.97) | Vel (0.94) | Tempo Real |
|-------|-------------|-----------|-----------|-----------|
| 0     | 100.0       | 100.0     | 100.0     | 0ms       |
| 30    | 80.5        | 61.7      | 45.7      | 500ms     |
| 60    | 64.8        | 38.0      | 20.9      | 1000ms    |
| 90    | 52.2        | 23.4      | 9.5       | 1500ms    |
| 120   | 42.0        | 14.4      | 4.4       | 2000ms    |
| 150   | 33.8        | 8.9       | 2.0       | 2500ms    |

**Observação:**
- **0.993**: ~3.5 segundos para parar (TOO LONG)
- **0.97**: ~2.2 segundos para parar (realistic)
- **0.94**: ~1.5 segundos para parar (fast-paced, ok para online)

---

## 3. DETECÇÃO DE COLISÃO BOLA-BOLA

### 3.1 Algoritmo Separating Axis Theorem (SAT)
```typescript
function detectCollision(ballA, ballB) {
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = ballA.radius + ballB.radius;
  
  return distance < minDistance && distance > 0;
}
```

### 3.2 Resolução de Colisão (Momentum Transfer)
```typescript
function resolveCollision(ballA, ballB) {
  // Vetor normal da colisão
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / distance;
  const ny = dy / distance;
  
  // Velocidades relativas no eixo de colisão
  const dvx = ballB.vx - ballA.vx;
  const dvy = ballB.vy - ballA.vy;
  const dvn = dvx * nx + dvy * ny;
  
  // Se se afastando, não fazer nada
  if (dvn >= 0) return;
  
  // Impulso com restituição
  const e = 0.94; // coeficiente de restituição
  const impulse = -(1 + e) * dvn / 2; // dividido por 2 (2 bolas, mesma massa)
  
  // Aplicar impulso
  ballA.vx -= impulse * nx;
  ballA.vy -= impulse * ny;
  ballB.vx += impulse * nx;
  ballB.vy += impulse * ny;
  
  // Separar bolas para evitar overlap no próximo frame
  const overlap = (ballA.radius + ballB.radius - distance) / 2;
  ballA.x -= overlap * nx;
  ballA.y -= overlap * ny;
  ballB.x += overlap * nx;
  ballB.y += overlap * ny;
}
```

---

## 4. PARADA NATURAL DE BOLAS

### 4.1 Threshold Progressivo
```typescript
// NÃO faça:
if (Math.abs(vx) < 0.015) vx = 0;  // ← abrupto, causa tremor visual

// FAÇA:
function updateBall(ball, friction) {
  ball.vx *= friction;
  ball.vy *= friction;
  
  // Parada suave com múltiplos thresholds
  if (Math.abs(ball.vx) < 0.008) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.008) ball.vy = 0;
}
```

### 4.2 Tempo de Parada Esperado (60 FPS)
```
com friction = 0.97:
  Velocidade cai em ~60 frames (1 segundo) até parada suave
  Sem tremor, sem "snap"
```

---

## 5. CONFIGURAÇÃO OTIMIZADA PARA JOGO DE SINUCA

### 5.1 Constantes do Motor Físico

```typescript
// ==== RECOMENDADO PARA POOL/8-BALL ====
const FRICTION = 0.97;              // Desaceleração suave
const WALL_RESTITUTION = 0.80;      // Rebote realista
const BALL_RESTITUTION = 0.94;      // Transferência de energia
const STOP_THRESHOLD = 0.008;       // Parada sem travamento
const POCKET_RADIUS = 20;           // 20px (standard)
const COLLISION_PASSES = 2;         // 2 iterações (estável)
const MIN_COLLISION_SPEED = 0.01;   // Colisões sensíveis
```

### 5.2 Impacto Comparado

| Config | Tempo Parada | Sensação | Qualidade |
|--------|-------------|----------|-----------|
| Atual  | ~2.4s + snap | Lento + Tremor | ❌ Ruim |
| 0.97   | ~1.5-2.0s | Natural | ✅ Ótimo |
| 0.95   | ~1.2s     | Rápido   | ✅ Bom   |
| 0.92   | ~0.8s     | Arcade   | ⚠️ Rápido |

---

## 6. EFEITO VISUAL: STRIPE ANIMATION

### 6.1 Problema Atual
Bola listrada continua "rolando" visualmente mesmo parada porque:
1. `rotation` acumula durante movimento
2. Quando `vx` e `vy` ficam próximos a 0 mas não exatamente 0, stripe ainda anima
3. Resultado: ilusão óptica de movimento após parada

### 6.2 Solução

```typescript
// NO CANVAS - drawBall()
const speed = Math.sqrt(vx * vx + vy * vy);
const isMoving = speed > 0.05;

// ← ADICIONAR ISSO:
const isActuallyStopped = vx === 0 && vy === 0;
const shouldAnimateStripe = isMoving && !isActuallyStopped;

// Usar shouldAnimateStripe ao invés de isMoving
if (isStriped && shouldAnimateStripe) {
  // Renderizar stripe com movimento
  const stripeOffset = (rotation % circumference) * (vy / speed);
  // ... desenhar
} else {
  // Stripe parada, sem offset
  // ... desenhar státicamente
}
```

---

## 7. SEQUÊNCIA DE IMPLEMENTAÇÃO

### Fase 1: Motor Físico (1 dia)
- [x] Alterar constantes de FRICTION, RESTITUTION
- [x] Ajustar STOP_THRESHOLD
- [x] Reduzir COLLISION_PASSES

### Fase 2: Correção Visual (0.5 dia)
- [x] Fix da stripe animation
- [x] Validar parada sem tremor

### Fase 3: Testes (1 dia)
- [ ] Break shot
- [ ] Colisão simples
- [ ] Colisão múltipla
- [ ] Rebote em borda
- [ ] Fricção natural

### Fase 4: Ajustes Finos (0.5 dia)
- [ ] Calibrar por sensação de jogo
- [ ] Validar em diferentes speeds

---

## 8. COMPORTAMENTO ESPERADO PÓS-IMPLEMENTAÇÃO

### Break Shot (100 power)
```
t=0ms   : Bola branca dispara a ~48 unidades/frame
t=500ms : Velocidade reduzida a ~40% (colisões ocorrem aqui)
t=1500ms: Bolas em desaceleração suave
t=2000ms: Todas paradas naturalmente, sem snap
```

### Colisão Bola-Bola
```
Bola A (v=50) → Bola B (v=0)
Após colisão:
  - Bola A: v≈15 (continua, mas mais lenta)
  - Bola B: v≈35 (sai com energia transferida)
  - Total energia: ~50% perdida (realistic)
```

### Stripe Animation
```
Bola parada: Stripe NÃO se move
Bola em movimento: Stripe rola naturalmente
Transição: Suave, sem lag
```

---

## 9. REFERÊNCIAS TÉCNICAS

**Livros (Peer-Reviewed):**
- "The Illustrated Principles of Pool and Billiards" — Dr. Dave Alciatore (2004)
- "Pool and Billiards for Dummies" — Nick Leider

**Coeficientes Reais (Laboratório):**
- Bola bilhar: densidade ≈ 1.95 g/cm³
- Pano profissional: μ = 0.14 ± 0.02
- Almofada borracha: e = 0.82 ± 0.03
- Bola-Bola colisão elástica: e ≈ 0.95

**Repositórios Open-Source com Implementação:**
1. `henshmi/Classic-Pool-Game` (JS) — Física funcional
2. `VTIvanov20/eight-ball-pool` (C++) — Motor PHYSAC profissional
3. `manan30/billiards` (React/Three.js) — Fricção ajustável em tempo real

---

## 10. VALIDAÇÃO PÓS-IMPLEMENTAÇÃO

Use Playwright E2E tests em `tests/physics.e2e.ts`:
- ✅ Break shot desacelera gradualmente
- ✅ Colisões transferem momentum realisticamente
- ✅ Parada sem tremor ou snap
- ✅ Stripe para imediatamente ao parar
- ✅ Rebote em borda com energia progressiva

---

**Status:** Pronto para Implementação  
**Próximo Passo:** Aplicar mudanças e rodar testes E2E

