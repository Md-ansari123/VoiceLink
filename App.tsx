import React, { useState, useEffect, useCallback } from 'react';
import { Settings, MessageSquare, Heart, Users } from 'lucide-react';
import { CATEGORIES, PHRASES } from './constants';
import { AppSettings, Language, PhraseData, ConversationMessage } from './types';
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
    const saved = localStorage.getItem('voiceLinkSettings');
    if (saved) {
      try {
        return { ...JSON.parse(saved) };
      } catch (e) { console.error(e); }
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
  const [sentenceQueue, setSentenceQueue] = useState<PhraseData[]>([]);

  useEffect(() => {
    localStorage.setItem('voiceLinkSettings', JSON.stringify(settings));
  }, [settings]);

  const addMessage = useCallback((text: string, sender: 'user' | 'partner', type: 'text' | 'sign' | 'voice' = 'text') => {
    const newMessage: ConversationMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now(),
      type
    };
    setMessages(prev => [...prev.slice(-15), newMessage]);
  }, []);

  const handlePhraseClick = (phrase: PhraseData) => {
    setRecentPhrases(prev => [phrase, ...prev.filter(p => p.id !== phrase.id)].slice(0, 12));
    const text = settings.language === Language.HINDI ? phrase.phraseHi : phrase.phraseEn;
    addMessage(text, 'user', 'voice');
  };

  const handleOnboardingComplete = (data: { name: string; gender: 'male' | 'female'; language: Language }) => {
    const newSettings = { ...settings, language: data.language, gender: data.gender };
    setSettings(newSettings);
    setUserName(data.name);
    localStorage.setItem('voiceLinkUserName', data.name);
    localStorage.setItem('voiceLinkOnboardingComplete', 'true');
    setIsOnboarding(false);
  };

  if (isOnboarding) return <LandingPage onComplete={handleOnboardingComplete} />;

  const activePhrases = activeCategory === 'recents' ? recentPhrases : (PHRASES[activeCategory] || []);
  const lastPartnerMessage = messages.filter(m => m.sender === 'partner').slice(-1)[0];

  return (
    <div className={`app-container ${settings.highContrast ? 'high-contrast' : ''}`}>
      <header className="header">
        <div className="header-brand">
          <div className="logo-box">
            {settings.gender === 'female' ? <Heart size={20} fill="currentColor" /> : <MessageSquare size={20} />}
          </div>
          <div>
            <h1 className="brand-title">VOICELINK</h1>
            <div className="brand-subtitle">
              <Users size={10} /> {userName} Bridge
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setSettings(s => ({ ...s, language: s.language === Language.ENGLISH ? Language.HINDI : Language.ENGLISH }))} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface-solid)', fontWeight: 800, fontSize: '0.7rem' }}>
            {settings.language === Language.ENGLISH ? 'EN' : 'HI'}
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      <ConversationHistory messages={messages} highContrast={settings.highContrast} language={settings.language} />

      <main className="main-content">
        {lastPartnerMessage && settings.signGenerationEnabled && activeCategory !== 'sign' && (
          <SignGenerator text={lastPartnerMessage.text} settings={settings} />
        )}

        {activeCategory === 'keyboard' ? (
          <KeyboardInput settings={settings} />
        ) : activeCategory === 'sign' ? (
          <SignLanguageCamera settings={settings} />
        ) : (
          <div className="symbol-grid">
            {activePhrases.map((phrase, idx) => (
              <SymbolButton key={phrase.id} phrase={phrase} settings={settings} index={idx} onClick={() => handlePhraseClick(phrase)} />
            ))}
          </div>
        )}
      </main>

      <section className="bottom-section">
        <nav className="nav-bar">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => { soundService.play(cat.soundProfile); setActiveCategory(cat.id); }}>
              <span className="nav-icon">{cat.icon}</span>
              <span className="nav-label">{settings.language === Language.ENGLISH ? cat.labelEn : cat.labelHi}</span>
            </div>
          ))}
        </nav>
        <div className="partner-input-container">
          <PartnerInput onSendMessage={(text) => addMessage(text, 'partner', 'voice')} settings={settings} />
        </div>
      </section>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} />
    </div>
  );
};

export default App;