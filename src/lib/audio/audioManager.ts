'use client';

export type AudioName =
  | 'cue_hit'
  | 'ball_pocket'
  | 'ball_collision'
  | 'rail_hit'
  | 'break_shot'
  | 'win'
  | 'lose'
  | 'coins'
  | 'achievement'
  | 'ui_click';

const AUDIO_FILES: Record<AudioName, string> = {
  cue_hit: '/sounds/cue_hit.mp3',
  ball_pocket: '/sounds/ball_pocket.mp3',
  ball_collision: '/sounds/ball_collision.mp3',
  rail_hit: '/sounds/rail_hit.mp3',
  break_shot: '/sounds/break_shot.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  coins: '/sounds/coins.mp3',
  achievement: '/sounds/achievement.mp3',
  ui_click: '/sounds/ui_click.mp3',
};

type AudioContextConstructor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

class AudioManager {
  private sounds = new Map<AudioName, HTMLAudioElement>();
  private enabled = true;
  private volume = 0.7;
  private preloaded = false;
  private fallbackCtx: AudioContext | null = null;

  preload() {
    if (typeof window === 'undefined' || this.preloaded) return;
    this.preloaded = true;
    for (const [name, src] of Object.entries(AUDIO_FILES) as Array<[AudioName, string]>) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.sounds.set(name, audio);
    }
  }

  play(name: AudioName) {
    if (!this.enabled || typeof window === 'undefined') return;
    this.preload();
    const sound = this.sounds.get(name);
    if (!sound) return;
    const instance = sound.cloneNode(true);
    if (!(instance instanceof HTMLAudioElement)) return;
    instance.volume = this.volume;
    instance.currentTime = 0;
    void instance.play().catch(() => this.playFallback(name));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    for (const sound of Array.from(this.sounds.values())) {
      sound.volume = this.volume;
    }
  }

  private getFallbackContext() {
    if (typeof window === 'undefined') return null;
    if (this.fallbackCtx) return this.fallbackCtx;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.fallbackCtx = new AudioContextClass();
    return this.fallbackCtx;
  }

  private playFallback(name: AudioName) {
    const ctx = this.getFallbackContext();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;

    if (name === 'cue_hit' || name === 'break_shot') {
      this.playNoise(ctx, now, 0.08, name === 'break_shot' ? 900 : 1250, name === 'break_shot' ? 0.28 : 0.18);
      this.playTone(ctx, now, name === 'break_shot' ? 92 : 160, 0.16, 0.2, 'sine', 0.45);
      this.playTone(ctx, now + 0.012, 1900, 0.035, 0.08, 'triangle', 0.35);
      return;
    }

    if (name === 'ball_collision') {
      this.playTone(ctx, now, 980, 0.055, 0.12, 'sine', 0.65);
      this.playTone(ctx, now + 0.006, 1420, 0.05, 0.09, 'sine', 0.52);
      this.playNoise(ctx, now, 0.025, 3400, 0.045);
      return;
    }

    if (name === 'rail_hit') {
      this.playTone(ctx, now, 310, 0.09, 0.12, 'sine', 0.6);
      this.playNoise(ctx, now, 0.045, 1150, 0.06);
      return;
    }

    if (name === 'ball_pocket') {
      this.playNoise(ctx, now, 0.22, 420, 0.16);
      this.playTone(ctx, now + 0.04, 260, 0.34, 0.13, 'sine', 0.35);
      this.playTone(ctx, now + 0.075, 520, 0.2, 0.06, 'sine', 0.4);
      return;
    }

    if (name === 'ui_click') {
      this.playTone(ctx, now, 920, 0.045, 0.09, 'triangle', 0.5);
      return;
    }

    if (name === 'coins') {
      [1046.5, 1318.5, 1568, 2093].forEach((frequency, index) => {
        this.playTone(ctx, now + index * 0.045, frequency, 0.16, 0.12, 'sine', 0.5);
      });
      this.playNoise(ctx, now + 0.04, 0.22, 4200, 0.06);
      return;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(ctx.destination);

    const frequencies = this.getFallbackFrequencies(name);
    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = name === 'lose' ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.045);
      oscillator.connect(gain);
      oscillator.start(now + index * 0.045);
      oscillator.stop(now + 0.24 + index * 0.045);
    });
  }

  private playTone(
    ctx: AudioContext,
    startAt: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    slide = 1
  ) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (slide !== 1) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * slide), startAt + duration);
    }
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(this.volume * volume, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.01);
  }

  private playNoise(ctx: AudioContext, startAt: number, duration: number, filterFrequency: number, volume: number) {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrequency, startAt);
    gain.gain.setValueAtTime(this.volume * volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(startAt);
    source.stop(startAt + duration + 0.01);
  }

  private getFallbackFrequencies(name: AudioName) {
    if (name === 'win' || name === 'achievement') return [523.25, 659.25, 783.99, 1046.5];
    if (name === 'lose') return [220, 174.61, 146.83];
    if (name === 'coins') return [987.77, 1318.51, 1567.98];
    if (name === 'break_shot') return [110, 164.81, 220];
    if (name === 'ui_click') return [880];
    if (name === 'ball_collision') return [1200, 1600];
    if (name === 'rail_hit') return [240];
    if (name === 'ball_pocket') return [330, 220];
    return [440];
  }
}

export const audioManager = new AudioManager();
