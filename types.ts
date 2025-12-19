export enum Language {
  ENGLISH = 'en-US',
  HINDI = 'hi-IN'
}

export type SoundProfile = 'happy' | 'sad' | 'neutral' | 'alert' | 'question' | 'social';

export interface PhraseData {
  id: string;
  label: string;
  phraseEn: string;
  phraseEnFemale?: string;
  phraseHi: string;
  phraseHiFemale?: string;
  emoji: string;
  bgColor: string;
  soundProfile?: SoundProfile;
}

export interface Category {
  id: string;
  labelEn: string;
  labelHi: string;
  icon: string;
  colorTheme: string;
  soundProfile?: SoundProfile;
}

export interface AppSettings {
  language: Language;
  gender: 'male' | 'female';
  rate: number;
  pitch: number;
  volume: number;
  highContrast: boolean;
  textSize: 'normal' | 'large' | 'extra';
  selectedVoiceURI?: string | null;
  privacyEnabled: boolean;
  signGenerationEnabled: boolean;
}

export interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'partner';
  timestamp: number;
  type: 'text' | 'sign' | 'voice';
  signImageUrl?: string;
}