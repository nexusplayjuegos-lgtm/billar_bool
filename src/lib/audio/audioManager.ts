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
