'use client';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlockPromise: Promise<boolean> | null = null;
let audioUnlocked = false;
const MASTER_VOLUME = 0.7;
const USER_STORAGE_KEY = 'bool-user-storage';
const DEBUG_THROTTLE_MS = 1000;
const SOUND_COOLDOWNS = {
  ball: 35,
  wall: 80,
  pocket: 120,
} as const;
const lastDebugAt: Record<string, number> = {};
const lastPlayedAt: Record<keyof typeof SOUND_COOLDOWNS, number> = {
  ball: 0,
  wall: 0,
  pocket: 0,
};

type AudioContextConstructor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

interface PersistedUserStorage {
  state?: {
    profile?: {
      settings?: {
        sound?: unknown;
      };
    };
  };
}

function debugAudio(message: string, details?: Record<string, unknown>, throttleKey?: string) {
  if (process.env.NODE_ENV === 'production') return;
  const key = throttleKey ?? message;
  const timestamp = performance.now();
  if (timestamp - (lastDebugAt[key] ?? 0) < DEBUG_THROTTLE_MS) return;
  lastDebugAt[key] = timestamp;
  console.debug('[gameAudio]', message, details ?? {});
}

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as PersistedUserStorage;
    const sound = parsed.state?.profile?.settings?.sound;
    return typeof sound === 'boolean' ? sound : true;
  } catch {
    return true;
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = MASTER_VOLUME;
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function getPlayableCtx(soundName: string): AudioContext | null {
  if (!isSoundEnabled()) {
    debugAudio('blocked: sound disabled by settings', { soundName }, `muted:${soundName}`);
    return null;
  }

  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    void unlockAudio();
    debugAudio('blocked: AudioContext suspended', { soundName, state: ctx.state }, `suspended:${soundName}`);
    return ctx;
  }
  if (ctx.state !== 'running') {
    debugAudio('blocked: AudioContext not running', { soundName, state: ctx.state }, `state:${soundName}`);
    return null;
  }
  if (masterGain?.gain.value === 0) {
    debugAudio('blocked: master gain is zero', { soundName }, `gain:${soundName}`);
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

function primeSilentAudio(ctx: AudioContext): void {
  const destination = outputNode();
  if (!destination) return;

  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.03)), ctx.sampleRate);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.03);
  source.connect(gain);
  gain.connect(destination);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + 0.03);
}

export async function unlockAudio(): Promise<boolean> {
  const ctx = getCtx();
  if (!ctx) return false;
  if (audioUnlocked && ctx.state === 'running') return true;
  if (unlockPromise) return unlockPromise;

  unlockPromise = (async () => {
    debugAudio('unlock start', {
      state: ctx.state,
      soundEnabled: isSoundEnabled(),
      masterVolume: masterGain?.gain.value ?? null,
    }, 'unlock:start');

    try {
      primeSilentAudio(ctx);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (ctx.state !== 'running') {
        audioUnlocked = false;
        debugAudio('unlock deferred: AudioContext not running', { state: ctx.state }, 'unlock:deferred');
        return false;
      }

      audioUnlocked = ctx.state === 'running';
      debugAudio('unlock complete', { state: ctx.state, audioUnlocked }, 'unlock:complete');
      return audioUnlocked;
    } catch (error) {
      audioUnlocked = false;
      debugAudio(
        'unlock failed',
        { error: error instanceof Error ? error.message : String(error) },
        'unlock:failed'
      );
      return false;
    } finally {
      unlockPromise = null;
    }
  })();

  return unlockPromise;
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
  const ctx = getPlayableCtx('cueHit');
  if (!ctx) return;
  debugAudio('play cue hit', { state: ctx.state, power }, 'play:cueHit');
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
  const ctx = getPlayableCtx('ballHit');
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
  const ctx = getPlayableCtx('wallHit');
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
  const ctx = getPlayableCtx('pocket');
  if (!ctx) return;
  debugAudio('play pocket', { state: ctx.state }, 'play:pocket');
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
  const ctx = getPlayableCtx('nearMiss');
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
  const ctx = getPlayableCtx('win');
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
  const ctx = getPlayableCtx('turnChange');
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
  const ctx = getPlayableCtx('tick');
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
