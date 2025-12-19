import React from 'react';
import { PhraseData, AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface SymbolButtonProps {
  phrase: PhraseData;
  settings: AppSettings;
  onClick: () => void;
  index?: number;
}

export const SymbolButton: React.FC<SymbolButtonProps> = ({ phrase, settings, onClick, index = 0 }) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);

    // 1. Play Sound Effect
    const profile = phrase.soundProfile || 'neutral';
    soundService.play(profile);

    // 2. Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // 3. Speech
    const textToSpeak = settings.language === Language.HINDI ? phrase.phraseHi : phrase.phraseEn;
    setTimeout(() => {
        speechService.speak(textToSpeak, settings);
    }, 100);

    onClick(); 
  };

  const displayText = settings.language === Language.HINDI 
    ? (phrase.phraseHi.length > 20 ? phrase.phraseHi.substring(0, 20) + '...' : phrase.phraseHi)
    : phrase.label;
    
  const accessibilityLabel = settings.language === Language.HINDI ? phrase.phraseHi : phrase.phraseEn;

  // Visual Helper Functions
  const isHighContrast = settings.highContrast;
  
  const getTextSize = () => {
    switch (settings.textSize) {
      case 'extra': return settings.language === Language.HINDI ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-4xl';
      case 'large': return settings.language === Language.HINDI ? 'text-xl sm:text-2xl' : 'text-xl sm:text-3xl';
      default: return settings.language === Language.HINDI ? 'text-lg sm:text-xl' : 'text-lg sm:text-2xl';
    }
  };

  const getEmojiSize = () => {
    switch (settings.textSize) {
        case 'extra': return 'text-6xl sm:text-8xl';
        case 'large': return 'text-5xl sm:text-7xl';
        default: return 'text-4xl sm:text-6xl';
    }
  };

  // High Contrast overrides the bgColor prop
  const containerClasses = isHighContrast
    ? `bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-gray-900`
    : `${phrase.bgColor} border-b-4 border-black/10 text-slate-900 hover:shadow-xl hover:-translate-y-1`;

  const pressedClasses = isHighContrast
    ? `ring-4 ring-white bg-gray-800 scale-95`
    : `ring-4 ring-blue-500 border-b-0 translate-y-1 scale-95`;

  return (
    <button
      onClick={handlePress}
      style={{ animationDelay: `${index * 35}ms` }}
      className={`
        animate-enter
        relative overflow-hidden group
        rounded-2xl p-2 sm:p-4 
        flex flex-col items-center justify-center 
        transition-all duration-150 ease-out
        h-32 sm:h-40 shadow-md
        focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:outline-none focus-visible:ring-offset-2
        ${containerClasses}
        ${isPressed ? pressedClasses : ''}
      `}
      aria-label={`${phrase.label}. Speaks: ${accessibilityLabel}`}
    >
      <div className={`${getEmojiSize()} mb-2 sm:mb-3 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`} aria-hidden="true">
        {phrase.emoji}
      </div>
      <span className={`
        text-center font-bold leading-tight px-1
        ${getTextSize()}
      `}>
        {displayText}
      </span>
      
      {/* Ripple Effect overlay (visual flair) */}
      <div className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-200 ${isPressed ? 'opacity-20' : ''}`} />
    </button>
  );
};