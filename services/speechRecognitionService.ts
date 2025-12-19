// Simple wrapper for Web Speech API to enable Voice Commands for navigation
// This helps visually impaired users control the app.

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Polyfill for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private shouldListen: boolean = false;
  private onCommandCallback: ((transcript: string) => void) | null = null;

  public init(onCommand: (transcript: string) => void) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    this.onCommandCallback = onCommand;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.continuous = true; // Keep listening for multiple commands
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Loop through results starting from the resultIndex
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim().toLowerCase();
            if (this.onCommandCallback) {
              this.onCommandCallback(transcript);
            }
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldListen = false;
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if we are supposed to be listening
        if (this.shouldListen) {
          setTimeout(() => {
            try {
              this.recognition?.start();
            } catch (e) {
              console.error("Failed to restart recognition", e);
            }
          }, 100);
        }
      };
    }
  }

  public setLanguage(lang: string) {
    if (this.recognition && this.recognition.lang !== lang) {
      this.recognition.lang = lang;
      // If currently listening, restart to apply language change
      if (this.shouldListen) {
        this.recognition.stop(); // onend will trigger restart
      }
    }
  }

  public startListening() {
    this.shouldListen = true;
    try {
      this.recognition?.start();
    } catch (e) {
      // Already started or error
    }
  }

  public stopListening() {
    this.shouldListen = false;
    try {
      this.recognition?.stop();
    } catch (e) {
      // Ignore
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();