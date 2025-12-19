import { AppSettings, Language } from '../types';

class SpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Handle asynchronous voice loading (common in Chrome/Android)
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.populateVoices();
      };
    }
    this.populateVoices();
  }

  private populateVoices() {
    this.voices = this.synthesis.getVoices();
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public speak(text: string, settings: AppSettings) {
    // Retry loading voices if they weren't available at startup
    if (this.voices.length === 0) {
      this.populateVoices();
    }

    // Cancel current speech to ensure immediate feedback
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;

    // Determine voice: Manual Override vs Auto Best
    let voice: SpeechSynthesisVoice | undefined;

    // 1. Try manual override
    if (settings.selectedVoiceURI) {
        voice = this.voices.find(v => v.voiceURI === settings.selectedVoiceURI);
        // Verify the selected voice supports the target language (broad check)
        // If user switches language but keeps old voice, we should probably fall back to auto unless voice is multi-lingual
        if (voice && !voice.lang.toLowerCase().startsWith(settings.language.split('-')[0])) {
            voice = undefined;
        }
    }

    // 2. Fallback to auto-detection
    if (!voice) {
        voice = this.getBestVoice(settings.language, settings.gender);
    }

    if (voice) {
      utterance.voice = voice;
      // Explicitly set the utterance lang to the voice's lang to prevent engine confusion
      utterance.lang = voice.lang;
    }

    this.synthesis.speak(utterance);
  }

  public stop() {
    this.synthesis.cancel();
  }

  private getBestVoice(lang: Language, gender: 'male' | 'female'): SpeechSynthesisVoice | undefined {
    const langCode = lang.split('-')[0].toLowerCase(); // 'en' or 'hi'
    
    // 1. Strict Filter: Voice must match the requested language code.
    let matchingVoices = this.voices.filter(v => 
      v.lang.toLowerCase().startsWith(langCode)
    );

    // Fallback: If no strict match found for Hindi, look for "Hindi" in the name regardless of lang code
    // This helps on systems where Hindi voices might have generic lang tags but specific names
    if (matchingVoices.length === 0 && lang === Language.HINDI) {
       matchingVoices = this.voices.filter(v => v.name.toLowerCase().includes('hindi'));
    }

    if (matchingVoices.length === 0) return undefined;

    const scoreVoice = (voice: SpeechSynthesisVoice) => {
        let score = 0;
        const name = voice.name.toLowerCase();
        
        // --- Gender Scoring (Weight: +/- 50) ---
        // We use this to differentiate between options of similar quality
        const maleKeywords = ['male', 'man', 'david', 'daniel', 'ravi', 'hemant', 'neil', 'rishi', 'kalb', 'microsoft ram'];
        const femaleKeywords = ['female', 'woman', 'zira', 'samantha', 'susan', 'lekha', 'kalpana', 'heera', 'kore', 'swara', 'microsoft hira', 'meena'];

        const targetKeywords = gender === 'male' ? maleKeywords : femaleKeywords;
        const avoidKeywords = gender === 'male' ? femaleKeywords : maleKeywords;

        if (targetKeywords.some(k => name.includes(k))) score += 50;
        if (avoidKeywords.some(k => name.includes(k))) score -= 50;

        // --- Quality & Source Scoring (Weight: 20-30) ---
        if (name.includes('google')) score += 30;
        if (name.includes('natural')) score += 25; // Microsoft Neural
        if (name.includes('enhanced') || name.includes('premium')) score += 20; // Apple

        // --- Hindi Specific High-Value overrides (Weight: 80-100) ---
        // We prioritize high-quality Hindi voices above all else to ensure intelligibility.
        // A high quality voice of the wrong gender is better than a robotic voice of the right gender.
        if (lang === Language.HINDI) {
            // Google's network/local Hindi voice is usually top tier on Android/Chrome
            if (name.includes('google') && name.includes('hindi')) score += 100;
            
            // Microsoft's specific Indian voices (High quality neural)
            if (name.includes('hemant') || name.includes('kalpana')) score += 80;
            
            // Apple's specific Indian voices
            if (name.includes('lekha') || name.includes('rishi') || name.includes('meena') || name.includes('isha')) score += 80;

            // Generic "Hindi" or "India" markers
            if (name.includes('hindi') || name.includes('india')) score += 10;
        }

        return score;
    };

    // Sort by score descending
    matchingVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));

    return matchingVoices[0];
  }
}

export const speechService = new SpeechService();