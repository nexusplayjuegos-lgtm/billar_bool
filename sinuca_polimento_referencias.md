# 🎱 FASE DE POLIMENTO — Referências Técnicas & Melhores Práticas

> Baseado em análise de 8 Ball Pool, Kings of Pool, e jogos de sinuca de sucesso internacional.

---

## 1. FÍSICA DA BOLA — Rolamento Realista

### O que os jogos de sucesso fazem:

| Jogo | Técnica de Rolamento | Resultado |
|------|---------------------|-----------|
| **8 Ball Pool** | Physics engine com friction decay + angular velocity | Bola desacelera naturalmente, parece "rolar" |
| **Kings of Pool** | Real-time ray-traced reflections + physics simulation | Bola reflete luz enquanto rola, sensação de movimento real |
| **Pool: 8-Ball Mania** | Advanced physics with spin effects | Movimento natural, bank shots e soft rolls autênticos |

### Problema no nosso jogo:
- A bola "desliza" em vez de "rolar"
- Sem sensação de peso ou momentum
- Movimento linear, sem desaceleração natural

### Soluções Técnicas:

#### A. Angular Velocity (Rotação Visual)
```typescript
// Adicionar rotação visual à bola enquanto se move
const ballRotation = (velocity: number) => {
  // Quanto mais rápida, mais rápido gira
  return velocity * ROTATION_SPEED_FACTOR;
};

// No render do canvas:
ctx.save();
ctx.translate(ball.x, ball.y);
ctx.rotate(ball.rotationAngle); // ângulo acumulado
// Desenhar bola com número rotacionado
ctx.restore();
```

#### B. Decay de Velocidade (Atrito Realista)
```typescript
// Fórmula de atrito do 8 Ball Pool:
const applyFriction = (velocity: Vector2) => {
  const friction = 0.985; // 1.5% de perda por frame
  const minVelocity = 0.1; // threshold para parar

  velocity.x *= friction;
  velocity.y *= friction;

  // Parar completamente quando muito lenta
  if (Math.abs(velocity.x) < minVelocity) velocity.x = 0;
  if (Math.abs(velocity.y) < minVelocity) velocity.y = 0;
};
```

#### C. Efeito de "Wobble" (Descentralização)
```typescript
// Quando a bola bate na tabela, adicionar leve wobble:
const addWobble = (ball: Ball, impactForce: number) => {
  ball.wobble = Math.min(impactForce * 0.1, 2); // amplitude máxima 2px
  ball.wobblePhase = 0;
};

// No render:
const wobbleX = Math.sin(ball.wobblePhase) * ball.wobble;
const wobbleY = Math.cos(ball.wobblePhase * 1.3) * ball.wobble;
ball.wobblePhase += 0.2;
ball.wobble *= 0.95; // decay do wobble
```

---

## 2. ÁUDIO — Design Sonoro Premium

### Melhores Práticas (baseado em GameAnalytics):

> "Keep It Sweet and Short — 90% dos sons devem ter menos de 0.3 segundos. Usar reverb para suavizar cortes."

> "Exportar todos os sons 9-12 dB mais baixos. Quando empilham no jogo, o mix fica balanceado."

### Sons Necessários:

| Evento | Som | Características |
|--------|-----|----------------|
| **Bola caindo na caçapa** | `pocket.mp3` | Curto (<0.3s), reverb de caverna, som de "clack" metálico |
| **Taco batendo na bola** | `cue_hit.mp3` | Impacto seco, curto, com leve ressonância de madeira |
| **Bola batendo em bola** | `ball_collision.mp3` | Som de cerâmica/porcelana, curto |
| **Bola batendo na tabela** | `rail_hit.mp3` | Som amortecido de borracha/madeira |
| **Break shot** | `break.mp3` | Impacto múltiplo, mais longo (0.5s), caos controlado |
| **Vitória** | `win.mp3` | Fanfarra curta, celebração |
| **Derrota** | `lose.mp3` | Som baixo, desapontamento |
| **Moedas** | `coins.mp3` | Som de cascata, curto |
| **Missão completa** | `achievement.mp3` | Som de triunfo, curto |
| **UI Click** | `click.mp3` | Som de interface, muito curto |

### Implementação:

```typescript
// Audio Manager
class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume = 0.7; // master volume

  preload() {
    const sounds = [
      'pocket', 'cue_hit', 'ball_collision', 'rail_hit',
      'break', 'win', 'lose', 'coins', 'achievement', 'click'
    ];

    sounds.forEach(name => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.volume = this.volume;
      this.sounds.set(name, audio);
    });
  }

  play(name: string) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // ignore autoplay errors
    }
  }
}
```

---

## 3. ANIMAÇÕES — Efeitos Visuais Premium

### Efeitos Necessários:

| Evento | Animação | Referência |
|--------|----------|------------|
| **Início da partida** | Zoom-in na mesa, fade-in das bolas, texto "BREAK!" | 8 Ball Pool |
| **Bola caindo na caçapa** | Partículas de poeira, flash de luz, "+1" flutuante | Kings of Pool |
| **Vitória** | Confetti, tela dourada, troféu rotacionando | Clash Royale |
| **Derrota** | Tela escurece, som baixo, texto "DERROTA" | 8 Ball Pool |
| **Break shot** | Câmera treme levemente, flash branco | Call of Duty |
| **Missão completa** | Badge aparece com bounce, partículas douradas | Clash Royale |
| **Pool Pass rank up** | Barra enche com brilho, novo rank explode | 8 Ball Pool |
| **Coletar recompensa** | Moedas voando para o header, +XP subindo | Clash Royale |

### Implementação — Partículas de Caçapa:

```typescript
// Particle system para quando bola cai na caçapa
class PocketParticles {
  particles: Array<{
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    color: string;
    size: number;
  }> = [];

  emit(x: number, y: number, color: string = '#FFD700') {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 1, maxLife: 1,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= 0.02;
      return p.life > 0;
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
```

### Implementação — Animação de Início:

```typescript
// Match start animation
const MatchStartAnimation = () => {
  const [phase, setPhase] = useState<'zoom' | 'deal' | 'break' | 'done'>('zoom');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('deal'), 500);
    const timer2 = setTimeout(() => setPhase('break'), 1500);
    const timer3 = setTimeout(() => setPhase('done'), 2500);
    return () => [timer1, timer2, timer3].forEach(clearTimeout);
  }, []);

  return (
    <div className={`match-start-overlay ${phase}`}>
      {phase === 'zoom' && <div className="zoom-effect" />}
      {phase === 'deal' && <div className="balls-dealing" />}
      {phase === 'break' && (
        <div className="break-text">
          <span className="break-label">BREAK!</span>
          <div className="break-flash" />
        </div>
      )}
    </div>
  );
};
```

---

## 4. TEXTURAS — Bolas Nítidas e Brilhantes

### Problema Atual:
- Bolas pixeladas/desfocadas
- Sem reflexo ou brilho
- Parecem "adesivos" em vez de esferas 3D

### Solução — Canvas Rendering Premium:

```typescript
// Renderizar bola com gradiente 3D e brilho
const renderBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
  const { x, y, radius, color, number } = ball;

  // Sombra projetada
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  // Corpo da bola — gradiente radial para efeito 3D
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.1,
    x, y, radius
  );
  gradient.addColorStop(0, lightenColor(color, 40)); // highlight
  gradient.addColorStop(0.3, color); // cor base
  gradient.addColorStop(1, darkenColor(color, 30)); // sombra

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Brilho especular (reflexo de luz)
  const shine = ctx.createRadialGradient(
    x - radius * 0.35, y - radius * 0.35, 0,
    x - radius * 0.35, y - radius * 0.35, radius * 0.5
  );
  shine.addColorStop(0, 'rgba(255,255,255,0.8)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  // Número da bola
  if (number > 0) {
    ctx.fillStyle = number <= 8 ? '#000' : '#FFF';
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), x, y);
  }

  // Reset shadow
  ctx.shadowColor = 'transparent';
};

// Helpers
const lightenColor = (hex: string, percent: number) => {
  // Implementação de lighten
};

const darkenColor = (hex: string, percent: number) => {
  // Implementação de darken
};
```

---

## 5. CHECKLIST DE POLIMENTO

### Física:
- [ ] Bola roda (angular velocity visual)
- [ ] Decay de velocidade natural (friction)
- [ ] Wobble ao bater na tabela
- [ ] Spin visual (bola gira conforme backspin/topspin)

### Áudio:
- [ ] Som de taco batendo na bola
- [ ] Som de bola caindo na caçapa (com reverb)
- [ ] Som de colisão bola-bola
- [ ] Som de colisão bola-tabela
- [ ] Som de break shot
- [ ] Som de vitória/derrota
- [ ] Som de moedas/recompensa
- [ ] Som de UI (click)

### Animações:
- [ ] Animação de início de partida (zoom + "BREAK!")
- [ ] Partículas ao cair na caçapa
- [ ] Confetti na vitória
- [ ] Flash no break shot
- [ ] Moedas voando ao coletar recompensa
- [ ] Badge bounce ao completar missão
- [ ] Transições de tela suaves

### Visuais:
- [ ] Bolas com gradiente 3D + brilho
- [ ] Sombra projetada das bolas
- [ ] Mesa com textura de feltro
- [ ] Caçapas com profundidade visual
- [ ] Taco com textura de madeira

### UX:
- [ ] Tutorial interativo para novos jogadores
- [ ] Feedback visual em todos os botões
- [ ] Loading states animados
- [ ] Toast notifications estilizados

---

## 6. RECURSOS RECOMENDADOS

### Sons (gratuitos):
- **Freesound.org** — `pool ball pocket`, `cue stick hit`
- **OpenGameArt.org** — pacotes de sons de bilhar
- **Mixkit.co** — sons de UI e celebração

### Referências Visuais:
- **8 Ball Pool (Miniclip)** — UI/UX padrão ouro
- **Kings of Pool (Uken)** — física e reflexos
- **Pool: 8-Ball Mania** — animações e efeitos

---

*Documento gerado para FASE DE POLIMENTO do Projeto Sinuca Global*
*Data: 2026-05-16*
