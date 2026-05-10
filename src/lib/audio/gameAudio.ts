'use client';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlockInProgress = false;
let audioUnlocked = false;
const MASTER_VOLUME = 0.7;
const SOUND_COOLDOWNS = {
  ball: 35,
  wall: 80,
  pocket: 120,
} as const;
const lastPlayedAt: Record<keyof typeof SOUND_COOLDOWNS, number> = {
  ball: 0,
  wall: 0,
  pocket: 0,
};

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = MASTER_VOLUME;
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function getPlayableCtx(): AudioContext | null {
  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    void unlockAudio();
    return null;
  }
  return ctx;
}

function outputNode(): AudioNode | null {
  return masterGain ?? getCtx()?.destination ?? null;
}

function canPlay(sound: keyof typeof SOUND_COOLDOWNS): boolean {
  const timestamp = performance.now();
  if (timestamp - lastPlayedAt[sound] < SOUND_COOLDOWNS[sound]) return false;
  lastPlayedAt[sound] = timestamp;
  return true;
}

export async function unlockAudio(): Promise<void> {
  const ctx = getCtx();
  if (!ctx || unlockInProgress || audioUnlocked) return;

  unlockInProgress = true;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const destination = outputNode();
    if (destination) {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(destination);
      source.start(ctx.currentTime);
    }

    audioUnlocked = ctx.state === 'running';
  } catch {
    audioUnlocked = false;
  } finally {
    unlockInProgress = false;
  }
}

function installUnlockListeners() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    void unlockAudio().then(() => {
      if (!audioUnlocked) return;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    });
  };

  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });
  document.addEventListener('click', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
}

installUnlockListeners();

function now(ctx: AudioContext) {
  return ctx.currentTime;
}

// Create a short noise buffer for impact sounds
function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playNoiseBurst(ctx: AudioContext, duration: number, filterFreq: number, volume: number) {
  const destination = outputNode();
  if (!destination) return;
  const buffer = createNoiseBuffer(ctx, duration);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  const t = now(ctx);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(t);
  source.stop(t + duration);
}

export function playCueHit(power: number = 50) {
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const intensity = power / 100;

  // 1. Wood impact — filtered noise burst (the "thwack" of cue hitting ball)
  playNoiseBurst(ctx, 0.08 + intensity * 0.05, 800 + intensity * 400, 0.25 + intensity * 0.15);

  // 2. Resonant body — low sine decay (the "thud" of the cue stick)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180 + intensity * 120, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.15);

  // 3. Sharp click — high-frequency tick (the tip striking the ball)
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'triangle';
  clickOsc.frequency.setValueAtTime(2000 + intensity * 1000, t);
  clickOsc.frequency.exponentialRampToValueAtTime(500, t + 0.02);
  clickGain.gain.setValueAtTime(0.15, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  clickOsc.connect(clickGain);
  clickGain.connect(destination);
  clickOsc.start(t);
  clickOsc.stop(t + 0.03);
}

export function playBallHit(intensity: number = 0.5) {
  if (!canPlay('ball')) return;
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const vol = Math.min(intensity * 0.4, 0.35);

  // 1. Crystal "clack" — two high sines for the hard ball-on-ball contact
  const freqs = [900, 1350];
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    gain.gain.setValueAtTime(vol * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04 + intensity * 0.03);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t);
    osc.stop(t + 0.08);
  });

  // 2. Short noise burst for the "tick" texture
  playNoiseBurst(ctx, 0.03 + intensity * 0.02, 3000, vol * 0.4);
}

export function playWallHit() {
  if (!canPlay('wall')) return;
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);

  // Rubber cushion bounce — mid-frequency damped thud
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(350, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.06);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.08);

  playNoiseBurst(ctx, 0.04, 1200, 0.08);
}

export function playPocket() {
  if (!canPlay('pocket')) return;
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);

  // 1. Ball dropping into padded pocket — filtered noise
  playNoiseBurst(ctx, 0.25, 400, 0.2);

  // 2. Rolling in the pocket rail — low rumble
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(250, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.4);

  // 3. Metal pocket ring resonance
  const ringOsc = ctx.createOscillator();
  const ringGain = ctx.createGain();
  ringOsc.type = 'sine';
  ringOsc.frequency.setValueAtTime(600, t + 0.05);
  ringOsc.frequency.exponentialRampToValueAtTime(300, t + 0.2);
  ringGain.gain.setValueAtTime(0, t);
  ringGain.gain.linearRampToValueAtTime(0.08, t + 0.06);
  ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  ringOsc.connect(ringGain);
  ringGain.connect(destination);
  ringOsc.start(t);
  ringOsc.stop(t + 0.25);
}

export function playNearMiss() {
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.linearRampToValueAtTime(400, t + 0.08);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function playWin() {
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0, t + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.3, t + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.5);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.5);
  });
}

export function playTurnChange() {
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function playTick() {
  const ctx = getPlayableCtx();
  if (!ctx) return;
  const destination = outputNode();
  if (!destination) return;
  const t = now(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + 0.03);
}
