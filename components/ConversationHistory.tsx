import React from 'react';
import { User, MessageCircle, Volume2 } from 'lucide-react';
import { Language } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'partner';
  timestamp: number;
}

interface ConversationHistoryProps {
  messages: Message[];
  highContrast: boolean;
  language: Language;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ messages, highContrast, language }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={`h-32 flex flex-col items-center justify-center opacity-40 border-b ${highContrast ? 'border-yellow-400' : 'border-slate-100'}`}>
        <MessageCircle size={32} className="mb-1" />
        <p className="text-xs font-bold uppercase tracking-widest">
          {language === Language.HINDI ? 'बातचीत शुरू करें' : 'Start Conversation'}
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className={`h-40 overflow-y-auto p-3 flex flex-col gap-3 border-b transition-all ${highContrast ? 'bg-black border-yellow-400' : 'bg-slate-50 border-slate-200 shadow-inner'}`}
    >
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} animate-pop`}
        >
          <div className={`
            max-w-[85%] px-4 py-2 rounded-2xl text-sm font-bold shadow-sm flex items-center gap-2
            ${msg.sender === 'user' 
              ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white rounded-bl-none') 
              : (highContrast ? 'bg-white text-black border-2 border-yellow-400' : 'bg-white text-slate-800 border border-slate-200 rounded-br-none')}
          `}>
            {msg.sender === 'user' && <Volume2 size={14} className="opacity-70" />}
            {msg.text}
            {msg.sender === 'partner' && <User size={14} className="opacity-50" />}
          </div>
          <span className="text-[10px] mt-1 opacity-40 font-black uppercase">
            {msg.sender === 'user' ? 'Speaker' : 'Partner'}
          </span>
        </div>
      ))}
    </div>
  );
};