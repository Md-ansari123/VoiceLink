import React, { useState, useEffect, useCallback } from 'react';
import { Settings, MessageSquare, Volume2, Clock, Layers, Mic, MicOff, User, Heart, Users, Hand } from 'lucide-react';
import { CATEGORIES, PHRASES } from './constants';
import { AppSettings, Language, Category, PhraseData, ConversationMessage } from './types';
import { SymbolButton } from './components/SymbolButton';
import { SettingsPanel } from './components/SettingsPanel';
import { SentenceBuilder } from './components/SentenceBuilder';
import { KeyboardInput } from './components/KeyboardInput';
import { SignLanguageCamera } from './components/SignLanguageCamera';
import { LandingPage } from './components/LandingPage';
import { ConversationHistory } from './components/ConversationHistory';
import { PartnerInput } from './components/PartnerInput';
import { SignGenerator } from './components/SignGenerator';
import { soundService } from './services/soundService';
import { speechService } from './services/speechService';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('needs');
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('voiceLinkOnboardingComplete');
    }
    return true;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceLinkSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
             language: Language.ENGLISH,
             gender: 'female',
             rate: 1.0,
             pitch: 1.0,
             volume: 1.0,
             highContrast: false,
             textSize: 'normal',
             selectedVoiceURI: null,
             privacyEnabled: true,
             signGenerationEnabled: true,
             ...parsed
          };
        } catch (e) { console.error(e); }
      }
    }
    return {
      language: Language.ENGLISH,
      gender: 'female',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      highContrast: false,
      textSize: 'normal',
      selectedVoiceURI: null,
      privacyEnabled: true,
      signGenerationEnabled: true,
    };
  });

  const [userName, setUserName] = useState<string>(() => localStorage.getItem('voiceLinkUserName') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [recentPhrases, setRecentPhrases] = useState<PhraseData[]>([]);
  const [isSentenceMode, setIsSentenceMode] = useState(false);
  const [sentenceQueue, setSentenceQueue] = useState<PhraseData[]>([]);

  useEffect(() => {
    localStorage.setItem('voiceLinkSettings', JSON.stringify(settings));
  }, [settings]);

  const addMessage = useCallback((text: string, sender: 'user' | 'partner', type: 'text' | 'sign' | 'voice' = 'text') => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now(),
      type
    };
    setMessages(prev => [...prev.slice(-19), newMessage]);
  }, []);

  const handlePhraseClick = (phrase: PhraseData) => {
    setRecentPhrases(prev => {
      const filtered = prev.filter(p => p.id !== phrase.id);
      return [phrase, ...filtered].slice(0, 12);
    });

    if (isSentenceMode) {
      setSentenceQueue(prev => [...prev, phrase]);
    } else {
      let text = "";
      if (settings.language === Language.HINDI) {
        text = (settings.gender === 'female' && phrase.phraseHiFemale) ? phrase.phraseHiFemale : phrase.phraseHi;
      } else {
        text = (settings.gender === 'female' && phrase.phraseEnFemale) ? phrase.phraseEnFemale : phrase.phraseEn;
      }
      addMessage(text, 'user', 'sign');
    }
  };

  const handlePartnerMessage = (text: string) => {
    soundService.play('social');
    addMessage(text, 'partner', 'voice');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const handleOnboardingComplete = (data: { name: string; gender: 'male' | 'female'; language: Language }) => {
    const newSettings = { ...settings, language: data.language, gender: data.gender };
    setSettings(newSettings);
    setUserName(data.name);
    localStorage.setItem('voiceLinkSettings', JSON.stringify(newSettings));
    localStorage.setItem('voiceLinkUserName', data.name);
    localStorage.setItem('voiceLinkOnboardingComplete', 'true');
    setIsOnboarding(false);
  };

  if (isOnboarding) return <LandingPage onComplete={handleOnboardingComplete} />;

  const activePhrases = activeCategory === 'recents' ? recentPhrases : (PHRASES[activeCategory] || []);
  const isHighContrast = settings.highContrast;
  const isFemale = settings.gender === 'female';

  const theme = {
    mainBg: isHighContrast ? 'bg-black' : (isFemale ? 'bg-pink-50' : 'bg-slate-50'),
    headerBg: isHighContrast ? 'bg-black border-yellow-400' : (isFemale ? 'bg-white border-pink-200' : 'bg-white border-slate-200'),
    headerText: isHighContrast ? 'text-yellow-400' : (isFemale ? 'text-pink-900' : 'text-slate-800'),
    accentBg: isHighContrast ? 'bg-yellow-400 text-black' : (isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'),
    navBg: isHighContrast ? 'bg-black border-yellow-400' : (isFemale ? 'bg-white border-pink-200' : 'bg-white border-slate-200'),
  };

  const lastPartnerMessage = messages.filter(m => m.sender === 'partner').slice(-1)[0];

  return (
    <div className={`flex flex-col h-screen ${theme.mainBg} transition-colors duration-500`}>
      <header className={`${theme.headerBg} border-b px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-10 transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <div className={`${theme.accentBg} p-2 rounded-lg animate-pop`}>
            {isFemale ? <Heart size={20} fill="currentColor" /> : <MessageSquare size={20} />}
          </div>
          <div>
            <h1 className={`font-black text-lg leading-none ${theme.headerText} tracking-tighter`}>VOICELINK</h1>
            <p className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
              <Users size={10} /> {userName || 'AAC User'} Bridge
            </p>
          </div>
        </div>

        <div className="flex gap-2">
            <button
                onClick={() => setSettings(s => ({ ...s, language: s.language === Language.ENGLISH ? Language.HINDI : Language.ENGLISH }))}
                className={`px-3 py-1.5 rounded-lg font-black text-xs border transition-all active:scale-95 ${isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-slate-100 text-slate-700'}`}
            >
                {settings.language === Language.ENGLISH ? 'EN' : 'HI'}
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg ${isHighContrast ? 'text-yellow-400' : 'text-slate-600'}`}
            >
                <Settings size={22} />
            </button>
        </div>
      </header>

      {/* Shared Bridge View */}
      <div className="flex flex-col h-40 border-b">
         <ConversationHistory messages={messages} highContrast={isHighContrast} language={settings.language} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 relative" id="main-content">
        <div className="max-w-4xl mx-auto h-full flex flex-col gap-4">
          
          {/* Sign Language Visualization Area (For the disabled user) */}
          {lastPartnerMessage && settings.signGenerationEnabled && activeCategory !== 'sign' && (
            <div className="animate-enter stagger-1">
               <SignGenerator text={lastPartnerMessage.text} settings={settings} />
            </div>
          )}

          {activeCategory === 'keyboard' ? (
             <KeyboardInput settings={settings} />
          ) : activeCategory === 'sign' ? (
             <SignLanguageCamera settings={settings} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-20">
              {activePhrases.map((phrase, index) => (
                <SymbolButton 
                  key={phrase.id}
                  phrase={phrase.id === 'my_name' && userName ? { ...phrase, label: `I'm ${userName}`, phraseEn: `My name is ${userName}`, phraseHi: `मेरा नाम ${userName} है` } : phrase} 
                  settings={settings}
                  index={index}
                  onClick={() => handlePhraseClick(phrase)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="flex flex-col shrink-0">
        {isSentenceMode && activeCategory !== 'sign' && (
          <SentenceBuilder 
            queue={sentenceQueue}
            onRemove={(idx) => setSentenceQueue(prev => prev.filter((_, i) => i !== idx))}
            onClear={() => setSentenceQueue([])}
            settings={settings}
            onSpeak={(text) => addMessage(text, 'user', 'voice')}
          />
        )}

        <nav className={`border-t shadow-lg ${theme.navBg}`}>
          <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar">
            <div className="flex p-2 gap-2 min-w-max">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { soundService.play(cat.soundProfile || 'neutral'); setActiveCategory(cat.id); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[4.5rem] transition-all duration-300 ${isActive ? (isHighContrast ? 'bg-yellow-400 text-black scale-110' : `bg-${cat.colorTheme} text-white scale-110 -translate-y-1 shadow-lg`) : (isHighContrast ? 'bg-gray-900 text-yellow-600' : 'bg-white text-slate-500 border')}`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold uppercase">{settings.language === Language.ENGLISH ? cat.labelEn : cat.labelHi}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Both persons use the Partner Input for quick text/voice bridge */}
        <PartnerInput onSendMessage={handlePartnerMessage} settings={settings} />
      </div>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} />
    </div>
  );
};

export default App;