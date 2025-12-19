import React from 'react';
import { Play, Trash2, X } from 'lucide-react';
import { PhraseData, AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface SentenceBuilderProps {
  queue: PhraseData[];
  onRemove: (index: number) => void;
  onClear: () => void;
  settings: AppSettings;
  onSpeak?: (text: string) => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ 
  queue, 
  onRemove, 
  onClear, 
  settings,
  onSpeak
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [queue]);

  const handleSpeakSentence = () => {
    if (queue.length === 0) return;
    
    soundService.play('social');
    const text = queue.map(p => 
      settings.language === Language.HINDI ? p.phraseHi : p.phraseEn
    ).join('. '); 
    
    if (onSpeak) onSpeak(text);
    
    setTimeout(() => {
        speechService.speak(text, settings);
    }, 100);
  };

  return (
    <div className="bg-white border-t border-slate-100 shadow-lg animate-slide-up z-20">
      <div className="max-w-4xl mx-auto p-2 flex gap-2 items-center">
        {queue.length === 0 ? (
           <div className="flex-1 text-slate-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
             Building Mode: Tap symbols to add
           </div>
        ) : (
          <div ref={containerRef} className="flex-1 overflow-x-auto flex gap-2 p-1 no-scrollbar scroll-smooth">
            {queue.map((phrase, idx) => (
              <div key={`${phrase.id}-${idx}`} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ${phrase.bgColor} animate-pop`}>
                <span className="text-lg">{phrase.emoji}</span>
                <span className="text-[10px] font-black uppercase whitespace-nowrap">
                  {settings.language === Language.HINDI ? phrase.label : phrase.label}
                </span>
                <button onClick={() => { soundService.play('neutral'); onRemove(idx); }} className="p-1 hover:text-red-500"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 shrink-0 border-l pl-2">
          <button onClick={() => { soundService.play('sad'); onClear(); }} disabled={queue.length === 0} className="p-3 text-slate-400 disabled:opacity-30"><Trash2 size={20} /></button>
          <button onClick={handleSpeakSentence} disabled={queue.length === 0} className="px-5 py-3 bg-blue-600 text-white rounded-xl shadow-md disabled:opacity-30 flex items-center gap-2 font-bold"><Play size={18} fill="currentColor" />Speak</button>
        </div>
      </div>
    </div>
  );
};