import React, { useState } from 'react';
import { Mic, MicOff, Send, MessageSquarePlus } from 'lucide-react';
import { Language, AppSettings } from '../types';
import { soundService } from '../services/soundService';

interface PartnerInputProps {
  onSendMessage: (text: string, sender: 'partner') => void;
  settings: AppSettings;
}

export const PartnerInput: React.FC<PartnerInputProps> = ({ onSendMessage, settings }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  const quickReplies = settings.language === Language.HINDI 
    ? ['ठीक है', 'समझ गया', 'एक मिनट', 'क्या मतलब?'] 
    : ['Okay', 'I understand', 'Wait', 'What?'];

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = settings.language;
      recognition.onstart = () => {
        setIsListening(true);
        soundService.play('alert');
      };
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInterimText(text);
      };
      recognition.onend = () => {
        setIsListening(false);
        if (interimText) {
          onSendMessage(interimText, 'partner');
          setInterimText('');
        }
      };
      recognition.start();
    }
  };

  const isHighContrast = settings.highContrast;

  return (
    <div className={`p-2 shrink-0 border-t ${isHighContrast ? 'bg-black border-yellow-400' : 'bg-white border-slate-100'}`}>
      <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
        <div className="px-2 flex items-center gap-1 border-r opacity-50 shrink-0">
          <MessageSquarePlus size={14} />
          <span className="text-[10px] font-bold uppercase">Partner Reply</span>
        </div>
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => onSendMessage(reply, 'partner')}
            className={`
              shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90
              ${isHighContrast ? 'bg-gray-800 text-yellow-400 border border-yellow-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
            `}
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`
            flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95
            ${isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : (isHighContrast ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white')}
          `}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="text-sm uppercase tracking-tight">
            {isListening ? (interimText || 'Listening...') : 'Tap to talk to User'}
          </span>
        </button>
      </div>
    </div>
  );
};