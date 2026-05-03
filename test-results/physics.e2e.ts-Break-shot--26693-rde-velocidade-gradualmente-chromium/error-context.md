# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: physics.e2e.ts >> Break shot: bola branca sai em linha reta e perde velocidade gradualmente
- Location: tests\physics.e2e.ts:16:5

# Error details

```
ReferenceError: page is not defined
```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e8]: EU
          - generic [ref=e10]:
            - generic [ref=e11]: Você
            - generic [ref=e13]: —
        - generic [ref=e15]:
          - img [ref=e16]
          - generic [ref=e19]: 30s
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: BOT
            - generic [ref=e24]: —
          - generic [ref=e26]: 🤖
      - button "Sair" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
        - generic [ref=e31]: Sair
    - generic [ref=e41]: ABERTURA — Posicione atrás da linha
  - alert [ref=e42]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Testes E2E para validar física de bilhar
  5   |  * Foca em comportamento realista: desaceleração, colisão, fricção
  6   |  */
  7   | 
  8   | test.beforeEach(async ({ page }) => {
  9   |   await page.goto('http://localhost:3000/pt/game/8ball');
  10  |   await page.waitForSelector('canvas', { state: 'visible', timeout: 15000 });
  11  | });
  12  | 
  13  | // ============================================================
  14  | // TESTE 1: Primeira tacada - Break shot
  15  | // ============================================================
  16  | test('Break shot: bola branca sai em linha reta e perde velocidade gradualmente', async () => {
  17  |   // Espera canvas estar pronto
> 18  |   const canvas = await page.locator('canvas').first();
      |                  ^ ReferenceError: page is not defined
  19  |   expect(canvas).toBeVisible();
  20  | 
  21  |   // Simula taque na bola branca (100% power, ângulo 0 radianos = direita)
  22  |   await page.evaluate(() => {
  23  |     const event = new CustomEvent('shoot', {
  24  |       detail: { power: 100, angle: 0 }
  25  |     });
  26  |     window.dispatchEvent(event);
  27  |   });
  28  | 
  29  |   // Aguarda bolas se moverem
  30  |   await page.waitForTimeout(500);
  31  | 
  32  |   // Coleta estado das bolas em 3 momentos
  33  |   const states: any[] = [];
  34  |   for (let i = 0; i < 3; i++) {
  35  |     const gameState = await page.evaluate(() => {
  36  |       return (window as any).__gameState;
  37  |     });
  38  | 
  39  |     if (gameState) {
  40  |       states.push({
  41  |         time: i * 100,
  42  |         cueBall: gameState.balls[0],
  43  |         ballsCount: gameState.balls.length,
  44  |         ballsMoving: gameState.ballsMoving
  45  |       });
  46  |     }
  47  |     await page.waitForTimeout(100);
  48  |   }
  49  | 
  50  |   // Validações
  51  |   expect(states.length).toBeGreaterThan(0);
  52  |   
  53  |   // Bola branca deve ter velocidade decrescente
  54  |   if (states[0]?.cueBall && states[1]?.cueBall) {
  55  |     const v1 = Math.sqrt(states[0].cueBall.vx ** 2 + states[0].cueBall.vy ** 2);
  56  |     const v2 = Math.sqrt(states[1].cueBall.vx ** 2 + states[1].cueBall.vy ** 2);
  57  |     
  58  |     expect(v2).toBeLessThan(v1);
  59  |     console.log(`✓ Velocidade reduzida: ${v1.toFixed(2)} → ${v2.toFixed(2)}`);
  60  |   }
  61  | });
  62  | 
  63  | // ============================================================
  64  | // TESTE 2: Colisão bola-bola
  65  | // ============================================================
  66  | test.skip('Collision: bola branca bate em outra e transfere energia', async ({ page }) => {
  67  |   const canvas = await page.locator('canvas').first();
  68  |   await expect(canvas).toBeVisible();
  69  | 
  70  |   // Nota: este teste precisa de posicionamento específico
  71  |   // Para um E2E real, seria necessário:
  72  |   // 1. Posicionar bola branca próxima a outra
  73  |   // 2. Disparar no ângulo correto
  74  |   // 3. Registrar velocidades pré e pós-colisão
  75  | 
  76  |   console.log('⚠ Collision test: requer posicionamento manual');
  77  | });
  78  | 
  79  | // ============================================================
  80  | // TESTE 3: Fricção - desaceleração natural
  81  | // ============================================================
  82  | test('Friction: bola desacelera e para de forma suave', async ({ page }) => {
  83  |   const canvas = await page.locator('canvas').first();
  84  |   await expect(canvas).toBeVisible();
  85  | 
  86  |   // Dispara com power médio
  87  |   await page.evaluate(() => {
  88  |     const event = new CustomEvent('shoot', {
  89  |       detail: { power: 50, angle: Math.PI / 4 } // diagonal
  90  |     });
  91  |     window.dispatchEvent(event);
  92  |   });
  93  | 
  94  |   // Coleta velocidades em intervalos regulares
  95  |   const velocities: number[] = [];
  96  |   let stopped = false;
  97  | 
  98  |   for (let i = 0; i < 240; i++) {
  99  |     const gameState = await page.evaluate(() => {
  100 |       return (window as any).__gameState;
  101 |     });
  102 | 
  103 |     if (gameState && gameState.balls[0]) {
  104 |       const v = Math.sqrt(
  105 |         gameState.balls[0].vx ** 2 + gameState.balls[0].vy ** 2
  106 |       );
  107 |       velocities.push(v);
  108 | 
  109 |       if (v < 0.01 && i > 10) {
  110 |         stopped = true;
  111 |         console.log(`✓ Bola parou em ~${i * 16}ms`);
  112 |         break;
  113 |       }
  114 |     }
  115 | 
  116 |     await page.waitForTimeout(16); // ~60 FPS
  117 |   }
  118 | 
```