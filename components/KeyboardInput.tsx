import React, { useState } from 'react';
import { Play, X, Type } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface KeyboardInputProps {
  settings: AppSettings;
}

export const KeyboardInput: React.FC<KeyboardInputProps> = ({ settings }) => {
  const [text, setText] = useState('');

  const handleSpeak = () => {
    if (!text.trim()) return;
    soundService.play('social');
    speechService.speak(text, settings);
  };

  const handleClear = () => {
    soundService.play('neutral');
    setText('');
  };

  const isHighContrast = settings.highContrast;

  return (
    <div className={`
      animate-pop
      flex flex-col h-full max-w-4xl mx-auto p-4 rounded-2xl
      ${isHighContrast ? 'bg-black border-2 border-yellow-400' : 'bg-white border border-slate-200'}
    `}>
      <div className="flex items-center gap-2 mb-4">
        <Type className={isHighContrast ? 'text-yellow-400' : 'text-blue-600'} size={24} />
        <h2 className={`
          text-xl font-bold 
          ${isHighContrast ? 'text-yellow-400' : 'text-slate-700'}
        `}>
          Type to Speak
        </h2>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={settings.language === Language.HINDI ? "यहाँ टाइप करें..." : "Type here..."}
        className={`
          flex-1 w-full p-4 rounded-xl text-2xl resize-none outline-none transition-all duration-200
          ${isHighContrast 
            ? 'bg-gray-900 text-yellow-400 border-2 border-yellow-400 placeholder-yellow-700 focus:ring-2 focus:ring-yellow-200' 
            : 'bg-slate-50 text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:shadow-inner'}
        `}
      />

      <div className="flex gap-4 mt-4 h-20">
        <button
          onClick={handleClear}
          className={`
            px-6 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2
            ${isHighContrast 
              ? 'bg-gray-800 text-white border border-white hover:bg-gray-700' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'}
          `}
        >
          <X size={24} />
          Clear
        </button>
        
        <button
          onClick={handleSpeak}
          disabled={!text.trim()}
          className={`
            flex-1 rounded-xl font-bold text-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 shadow-md
            ${isHighContrast 
              ? 'bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none'}
          `}
        >
          <Play size={28} fill="currentColor" />
          Speak
        </button>
      </div>
    </div>
  );
};