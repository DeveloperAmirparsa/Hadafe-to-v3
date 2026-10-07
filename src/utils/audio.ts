/**
 * Luxury Web Audio Synthesizer for "Hadafe To"
 * Provides calm, Apple-inspired chimes and harmonic feedback without external mp3 dependencies.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Lazy init audio context on user interaction
    const savedEnabled = localStorage.getItem('hadafe_to_sound_enabled');
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }
    const savedVol = localStorage.getItem('hadafe_to_sound_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('hadafe_to_sound_enabled', String(val));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('hadafe_to_sound_volume', String(this.volume));
  }

  // Play a gentle sine harmonic note
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', delay: number = 0, gainLevel: number = 0.3) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const startTime = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel * this.volume, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // 1. Session Start (Crisp double tone)
  public playSessionStart() {
    this.playTone(523.25, 0.25, 'sine', 0, 0.3); // C5
    this.playTone(659.25, 0.4, 'sine', 0.12, 0.35); // E5
  }

  public playTimerStart() {
    this.playSessionStart();
  }

  public playTimerPause() {
    this.playTone(440, 0.15, 'sine', 0, 0.2);
  }

  public playTimerFinish() {
    this.playSessionComplete();
  }

  // 2. Session Complete (Harmonious triumphant chord)
  public playSessionComplete() {
    this.playTone(523.25, 0.6, 'sine', 0, 0.3); // C5
    this.playTone(659.25, 0.6, 'sine', 0.1, 0.3); // E5
    this.playTone(783.99, 0.8, 'sine', 0.2, 0.35); // G5
    this.playTone(1046.50, 1.2, 'triangle', 0.3, 0.4); // C6
  }

  // 3. Break Start (Calming bell)
  public playBreakStart() {
    this.playTone(440.00, 0.8, 'sine', 0, 0.25); // A4
    this.playTone(554.37, 1.0, 'sine', 0.15, 0.25); // C#5
  }

  // 4. Break End (Alert chime)
  public playBreakEnd() {
    this.playTone(880.00, 0.2, 'triangle', 0, 0.35);
    this.playTone(880.00, 0.3, 'triangle', 0.25, 0.4);
    this.playTone(1046.50, 0.5, 'sine', 0.5, 0.35);
  }

  // 5. Reward / Focus Point gain (Crisp coin chime)
  public playRewardCoin() {
    this.playTone(987.77, 0.15, 'triangle', 0, 0.25); // B5
    this.playTone(1318.51, 0.4, 'sine', 0.08, 0.35); // E6
  }

  // 6. Badge Unlock (Majestic arpeggio)
  public playBadgeUnlock() {
    this.playTone(440, 0.3, 'sine', 0, 0.3);
    this.playTone(554.37, 0.3, 'sine', 0.1, 0.3);
    this.playTone(659.25, 0.3, 'sine', 0.2, 0.35);
    this.playTone(880, 0.7, 'triangle', 0.3, 0.4);
  }

  // 7. Streak Milestone (Deep resonant bell)
  public playStreakMilestone() {
    this.playTone(261.63, 1.2, 'sine', 0, 0.4); // C4
    this.playTone(523.25, 1.0, 'sine', 0.15, 0.35); // C5
    this.playTone(783.99, 1.4, 'triangle', 0.3, 0.45); // G5
  }
}

export const soundManager = new SoundSystem();
