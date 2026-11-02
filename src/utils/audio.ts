class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private flightOscillator: OscillatorNode | null = null;
  private flightGain: GainNode | null = null;

  constructor() {
    const saved = localStorage.getItem('aviator_sound_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('aviator_sound_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopFlightSound();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playBetClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio context may require user gesture
    }
  }

  public startFlightSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      this.stopFlightSound();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);

      // Low pass filter for engine rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.flightOscillator = osc;
      this.flightGain = gain;
    } catch {
      // Ignore audio resume errors
    }
  }

  public updateFlightPitch(multiplier: number) {
    if (this.isMuted || !this.ctx || !this.flightOscillator) return;
    try {
      // Scale frequency with multiplier (80Hz at 1.00x up to 350Hz at 10.00x)
      const targetFreq = Math.min(80 + Math.log2(Math.max(1, multiplier)) * 75, 450);
      this.flightOscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch {
      // Ignore
    }
  }

  public stopFlightSound() {
    if (this.flightOscillator && this.ctx) {
      try {
        if (this.flightGain) {
          this.flightGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        this.flightOscillator.stop();
        this.flightOscillator.disconnect();
      } catch {
        // Ignore
      }
      this.flightOscillator = null;
      this.flightGain = null;
    }
  }

  public playCashOut() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Arpeggio chords
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.2, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  public playCrash() {
    this.stopFlightSound();
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Low boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundController();
