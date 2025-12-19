import { SoundProfile } from '../types';

class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.2; // Master volume
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(profile: SoundProfile = 'neutral') {
    // Initialize on user interaction
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    switch (profile) {
      case 'happy':
        // Major 7th Arpeggio (C5-E5-G5-B5) - Very uplifting
        this.playTone(523.25, t, 'sine', 0.1, 0.2);
        this.playTone(659.25, t + 0.06, 'sine', 0.1, 0.2);
        this.playTone(783.99, t + 0.12, 'sine', 0.1, 0.2);
        this.playTone(987.77, t + 0.18, 'sine', 0.3, 0.15); 
        break;

      case 'sad':
        // Descending Minor Interval with Detune - Melancholic
        // A3 -> F3
        this.playTone(220.00, t, 'triangle', 0.5, 0.2);
        this.playTone(218.00, t, 'triangle', 0.5, 0.1); // Slight detune for texture
        this.playTone(174.61, t + 0.3, 'triangle', 0.7, 0.2);
        break;

      case 'alert':
        // Urgent Double Beep - Square wave
        this.playTone(880, t, 'square', 0.08, 0.15);
        this.playTone(880, t + 0.12, 'square', 0.08, 0.15);
        break;

      case 'question':
        // Rapid Upward Slide - Inquisitive
        this.playSlide(300, 1000, t, 0.25, 'sine');
        break;

      case 'social':
        // Friendly "Ding-Dong" (Major 6th) - G4 -> E5
        this.playTone(392.00, t, 'sine', 0.15, 0.2); 
        this.playTone(659.25, t + 0.12, 'sine', 0.25, 0.2);
        break;

      case 'neutral':
      default:
        // High-pitch "Pop" - Clean feedback
        this.playTone(1000, t, 'sine', 0.04, 0.1);
        break;
    }
  }

  private playTone(freq: number, startTime: number, type: OscillatorType, duration: number, volume: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Envelope for smooth sound
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  private playSlide(startFreq: number, endFreq: number, startTime: number, duration: number, type: OscillatorType) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }
}

export const soundService = new SoundService();