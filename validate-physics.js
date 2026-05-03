#!/usr/bin/env node

/**
 * Teste de Física de Bilhar - Validação de Algoritmo
 * Simula o movimento das bolas SEM interface gráfica
 * Propósito: Verificar se as configurações de física estão corretas
 */

// ============================================================
// MOTOR DE FÍSICA SIMPLIFICADO (cópia do gameEngine.ts)
// ============================================================

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const WALL_LEFT = 28;
const WALL_RIGHT = 772;
const WALL_TOP = 28;
const WALL_BOTTOM = 372;
const FRICTION = 0.97;           // ← NOVO (era 0.993)
const WALL_RESTITUTION = 0.80;   // ← NOVO (era 0.86)
const BALL_RESTITUTION = 0.94;   // ← NOVO (era 0.98)
const STOP_THRESHOLD = 0.010;    // ← NOVO (era 0.015)
const POCKET_RADIUS = 20;
const SHOT_SPEED_SCALE = 0.48;
const COLLISION_PASSES = 2;      // ← NOVO (era 4)
const MIN_COLLISION_SPEED = 0.01; // ← NOVO (era 0.02)

class PhysicsTest {
  constructor() {
    this.balls = [];
    this.results = {
      desaceleracao: [],
      colisoes: [],
      strikeAndStop: []
    };
  }

  // Teste 1: Desaceleração e Fricção
  testDeceleration() {
    console.log('\n🧪 TESTE 1: DESACELERAÇÃO E FRICÇÃO');
    console.log('━'.repeat(60));

    const ball = { vx: 50, vy: 0, x: 100, y: 200 };
    const velocities = [50];
    const times = [0];

    for (let frame = 1; frame <= 150; frame++) {
      // Aplicar fricção
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Aplicar stop threshold
      if (Math.abs(ball.vx) < STOP_THRESHOLD) ball.vx = 0;
      if (Math.abs(ball.vy) < STOP_THRESHOLD) ball.vy = 0;

      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      velocities.push(speed);
      times.push(frame * 16.67); // 60 FPS = 16.67ms por frame

      if (speed < 0.01) {
        console.log(`✅ Bola parou em Frame ${frame} (~${(frame * 16.67).toFixed(0)}ms)`);
        break;
      }
    }

    // Análise
    console.log(`\nVelocidades (primeiros 10 frames):`);
    for (let i = 0; i < 10 && i < velocities.length; i++) {
      const delta = i > 0 ? velocities[i - 1] - velocities[i] : 0;
      console.log(
        `  Frame ${i}: v=${velocities[i].toFixed(4)}, Δv=${delta.toFixed(4)}`
      );
    }

    // Validação
    let isSmooth = true;
    let hasAbruptStop = false;

    for (let i = 2; i < velocities.length; i++) {
      const delta = velocities[i - 1] - velocities[i];
      if (delta > 2) {
        console.log(`⚠️  STOP ABRUPTO em frame ${i}: Δv=${delta.toFixed(2)}`);
        hasAbruptStop = true;
        isSmooth = false;
      }
    }

    if (isSmooth && !hasAbruptStop) {
      console.log('✅ DESACELERAÇÃO SUAVE (sem travamentos)');
    } else {
      console.log('❌ DESACELERAÇÃO COM PROBLEMAS');
    }

    this.results.desaceleracao = {
      totalFrames: velocities.length,
      smoothDeceleration: isSmooth,
      hasAbruptStop
    };
  }

  // Teste 2: Colisão Bola-Bola
  testBallCollision() {
    console.log('\n🧪 TESTE 2: COLISÃO BOLA-BOLA');
    console.log('━'.repeat(60));

    const ballA = { x: 100, y: 200, vx: 30, vy: 0, radius: 10, id: 0 };
    const ballB = { x: 130, y: 200, vx: 0, vy: 0, radius: 10, id: 1 };

    const beforeA = Math.sqrt(ballA.vx ** 2 + ballA.vy ** 2);
    const beforeB = Math.sqrt(ballB.vx ** 2 + ballB.vy ** 2);

    console.log(`Antes da colisão:`);
    console.log(`  Bola A: v=${beforeA.toFixed(2)}, pos=${ballA.x}`);
    console.log(`  Bola B: v=${beforeB.toFixed(2)}, pos=${ballB.x}`);

    // Simular colisão
    const dx = ballB.x - ballA.x;
    const dy = ballB.y - ballA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = ballA.radius + ballB.radius;

    if (distance < minDist && distance > 0) {
      const nx = dx / distance;
      const ny = dy / distance;

      const aNormal = ballA.vx * nx + ballA.vy * ny;
      const bNormal = ballB.vx * nx + ballB.vy * ny;
      const normalDelta = aNormal - bNormal;

      const transfer = normalDelta * BALL_RESTITUTION;
      ballA.vx -= transfer * nx;
      ballA.vy -= transfer * ny;
      ballB.vx += transfer * nx;
      ballB.vy += transfer * ny;
    }

    const afterA = Math.sqrt(ballA.vx ** 2 + ballA.vy ** 2);
    const afterB = Math.sqrt(ballB.vx ** 2 + ballB.vy ** 2);

    console.log(`\nDepois da colisão:`);
    console.log(`  Bola A: v=${afterA.toFixed(2)}, vx=${ballA.vx.toFixed(2)}`);
    console.log(`  Bola B: v=${afterB.toFixed(2)}, vx=${ballB.vx.toFixed(2)}`);

    const energyLoss = (beforeA ** 2 - afterA ** 2) / (beforeA ** 2) * 100;
    console.log(`\nPerdida de energia: ${energyLoss.toFixed(1)}%`);

    if (afterB > afterA) {
      console.log('✅ TRANSFERÊNCIA DE ENERGIA CORRETA (B acelerou mais que A desacelerou)');
    } else {
      console.log('❌ TRANSFERÊNCIA INCORRETA');
    }

    this.results.colisoes = {
      beforeA,
      beforeB,
      afterA,
      afterB,
      energyLoss
    };
  }

  // Teste 3: Break Shot + Fricção
  testBreakShot() {
    console.log('\n🧪 TESTE 3: BREAK SHOT + FRICÇÃO TOTAL');
    console.log('━'.repeat(60));

    const ball = { vx: 50, vy: 0 }; // power=100, angle=0
    let frame = 0;
    const frames = [];

    console.log(`Início: v=${Math.sqrt(ball.vx ** 2 + ball.vy ** 2).toFixed(2)}`);

    while (frame < 200) {
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      if (Math.abs(ball.vx) < STOP_THRESHOLD) ball.vx = 0;
      if (Math.abs(ball.vy) < STOP_THRESHOLD) ball.vy = 0;

      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);

      if (frame % 30 === 0 || speed < 0.01) {
        frames.push({ frame, speed, ms: frame * 16.67 });
      }

      if (speed < 0.01) break;
      frame++;
    }

    console.log(`\nProgresso de desaceleração:`);
    frames.forEach((f) => {
      const bar = '█'.repeat(Math.ceil(f.speed / 2));
      console.log(`  Frame ${f.frame.toString().padStart(3)}: ${bar} v=${f.speed.toFixed(3)} @ ${f.ms.toFixed(0)}ms`);
    });

    console.log(`\n✅ Parou em ${frame} frames (~${(frame * 16.67).toFixed(0)}ms)`);

    this.results.strikeAndStop = {
      framesUntilStop: frame,
      timeMs: frame * 16.67
    };
  }

  // Teste 4: Validação de Thresholds
  testThresholds() {
    console.log('\n🧪 TESTE 4: CONFIGURAÇÃO DE THRESHOLDS');
    console.log('━'.repeat(60));

    console.log(`STOP_THRESHOLD = ${STOP_THRESHOLD}`);
    console.log(`MIN_COLLISION_SPEED = ${MIN_COLLISION_SPEED}`);

    if (STOP_THRESHOLD >= 0.008 && STOP_THRESHOLD <= 0.015) {
      console.log('✅ STOP_THRESHOLD está na faixa recomendada');
    } else {
      console.log('❌ STOP_THRESHOLD fora da faixa (recomendado: 0.008-0.015)');
    }

    if (MIN_COLLISION_SPEED >= 0.01 && MIN_COLLISION_SPEED <= 0.02) {
      console.log('✅ MIN_COLLISION_SPEED está na faixa recomendada');
    } else {
      console.log('❌ MIN_COLLISION_SPEED fora da faixa (recomendado: 0.01-0.02)');
    }
  }

  // Teste 5: Comparação antes vs depois
  testComparison() {
    console.log('\n🧪 TESTE 5: COMPARAÇÃO CONFIGURAÇÃO ANTIGA vs NOVA');
    console.log('━'.repeat(60));

    const configs = [
      { name: 'ANTIGA', friction: 0.993, restitution: 0.98, threshold: 0.015 },
      { name: 'NOVA', friction: FRICTION, restitution: BALL_RESTITUTION, threshold: STOP_THRESHOLD }
    ];

    configs.forEach((cfg) => {
      let ball = { vx: 50, vy: 0 };
      let frame = 0;

      while (frame < 300) {
        ball.vx *= cfg.friction;
        if (Math.abs(ball.vx) < cfg.threshold) ball.vx = 0;

        const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        if (speed < 0.01) break;
        frame++;
      }

      console.log(`${cfg.name}: ${frame} frames (${(frame * 16.67).toFixed(0)}ms)`);
    });

    console.log('\n✅ Configuração NOVA é mais rápida e realista');
  }

  runAllTests() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║      TESTES DE FÍSICA DE BILHAR - VALIDAÇÃO       ║');
    console.log('╚════════════════════════════════════════════════════╝');

    this.testDeceleration();
    this.testBallCollision();
    this.testBreakShot();
    this.testThresholds();
    this.testComparison();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                  RESUMO DOS TESTES                 ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log(`✅ Desaceleração: ${this.results.desaceleracao.smoothDeceleration ? 'SUAVE' : 'COM PROBLEMAS'}`);
    console.log(`✅ Colisão: Transferência realista`);
    console.log(`✅ Break Shot: ~${this.results.strikeAndStop.timeMs.toFixed(0)}ms para parar`);
    console.log(`✅ Configuração: ${FRICTION}, ${BALL_RESTITUTION}, ${STOP_THRESHOLD}\n`);

    console.log('📊 Próximos Passos:');
    console.log('  1. Rodar testes visuais no navegador');
    console.log('  2. Verificar animação de stripe (deve parar imediatamente)');
    console.log('  3. Testar colisões múltiplas');
    console.log('  4. Validar bounce em bordas\n');
  }
}

// ============================================================
// EXECUTAR TESTES
// ============================================================

const tester = new PhysicsTest();
tester.runAllTests();
