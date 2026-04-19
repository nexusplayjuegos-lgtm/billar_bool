// Funções Canvas 2D para desenhar tacos profissionais
// Inspirados em marcas reais: Predator, Mezz, Lucasi, McDermott

import { CueDesign } from './cueDesigns';

/**
 * Desenha um taco profissional em um canvas
 * @param ctx - CanvasRenderingContext2D
 * @param design - Dados do design do taco
 * @param width - Largura do canvas
 * @param height - Altura do canvas
 */
export function drawCueOnCanvas(
  ctx: CanvasRenderingContext2D,
  design: CueDesign,
  width: number,
  height: number
): void {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const w = width / dpr;
  const h = height / dpr;
  const cueY = h / 2;
  const cueLength = w * 0.92;
  const cueStartX = w * 0.04;
  const cueEndX = cueStartX + cueLength;

  // Alturas do taco (taper do shaft)
  const shaftStartHeight = h * 0.06;   // grosso (próximo ao joint)
  const shaftEndHeight = h * 0.025;    // fino (próximo à ponta)
  const buttHeight = h * 0.10;         // cabo grosso
  const wrapHeight = h * 0.085;        // grip

  // Posições relativas
  const buttStart = cueEndX - cueLength * 0.35;  // butt = 35% direita
  const wrapStart = buttStart - cueLength * 0.10; // wrap = 10%
  const jointX = wrapStart - cueLength * 0.05;    // joint rings
  const shaftEnd = cueStartX + cueLength * 0.08;  // tip area

  // === SOMBRA ===
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // === BUTT (cabo direito, 35%) ===
  const buttGrad = ctx.createLinearGradient(buttStart, cueY - buttHeight, buttStart, cueY + buttHeight);
  buttGrad.addColorStop(0, darken(design.butt.color, 20));
  buttGrad.addColorStop(0.5, design.butt.color);
  buttGrad.addColorStop(1, darken(design.butt.color, 30));

  ctx.fillStyle = buttGrad;
  ctx.beginPath();
  ctx.moveTo(buttStart, cueY - buttHeight / 2);
  ctx.lineTo(cueEndX - 2, cueY - buttHeight / 2 + 2);
  ctx.quadraticCurveTo(cueEndX, cueY, cueEndX - 2, cueY + buttHeight / 2 - 2);
  ctx.lineTo(buttStart, cueY + buttHeight / 2);
  ctx.closePath();
  ctx.fill();

  // Padrões do butt
  drawButtPattern(ctx, design.butt.pattern, buttStart, cueEndX, cueY, buttHeight);

  ctx.restore(); // fim sombra

  // === JOINT RINGS (anéis de união) ===
  const ringWidth = 3;
  const ringSpacing = 4;
  let ringX = jointX;
  for (const ringColor of design.jointRings) {
    ctx.fillStyle = ringColor;
    ctx.fillRect(ringX, cueY - shaftStartHeight / 2 - 2, ringWidth, shaftStartHeight + 4);
    ringX += ringWidth + ringSpacing;
  }

  // === WRAP/GRIP ===
  const wrapGrad = ctx.createLinearGradient(wrapStart, cueY - wrapHeight / 2, wrapStart, cueY + wrapHeight / 2);
  wrapGrad.addColorStop(0, darken(design.wrap.color, 10));
  wrapGrad.addColorStop(0.5, design.wrap.color);
  wrapGrad.addColorStop(1, darken(design.wrap.color, 20));

  ctx.fillStyle = wrapGrad;
  ctx.beginPath();
  ctx.moveTo(wrapStart, cueY - wrapHeight / 2);
  ctx.lineTo(jointX - 2, cueY - shaftStartHeight / 2 - 1);
  ctx.lineTo(jointX - 2, cueY + shaftStartHeight / 2 + 1);
  ctx.lineTo(wrapStart, cueY + wrapHeight / 2);
  ctx.closePath();
  ctx.fill();

  // Textura do wrap
  drawWrapTexture(ctx, design.wrap.style, wrapStart, jointX - 2, cueY, wrapHeight);

  // === SHAFT (haste, 65% esquerda) ===
  const shaftGrad = ctx.createLinearGradient(shaftEnd, cueY - shaftEndHeight, jointX, cueY + shaftStartHeight);
  shaftGrad.addColorStop(0, design.shaft.color);
  shaftGrad.addColorStop(1, design.shaft.gradient);

  ctx.fillStyle = shaftGrad;
  ctx.beginPath();
  ctx.moveTo(shaftEnd, cueY - shaftEndHeight / 2);
  ctx.lineTo(jointX, cueY - shaftStartHeight / 2);
  ctx.lineTo(jointX, cueY + shaftStartHeight / 2);
  ctx.lineTo(shaftEnd, cueY + shaftEndHeight / 2);
  ctx.closePath();
  ctx.fill();

  // Brilho do shaft
  const shineGrad = ctx.createLinearGradient(shaftEnd, cueY - shaftEndHeight / 2, shaftEnd + cueLength * 0.3, cueY);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
  shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  ctx.moveTo(shaftEnd, cueY - shaftEndHeight / 2);
  ctx.lineTo(jointX - cueLength * 0.1, cueY - shaftStartHeight / 2);
  ctx.lineTo(jointX - cueLength * 0.1, cueY);
  ctx.lineTo(shaftEnd, cueY);
  ctx.closePath();
  ctx.fill();

  // === TIP (ponta) ===
  if (design.glowColor) {
    ctx.save();
    ctx.shadowColor = design.glowColor;
    ctx.shadowBlur = 12;
  }

  ctx.fillStyle = design.tip;
  ctx.beginPath();
  ctx.moveTo(shaftEnd, cueY - shaftEndHeight / 2);
  ctx.lineTo(cueStartX + 2, cueY - shaftEndHeight / 2 + 1);
  ctx.quadraticCurveTo(cueStartX, cueY, cueStartX + 2, cueY + shaftEndHeight / 2 - 1);
  ctx.lineTo(shaftEnd, cueY + shaftEndHeight / 2);
  ctx.closePath();
  ctx.fill();

  if (design.glowColor) {
    ctx.restore();
  }

  // === HIGHLIGHT GERAL ===
  const highlightGrad = ctx.createLinearGradient(cueStartX, cueY - h * 0.15, cueStartX, cueY);
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlightGrad;
  ctx.beginPath();
  ctx.moveTo(cueStartX + 4, cueY - shaftEndHeight / 2);
  ctx.lineTo(cueEndX - 4, cueY - buttHeight / 2);
  ctx.lineTo(cueEndX - 4, cueY - buttHeight / 4);
  ctx.lineTo(cueStartX + 4, cueY - shaftEndHeight / 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// === FUNÇÕES AUXILIARES ===

function darken(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function drawButtPattern(
  ctx: CanvasRenderingContext2D,
  pattern: string,
  x1: number,
  x2: number,
  cy: number,
  h: number
): void {
  const w = x2 - x1;
  ctx.save();
  ctx.globalAlpha = 0.4;

  switch (pattern) {
    case 'marble': {
      // Mármore verde = círculos irregulares
      ctx.fillStyle = 'rgba(0,100,0,0.3)';
      for (let i = 0; i < 8; i++) {
        const mx = x1 + Math.random() * w;
        const my = cy - h / 4 + Math.random() * h / 2;
        const r = 3 + Math.random() * 5;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'rings-grey': {
      // Anéis cinzas
      ctx.strokeStyle = 'rgba(100,100,100,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const rx = x1 + w * 0.3 + i * w * 0.15;
        ctx.beginPath();
        ctx.moveTo(rx, cy - h / 3);
        ctx.lineTo(rx, cy + h / 3);
        ctx.stroke();
      }
      break;
    }
    case 'inlay-red-gold': {
      // Diamantes vermelho/dourado alternados
      for (let i = 0; i < 4; i++) {
        const dx = x1 + w * 0.2 + i * w * 0.18;
        const color = i % 2 === 0 ? '#FF4500' : '#FFD700';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(dx, cy - 4);
        ctx.lineTo(dx + 4, cy);
        ctx.lineTo(dx, cy + 4);
        ctx.lineTo(dx - 4, cy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'flame-orange': {
      // Chamas laranja
      ctx.fillStyle = 'rgba(255,69,0,0.4)';
      for (let i = 0; i < 3; i++) {
        const fx = x1 + w * 0.25 + i * w * 0.2;
        ctx.beginPath();
        ctx.moveTo(fx, cy + h / 4);
        ctx.quadraticCurveTo(fx + 5, cy, fx + 3, cy - h / 4);
        ctx.quadraticCurveTo(fx - 2, cy, fx, cy + h / 4);
        ctx.fill();
      }
      break;
    }
    case 'abalone': {
      // Madrepérola iridescente
      const abGrad = ctx.createLinearGradient(x1, cy - h / 2, x2, cy + h / 2);
      abGrad.addColorStop(0, 'rgba(0,255,200,0.2)');
      abGrad.addColorStop(0.5, 'rgba(255,0,150,0.2)');
      abGrad.addColorStop(1, 'rgba(0,150,255,0.2)');
      ctx.fillStyle = abGrad;
      ctx.fillRect(x1 + w * 0.1, cy - h / 3, w * 0.8, h * 0.6);
      break;
    }
    case 'crown-gold': {
      // Coroa dourada
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = 0.7;
      const cx = x1 + w / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 3);
      ctx.lineTo(cx - 5, cy - 6);
      ctx.lineTo(cx - 2, cy - 2);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 2, cy - 2);
      ctx.lineTo(cx + 5, cy - 6);
      ctx.lineTo(cx + 8, cy + 3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'diamond-sparkle': {
      // Brilhos diamante
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 5; i++) {
        const sx = x1 + w * 0.15 + i * w * 0.17;
        const sy = cy - h / 4 + (i % 2) * h / 2;
        drawStar(ctx, sx, sy, 4, 3, 1.5);
      }
      break;
    }
    default: // plain - sem padrão
      break;
  }

  ctx.restore();
}

function drawWrapTexture(
  ctx: CanvasRenderingContext2D,
  style: string,
  x1: number,
  x2: number,
  cy: number,
  h: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;

  switch (style) {
    case 'linen':
    case 'linen-white': {
      // Linhas diagonais 45°
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.5;
      for (let i = -5; i < 15; i++) {
        ctx.beginPath();
        ctx.moveTo(x1 + i * 4, cy - h / 2);
        ctx.lineTo(x1 + i * 4 + h, cy + h / 2);
        ctx.stroke();
      }
      break;
    }
    case 'leather-red':
    case 'leather-brown': {
      // Linhas horizontais
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      for (let i = -2; i < 4; i++) {
        const ly = cy + i * h * 0.12;
        ctx.beginPath();
        ctx.moveTo(x1, ly);
        ctx.lineTo(x2, ly);
        ctx.stroke();
      }
      break;
    }
    case 'stitched-blue': {
      // Padrão X
      ctx.strokeStyle = 'rgba(30,144,255,0.5)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) {
        const sx = x1 + i * (x2 - x1) / 5;
        ctx.beginPath();
        ctx.moveTo(sx, cy - h / 3);
        ctx.lineTo(sx + 4, cy + h / 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 4, cy - h / 3);
        ctx.lineTo(sx, cy + h / 3);
        ctx.stroke();
      }
      break;
    }
    case 'rings-orange': {
      // Anéis laranja
      ctx.strokeStyle = 'rgba(255,69,0,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const rx = x1 + (x2 - x1) * 0.2 + i * (x2 - x1) * 0.25;
        ctx.beginPath();
        ctx.moveTo(rx, cy - h / 2.5);
        ctx.lineTo(rx, cy + h / 2.5);
        ctx.stroke();
      }
      break;
    }
    case 'velvet-purple': {
      // Gradiente suave
      const vGrad = ctx.createLinearGradient(x1, cy - h / 2, x2, cy + h / 2);
      vGrad.addColorStop(0, 'rgba(75,0,130,0.2)');
      vGrad.addColorStop(1, 'rgba(138,43,226,0.2)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(x1, cy - h / 2, x2 - x1, h);
      break;
    }
    case 'chrome': {
      // Gradiente metálico
      const cGrad = ctx.createLinearGradient(x1, cy - h / 2, x2, cy + h / 2);
      cGrad.addColorStop(0, 'rgba(200,200,200,0.3)');
      cGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
      cGrad.addColorStop(1, 'rgba(150,150,150,0.3)');
      ctx.fillStyle = cGrad;
      ctx.fillRect(x1, cy - h / 2, x2 - x1, h);
      break;
    }
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
