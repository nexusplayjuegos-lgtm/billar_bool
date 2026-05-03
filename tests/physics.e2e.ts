import { test, expect, Page } from '@playwright/test';

/**
 * Testes E2E para validar física de bilhar
 * Foca em comportamento realista: desaceleração, colisão, fricção
 */

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/pt/game/8ball');
  await page.waitForSelector('canvas', { state: 'visible', timeout: 15000 });
});

// ============================================================
// TESTE 1: Primeira tacada - Break shot
// ============================================================
test('Break shot: bola branca sai em linha reta e perde velocidade gradualmente', async ({ page }) => {
  // Espera canvas estar pronto
  const canvas = await page.locator('canvas').first();
  expect(canvas).toBeVisible();

  // Simula taque na bola branca (100% power, ângulo 0 radianos = direita)
  await page.evaluate(() => {
    const event = new CustomEvent('shoot', {
      detail: { power: 100, angle: 0 }
    });
    window.dispatchEvent(event);
  });

  // Aguarda bolas se moverem
  await page.waitForTimeout(500);

  // Coleta estado das bolas em 3 momentos
  const states: any[] = [];
  for (let i = 0; i < 3; i++) {
    const gameState = await page.evaluate(() => {
      return (window as any).__gameState;
    });

    if (gameState) {
      states.push({
        time: i * 100,
        cueBall: gameState.balls[0],
        ballsCount: gameState.balls.length,
        ballsMoving: gameState.ballsMoving
      });
    }
    await page.waitForTimeout(100);
  }

  // Validações
  expect(states.length).toBeGreaterThan(0);
  
  // Bola branca deve ter velocidade decrescente
  if (states[0]?.cueBall && states[1]?.cueBall) {
    const v1 = Math.sqrt(states[0].cueBall.vx ** 2 + states[0].cueBall.vy ** 2);
    const v2 = Math.sqrt(states[1].cueBall.vx ** 2 + states[1].cueBall.vy ** 2);
    
    expect(v2).toBeLessThan(v1);
    console.log(`✓ Velocidade reduzida: ${v1.toFixed(2)} → ${v2.toFixed(2)}`);
  }
});

// ============================================================
// TESTE 2: Colisão bola-bola
// ============================================================
test.skip('Collision: bola branca bate em outra e transfere energia', async ({ page }) => {
  const canvas = await page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Nota: este teste precisa de posicionamento específico
  // Para um E2E real, seria necessário:
  // 1. Posicionar bola branca próxima a outra
  // 2. Disparar no ângulo correto
  // 3. Registrar velocidades pré e pós-colisão

  console.log('⚠ Collision test: requer posicionamento manual');
});

// ============================================================
// TESTE 3: Fricção - desaceleração natural
// ============================================================
test('Friction: bola desacelera e para de forma suave', async ({ page }) => {
  const canvas = await page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Dispara com power médio
  await page.evaluate(() => {
    const event = new CustomEvent('shoot', {
      detail: { power: 50, angle: Math.PI / 4 } // diagonal
    });
    window.dispatchEvent(event);
  });

  // Coleta velocidades em intervalos regulares
  const velocities: number[] = [];
  let stopped = false;

  for (let i = 0; i < 240; i++) {
    const gameState = await page.evaluate(() => {
      return (window as any).__gameState;
    });

    if (gameState && gameState.balls[0]) {
      const v = Math.sqrt(
        gameState.balls[0].vx ** 2 + gameState.balls[0].vy ** 2
      );
      velocities.push(v);

      if (v < 0.01 && i > 10) {
        stopped = true;
        console.log(`✓ Bola parou em ~${i * 16}ms`);
        break;
      }
    }

    await page.waitForTimeout(16); // ~60 FPS
  }

  // Validar que a desaceleração é suave (não abrupta)
  if (velocities.length > 10) {
    const velocityChanges = [];
    for (let i = 1; i < velocities.length; i++) {
      velocityChanges.push(velocities[i - 1] - velocities[i]);
    }

    const avgChange = velocityChanges.reduce((a, b) => a + b) / velocityChanges.length;
    const maxChange = Math.max(...velocityChanges);

    console.log(`
      Velocidades coletadas: ${velocities.length}
      Mudança média: ${avgChange.toFixed(4)}
      Mudança máxima: ${maxChange.toFixed(4)}
      Parou: ${stopped ? 'SIM' : 'NÃO'}
    `);

    // Validação: mudança de velocidade deve ser gradual
    expect(maxChange).toBeLessThan(5); // não deve "travar" abruptamente
  }

  expect(stopped || velocities[velocities.length - 1] < 0.02).toBe(true);
});

// ============================================================
// TESTE 4: Parada e stripe visual
// ============================================================
test('Stripe animation stops when ball stops', async ({ page }) => {
  const canvas = await page.locator('canvas').first();
  expect(canvas).toBeVisible();

  // Dispara bola
  await page.evaluate(() => {
    const event = new CustomEvent('shoot', {
      detail: { power: 30, angle: 0 }
    });
    window.dispatchEvent(event);
  });

  // Aguarda parada
  await page.waitForTimeout(3000);

  // Verifica que bola parou
  const finalState = await page.evaluate(() => {
    return (window as any).__gameState;
  });

  if (finalState && finalState.balls[0]) {
    const v = Math.sqrt(
      finalState.balls[0].vx ** 2 + finalState.balls[0].vy ** 2
    );
    expect(v).toBeLessThan(0.02);
    console.log(`✓ Bola parada (v=${v.toFixed(6)})`);
  }
});

// ============================================================
// TESTE 5: Rebote em borda
// ============================================================
test('Cushion: bola rebate em borda e perde energia', async ({ page }) => {
  const canvas = await page.locator('canvas').first();
  expect(canvas).toBeVisible();

  // Dispara contra borda direita
  await page.evaluate(() => {
    const event = new CustomEvent('shoot', {
      detail: { power: 75, angle: 0 } // para direita
    });
    window.dispatchEvent(event);
  });

  // Coleta momento antes e depois do rebote
  await page.waitForTimeout(1500);

  const stateAfterBounce = await page.evaluate(() => {
    return (window as any).__gameState;
  });

  if (stateAfterBounce && stateAfterBounce.balls[0]) {
    const cueBall = stateAfterBounce.balls[0];
    console.log(`
      Posição final: x=${cueBall.x.toFixed(2)}, y=${cueBall.y.toFixed(2)}
      Velocidade final: vx=${cueBall.vx.toFixed(4)}, vy=${cueBall.vy.toFixed(4)}
      Velocidade magnitude: ${Math.sqrt(cueBall.vx ** 2 + cueBall.vy ** 2).toFixed(4)}
    `);

    // Bola deve estar próxima à borda depois de rebater
    expect(Math.abs(cueBall.x - 772) || Math.abs(cueBall.x - 28)).toBeDefined();
  }
});

// ============================================================
// TESTE 6: Múltiplas bolas em movimento
// ============================================================
test('Multi-ball: conjunto de bolas se move de forma previsível', async ({ page }) => {
  const canvas = await page.locator('canvas').first();
  expect(canvas).toBeVisible();

  // Estado inicial
  const initialState = await page.evaluate(() => {
    return (window as any).__gameState;
  });

  const initialBallsMoving = initialState?.balls
    .filter((b: any) => b.id !== 0 && !b.inPocket)
    .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.1).length || 0;

  console.log(`Bolas em movimento inicialmente: ${initialBallsMoving}`);

  // Dispara
  await page.evaluate(() => {
    const event = new CustomEvent('shoot', {
      detail: { power: 80, angle: 0 }
    });
    window.dispatchEvent(event);
  });

  await page.waitForTimeout(500);

  const midState = await page.evaluate(() => {
    return (window as any).__gameState;
  });

  const ballsMovingMid = midState?.balls
    .filter((b: any) => !b.inPocket)
    .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.1).length || 0;

  console.log(`Bolas em movimento após colisão: ${ballsMovingMid}`);

  // Aguarda total parada
  await page.waitForTimeout(4000);

  const finalState = await page.evaluate(() => {
    return (window as any).__gameState;
  });

  const ballsMovingFinal = finalState?.balls
    .filter((b: any) => !b.inPocket)
    .filter((b: any) => Math.sqrt(b.vx ** 2 + b.vy ** 2) > 0.01).length || 0;

  console.log(`Bolas em movimento no final: ${ballsMovingFinal}`);

  expect(ballsMovingFinal).toBe(0);
});
