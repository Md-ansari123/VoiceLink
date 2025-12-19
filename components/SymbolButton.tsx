import React from 'react';
import { PhraseData, AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface SymbolButtonProps {
  phrase: PhraseData;
  settings: AppSettings;
  onClick: () => void;
  index: number;
}

export const SymbolButton: React.FC<SymbolButtonProps> = ({ phrase, settings, onClick, index }) => {
  const handlePress = () => {
    soundService.play(phrase.soundProfile || 'neutral');
    if (navigator.vibrate) navigator.vibrate(40);
    
    const text = settings.language === Language.HINDI ? phrase.phraseHi : phrase.phraseEn;
    speechService.speak(text, settings);
    onClick();
  };

  return (
    <div 
      className="symbol-card" 
      onClick={handlePress}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="symbol-emoji">{phrase.emoji}</div>
      <div className="symbol-label">
        {settings.language === Language.HINDI ? phrase.label : phrase.label}
      </div>
    </div>
  );
};