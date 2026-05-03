# 📊 DIAGNÓSTICO DA FÍSICA DE SINUCA — Análise Detalhada

**Data:** 2 de Maio de 2026  
**Status:** Investigação Concluída  
**Objetivo:** Entender configuração atual e identificar root causes dos problemas

---

## 1. PARÂMETROS DE FÍSICA ATUAIS

Arquivo: [`src/lib/engine/gameEngine.ts`](src/lib/engine/gameEngine.ts)

| Parâmetro | Valor | Impacto |
|-----------|-------|---------|
| **FRICTION** | `0.993` | Bola perde 0.7% de velocidade POR FRAME (muito lento!) |
| **WALL_RESTITUTION** | `0.86` | Bola rebate na borda com 86% da energia original |
| **BALL_RESTITUTION** | `0.98` | Colisão bola-bola transfere 98% de energia |
| **STOP_THRESHOLD** | `0.015` | Qualquer velocidade < 0.015 vira 0 imediatamente |
| **COLLISION_PASSES** | `4` | 4 iterações de detecção de colisão por step |
| **MIN_COLLISION_SPEED** | `0.02` | Ignora colisões com velocidade relativa < 0.02 |
| **SHOT_SPEED_SCALE** | `0.48` | Converte `power` (0-100) em velocidade real |
| **FPS (step)** | `1000/60 ≈ 16.67ms` | 60 FPS, step fixo de ~16.67ms |

---

## 2. ANÁLISE DO COMPORTAMENTO OBSERVADO

### 🔴 Problema #1: "Algumas bolas demoram parar, outras param de forma estranha"

**Root Cause:**

```
FRICTION = 0.993 é MUITO ALTA

Exemplo numérico (velocidade de 50 unidades):
├─ Frame 0:   v = 50.0
├─ Frame 1:   v = 50.0 × 0.993 = 49.65
├─ Frame 2:   v = 49.65 × 0.993 = 49.30
├─ ...
├─ Frame 143: v = 0.016 (ainda acima do STOP_THRESHOLD de 0.015)
├─ Frame 144: v = 0.016 × 0.993 = 0.0159
├─ Frame 145: v = 0.0159 × 0.993 = 0.0158
├─ Frame 146: v = 0.0158 × 0.993 = 0.0157
└─ Frame 147: v = 0.0157 × 0.993 ≈ 0.01559 → PULA PARA 0 (STOP_THRESHOLD ativado)
```

**Tempo Total:** ~2.4 segundos para desaceleração + parada abrupta

**O Problema:** 
- A bola desacelera MUITO LENTAMENTE
- Quando atinge o limiar STOP_THRESHOLD, **trava abruptamente** ao invés de deslizar gradualmente
- Isto cria a sensação de movimento errático: "demora muito pra parar" + "para de forma estranha"

---

### 🔴 Problema #2: "Bolas listradas continuam com ilusão óptica mesmo paradas"

**Arquivo:** [`src/components/game/PoolTable.tsx`](src/components/game/PoolTable.tsx) (linhas ~230-280)

**Código Problemático:**
```typescript
const speed = Math.sqrt(vx * vx + vy * vy);
const isMoving = speed > 0.05;  // ← THRESHOLD de detecção

let scrollX = 0, scrollY = 0;
if (isMoving) {
  // Calcula scroll baseado em rotation
  const scrollDist = rotation % circumference;
  scrollX = dirX * scrollDist;
  scrollY = dirY * scrollDist;
}

// Desenha stripe com scrollX/scrollY
if (isStriped && number && number > 8) {
  const stripeOffset = isMoving
    ? (rotation % circumference) * (vy / (speed || 1))
    : 0;
  // ... desenha stripe com stripeOffset
}
```

**Root Cause:**
1. `isMoving = speed > 0.05` — threshold de 0.05
2. Mas quando a bola para (vx=0, vy=0), `speed` fica 0
3. **PORÉM:** `rotation` continua acumulando durante o movimento
4. Se `rotation % circumference` deixou um valor residual, e `vx` ou `vy` ficarem com valores muito pequenos (tipo 0.001), a stripe ainda pode renderizar com offset

**Cenário Real:**
```
Frame 1000: vx = 0.0159, vy = 0.0001, rotation = 1250.5, isMoving = TRUE → stripe tem offset
Frame 1001: vx = 0.0157, vy = 0.00009, rotation = 1250.5, isMoving = TRUE → stripe ainda animada
Frame 1002: vx = 0 (STOP_THRESHOLD), vy = 0, rotation = 1250.5, isMoving = FALSE → stripe para
  MAS stripe continua visível com "ilusão" de movimento!
```

**O real culpado:** O `rotation` acumulado deixa a stripe em uma posição que **parece estar rolando** mesmo quando parada.

---

### 🔴 Problema #3: "Movimentação de bolas não é coerente"

**Causas Múltiplas:**

1. **RESTITUÇÃO muito alta (0.98 para bola-bola, 0.86 para borda)**
   - Bolas perdem muito pouca energia em colisões
   - Causam "ricochetes" prolongados
   - Combinado com FRICTION alta, o movimento parece "travado"

2. **COLLISION_PASSES = 4**
   - 4 iterações de separação-colisão POR FRAME
   - Pode causar instabilidade numérica: bola entra, sai, entra, sai...
   - Resultado: movimento "tremendo" ou "saltitante"

3. **MIN_COLLISION_SPEED = 0.02**
   - Colisões muito fracas (speed < 0.02) são ignoradas
   - Bolas ficam "presas" uma na outra com velocidade mínima
   - Parecem não se separar corretamente

---

## 3. COMO FUNCIONAM AS COLISÕES ATUALMENTE

Arquivo: [`src/lib/engine/gameEngine.ts`](src/lib/engine/gameEngine.ts) (linhas ~430-500)

### Detecção de Colisão:
```typescript
for (let pass = 0; pass < COLLISION_PASSES; pass++) {  // 4 vezes!
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      // Detecta sobreposição
      if (dist < minDist && dist > 0) {
        // Separa as bolas
        overlap = minDist - dist;
        a.x -= nx * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        
        // Transfere energia
        transfer = normalDelta * BALL_RESTITUTION;
        a.vx -= transfer * nx;
        b.vx += transfer * nx;
      }
    }
  }
}
```

**Problema:** 
- Separação + transferência de velocidade ocorre **4 vezes por frame**
- Isto pode amplificar pequenas imprecisões numéricas
- Resulta em movimento instável

---

## 4. TIMELINE: QUANTO TEMPO PARA CHEGAR NA CONFIG CORRETA?

### Análise Realista:

**Sem investigação:** 15-30 dias (tentativa-erro)  
**Com investigação estruturada:** 3-5 dias

### Por que 3-5 dias?

1. **Ajuste de FRICTION** (1 dia)
   - Testar valores: 0.98, 0.97, 0.96, 0.95
   - Objetivo: desaceleração suave e natural
   - Métrica: bola deve levar 4-6 segundos para parar

2. **Ajuste de RESTITUÇÃO** (1 dia)
   - Testar WALL_RESTITUTION: 0.75-0.85
   - Testar BALL_RESTITUTION: 0.92-0.96
   - Objetivo: colisões realistas com perda gradual

3. **Ajuste de STOP_THRESHOLD e MIN_COLLISION_SPEED** (0.5 dia)
   - STOP_THRESHOLD → 0.008-0.012
   - MIN_COLLISION_SPEED → 0.01-0.015
   - Objetivo: parada suave sem travamento

4. **Redução de COLLISION_PASSES** (0.5 dia)
   - Testar: 2 passes ao invés de 4
   - Objetivo: estabilidade sem oscilação

5. **Fix da Stripe Animation** (1 dia)
   - Forçar `isMoving = FALSE` quando `vx === 0 && vy === 0`
   - Resetar `rotation` quando parada
   - Objetivo: stripe para imediatamente ao bola parar

6. **Testes e Validação** (1 dia)
   - Testar múltiplos cenários
   - Validar sensação de jogo

---

## 5. RECOMENDAÇÕES INICIAIS (Configuração Ideal)

### 🎯 Configuração Proposta:

```typescript
// gameEngine.ts — valores sugeridos

const FRICTION = 0.97;               // ↓ de 0.993 (mais desaceleração)
const WALL_RESTITUTION = 0.80;       // ↓ de 0.86 (menos rebote)
const BALL_RESTITUTION = 0.94;       // ↓ de 0.98 (menos energia em colisão)
const STOP_THRESHOLD = 0.010;        // ↓ de 0.015 (limiar mais baixo)
const COLLISION_PASSES = 2;          // ↓ de 4 (menos iterações, mais estável)
const MIN_COLLISION_SPEED = 0.01;    // ↓ de 0.02 (colisões mais sensíveis)
```

### ✨ Fix da Stripe:

```typescript
// PoolTable.tsx — linha ~230

const speed = Math.sqrt(vx * vx + vy * vy);
const isMoving = speed > 0.05;

// FIX: Se velocidades estão zeradas, force isMoving = FALSE
const isActuallyStopped = vx === 0 && vy === 0;
const shouldAnimate = isMoving && !isActuallyStopped;

// Use shouldAnimate ao invés de isMoving para stripe
if (isStriped && shouldAnimate) {
  // anima stripe
} else {
  // stripe parada, sem offset
}
```

---

## 6. PRÓXIMOS PASSOS

1. **Baseline Test:**
   - Registrar vídeos com config atual
   - Medir tempo de parada (cronômetro)
   - Documenter comportamento anômalo

2. **Implementar Alterações:**
   - Mudar constantes de physics
   - Aplicar fix da stripe
   - Compilar e testar

3. **Validação:**
   - Primeira tacada
   - Impacto com uma bola
   - Impacto com múltiplas bolas
   - Rebote em borda
   - Colisão em cadeia

4. **Iteração:**
   - Ajustar baseado em sensação
   - Documentar cada teste
   - Convergir para config ideal

---

## 📋 Summary

| Aspecto | Atual | Ideal | Impacto |
|---------|-------|-------|---------|
| **FRICTION** | 0.993 | 0.97 | Desaceleração mais natural |
| **Tempo de parada** | ~2.4s | 4-6s | Movimento mais realista |
| **Parada abrupta** | Sim (STOP_THRESHOLD) | Não (suave) | Melhor UX |
| **Stripe animada parada** | Sim (bug) | Não (fixo) | Melhor visual |
| **Colisões estáveis** | Instável (4 passes) | Estável (2 passes) | Melhor gameplay |

---

## 🎮 Objetivo Final

> **"A bola branca sai em direção às outras. Cada bola responde ao impacto de forma coerente. Se não bate em nada, percorre e perde força até parar. Bolas juntas têm movimento diferente de quando afastadas. Sempre se movem conforme inércia. Se bate na borda com força, volta com força e perde gradualmente. Se bate em bola ou duas, as que recebem o impacto se mexem conforme lógica. Uma orquestra de movimento gerado por energia de impacto que diminui por interferência."**

✅ **Resultado esperado com estas alterações:** Jogo de sinuca profissional com física realista e previsível.

