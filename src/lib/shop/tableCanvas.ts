// Funções Canvas 2D para desenhar mesas de sinuca/bilhar profissionais

import { TableDesign } from './tableDesigns';

/**
 * Desenha uma mesa de sinuca profissional em um canvas
 * @param ctx - CanvasRenderingContext2D
 * @param design - Dados do design da mesa
 * @param width - Largura do canvas
 * @param height - Altura do canvas
 */
export function drawTableOnCanvas(
  ctx: CanvasRenderingContext2D,
  design: TableDesign,
  width: number,
  height: number
): void {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const w = width / dpr;
  const h = height / dpr;

  // Margens da mesa (borda de madeira)
  const borderW = w * 0.08;
  const borderH = h * 0.12;
  const feltX = borderW;
  const feltY = borderH;
  const feltW = w - borderW * 2;
  const feltH = h - borderH * 2;

  // === SOMBRA DA MESA ===
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  // === BORDA DE MADEIRA (frame) ===
  const woodGrad = ctx.createLinearGradient(0, 0, w, h);
  woodGrad.addColorStop(0, darken(design.woodColor, 15));
  woodGrad.addColorStop(0.5, design.woodColor);
  woodGrad.addColorStop(1, darken(design.woodColor, 25));

  ctx.fillStyle = woodGrad;
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.fill();

  // Detalhe de madeira (veios)
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const vy = h * 0.1 + i * h * 0.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, vy);
    ctx.quadraticCurveTo(w * 0.5, vy + Math.sin(i) * 8, w * 0.95, vy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // fim sombra

  // === FELTRO ===
  const feltGrad = ctx.createRadialGradient(
    feltX + feltW / 2, feltY + feltH / 2, 0,
    feltX + feltW / 2, feltY + feltH / 2, feltW * 0.6
  );
  feltGrad.addColorStop(0, lighten(design.feltColor, 8));
  feltGrad.addColorStop(0.6, design.feltColor);
  feltGrad.addColorStop(1, darken(design.feltColor, 15));

  ctx.fillStyle = feltGrad;
  roundRect(ctx, feltX, feltY, feltW, feltH, 6);
  ctx.fill();

  // Efeito de glow para mesas lendárias
  if (design.glowEffect) {
    ctx.save();
    ctx.shadowColor = design.lineColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = design.lineColor;
    ctx.lineWidth = 1;
    roundRect(ctx, feltX + 2, feltY + 2, feltW - 4, feltH - 4, 4);
    ctx.stroke();
    ctx.restore();
  }

  // === LINHA DE CABECEIRA (head string) ===
  ctx.strokeStyle = design.lineColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.4;
  const headStringX = feltX + feltW * 0.25;
  ctx.beginPath();
  ctx.moveTo(headStringX, feltY + 4);
  ctx.lineTo(headStringX, feltY + feltH - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // === MARCA CENTRAL (spot) ===
  ctx.fillStyle = design.lineColor;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(feltX + feltW * 0.75, feltY + feltH / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // === CUSHIONS (bordas de borracha) ===
  const cushionColor = design.cushionColor;
  ctx.fillStyle = cushionColor;

  // Top cushion
  roundRect(ctx, feltX + 4, feltY - 3, feltW - 8, 6, 2);
  ctx.fill();
  // Bottom cushion
  roundRect(ctx, feltX + 4, feltY + feltH - 3, feltW - 8, 6, 2);
  ctx.fill();
  // Left cushion
  roundRect(ctx, feltX - 3, feltY + 4, 6, feltH - 8, 2);
  ctx.fill();
  // Right cushion
  roundRect(ctx, feltX + feltW - 3, feltY + 4, 6, feltH - 8, 2);
  ctx.fill();

  // === CAÇAPAS (pockets) ===
  const pocketColors: Record<string, string> = {
    'leather-brown': '#3E2723',
    'leather-black': '#1a1a1a',
    'chrome': '#C0C0C0',
    'chrome-gold': '#FFD700',
    'gold': '#FFD700',
    'neon-purple': '#9B30FF',
  };
  const pocketColor = pocketColors[design.pocketStyle] || '#1a1a1a';
  const pocketRadius = Math.min(w, h) * 0.055;

  const pockets = [
    { x: feltX, y: feltY },                           // top-left
    { x: feltX + feltW / 2, y: feltY },               // top-center
    { x: feltX + feltW, y: feltY },                   // top-right
    { x: feltX, y: feltY + feltH },                   // bottom-left
    { x: feltX + feltW / 2, y: feltY + feltH },       // bottom-center
    { x: feltX + feltW, y: feltY + feltH },           // bottom-right
  ];

  for (const pocket of pockets) {
    // Sombra da caçapa
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(pocket.x + 1, pocket.y + 1, pocketRadius, 0, Math.PI * 2);
    ctx.fill();

    // Caçapa
    ctx.fillStyle = pocketColor;
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocketRadius - 1, 0, Math.PI * 2);
    ctx.fill();

    // Brilho da caçapa (estilo chrome/gold)
    if (design.pocketStyle.includes('chrome') || design.pocketStyle.includes('gold')) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocketRadius - 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Neon glow
    if (design.pocketStyle === 'neon-purple') {
      ctx.save();
      ctx.shadowColor = '#9B30FF';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#CE93D8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocketRadius - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // === DIAMANTES NAS BORDAS ===
  ctx.fillStyle = design.lineColor;
  ctx.globalAlpha = 0.5;
  const diamondYPositions = [feltY + feltH * 0.25, feltY + feltH * 0.5, feltY + feltH * 0.75];

  for (const dy of diamondYPositions) {
    // Esquerda
    drawDiamond(ctx, feltX + 3, dy, 3);
    // Direita
    drawDiamond(ctx, feltX + feltW - 3, dy, 3);
  }

  const diamondXPositions = [feltX + feltW * 0.25, feltX + feltW * 0.5, feltX + feltW * 0.75];
  for (const dx of diamondXPositions) {
    // Topo
    drawDiamond(ctx, dx, feltY + 3, 3);
    // Baixo
    drawDiamond(ctx, dx, feltY + feltH - 3, 3);
  }
  ctx.globalAlpha = 1;

  // === REFLEXO DO FELTRO ===
  const reflectGrad = ctx.createLinearGradient(feltX, feltY, feltX, feltY + feltH * 0.3);
  reflectGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
  reflectGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = reflectGrad;
  roundRect(ctx, feltX, feltY, feltW, feltH * 0.4, 4);
  ctx.fill();

  ctx.restore();
}

// === FUNÇÕES AUXILIARES ===

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function darken(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function lighten(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min((num >> 16) + amt, 255);
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
  const B = Math.min((num & 0x0000FF) + amt, 255);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
