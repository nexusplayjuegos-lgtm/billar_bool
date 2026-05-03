# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: physics.e2e.ts >> Cushion: bola rebate em borda e perde energia
- Location: tests\physics.e2e.ts:178:5

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
  119 |   // Validar que a desaceleração é suave (não abrupta)
  120 |   if (velocities.length > 10) {
  121 |     const velocityChanges = [];
  122 |     for (let i = 1; i < velocities.length; i++) {
  123 |       velocityChanges.push(velocities[i - 1] - velocities[i]);
  124 |     }
  125 | 
  126 |     const avgChange = velocityChanges.reduce((a, b) => a + b) / velocityChanges.length;
  127 |     const maxChange = Math.max(...velocityChanges);
  128 | 
  129 |     console.log(`
  130 |       Velocidades coletadas: ${velocities.length}
  131 |       Mudança média: ${avgChange.toFixed(4)}
  132 |       Mudança máxima: ${maxChange.toFixed(4)}
  133 |       Parou: ${stopped ? 'SIM' : 'NÃO'}
  134 |     `);
  135 | 
  136 |     // Validação: mudança de velocidade deve ser gradual
  137 |     expect(maxChange).toBeLessThan(5); // não deve "travar" abruptamente
  138 |   }
  139 | 
  140 |   expect(stopped || velocities[velocities.length - 1] < 0.02).toBe(true);
  141 | });
  142 | 
  143 | // ============================================================
  144 | // TESTE 4: Parada e stripe visual
  145 | // ============================================================
  146 | test('Stripe animation stops when ball stops', async () => {
  147 |   const canvas = await page.locator('canvas').first();
  148 |   expect(canvas).toBeVisible();
  149 | 
  150 |   // Dispara bola
  151 |   await page.evaluate(() => {
  152 |     const event = new CustomEvent('shoot', {
  153 |       detail: { power: 30, angle: 0 }
  154 |     });
  155 |     window.dispatchEvent(event);
  156 |   });
  157 | 
  158 |   // Aguarda parada
  159 |   await page.waitForTimeout(3000);
  160 | 
  161 |   // Verifica que bola parou
  162 |   const finalState = await page.evaluate(() => {
  163 |     return (window as any).__gameState;
  164 |   });
  165 | 
  166 |   if (finalState && finalState.balls[0]) {
  167 |     const v = Math.sqrt(
  168 |       finalState.balls[0].vx ** 2 + finalState.balls[0].vy ** 2
  169 |     );
  170 |     expect(v).toBeLessThan(0.02);
  171 |     console.log(`✓ Bola parada (v=${v.toFixed(6)})`);
  172 |   }
  173 | });
  174 | 
  175 | // ============================================================
  176 | // TESTE 5: Rebote em borda
  177 | // ============================================================
  178 | test('Cushion: bola rebate em borda e perde energia', async () => {
> 179 |   const canvas = await page.locator('canvas').first();
      |                  ^ ReferenceError: page is not defined
  180 |   expect(canvas).toBeVisible();
  181 | 
  182 |   // Dispara contra borda direita
  183 |   await page.evaluate(() => {
  184 |     const event = new CustomEvent('shoot', {
  185 |       detail: { power: 75, angle: 0 } // para direita
  186 |     });
  187 |     window.dispatchEvent(event);
  188 |   });
  189 | 
  190 |   // Coleta momento antes e depois do rebote
  191 |   await page.waitForTimeout(1500);
  192 | 
  193 |   const stateAfterBounce = await page.evaluate(() => {
  194 |     return (window as any).__gameState;
  195 |   });
  196 | 
  197 |   if (stateAfterBounce && stateAfterBounce.balls[0]) {
  198 |     const cueBall = stateAfterBounce.balls[0];
  199 |     console.log(`
  200 |       Posição final: x=${cueBall.x.toFixed(2)}, y=${cueBall.y.toFixed(2)}
  201 |       Velocidade final: vx=${cueBall.vx.toFixed(4)}, vy=${cueBall.vy.toFixed(4)}
  202 |       Velocidade magnitude: ${Math.sqrt(cueBall.vx ** 2 + cueBall.vy ** 2).toFixed(4)}
  203 |     `);
  204 | 
  205 |     // Bola deve estar próxima à borda depois de rebater
  206 |     expect(Math.abs(cueBall.x - 772) || Math.abs(cueBall.x - 28)).toBeDefined();
  207 |   }
  208 | });
  209 | 
  210 | // ============================================================
  211 | // TESTE 6: Múltiplas bolas em movimento
  212 | // ============================================================
  213 | test('Multi-ball: conjunto de bolas se move de forma previsível', async () => {
  214 |   const canvas = await page.locator('canvas').first();
  215 |   expect(canvas).toBeVisible();
  216 | 
  217 |   // Estado inicial
  218 |   const initialState = await page.evaluate(() => {
  219 |     return (window as any).__gameState;
  220 |   });
  221 | 
  222 |   const initialBallsMoving = initialState?.balls
  223 |     .filter((b: any) => b.id !== 0 && !b.inPocket)
  224 |     .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.1).length || 0;
  225 | 
  226 |   console.log(`Bolas em movimento inicialmente: ${initialBallsMoving}`);
  227 | 
  228 |   // Dispara
  229 |   await page.evaluate(() => {
  230 |     const event = new CustomEvent('shoot', {
  231 |       detail: { power: 80, angle: 0 }
  232 |     });
  233 |     window.dispatchEvent(event);
  234 |   });
  235 | 
  236 |   await page.waitForTimeout(500);
  237 | 
  238 |   const midState = await page.evaluate(() => {
  239 |     return (window as any).__gameState;
  240 |   });
  241 | 
  242 |   const ballsMovingMid = midState?.balls
  243 |     .filter((b: any) => !b.inPocket)
  244 |     .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.1).length || 0;
  245 | 
  246 |   console.log(`Bolas em movimento após colisão: ${ballsMovingMid}`);
  247 | 
  248 |   // Aguarda total parada
  249 |   await page.waitForTimeout(4000);
  250 | 
  251 |   const finalState = await page.evaluate(() => {
  252 |     return (window as any).__gameState;
  253 |   });
  254 | 
  255 |   const ballsMovingFinal = finalState?.balls
  256 |     .filter((b: any) => !b.inPocket)
  257 |     .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.01).length || 0;
  258 | 
  259 |   console.log(`Bolas em movimento no final: ${ballsMovingFinal}`);
  260 | 
  261 |   expect(ballsMovingFinal).toBe(0);
  262 | });
  263 | 
```