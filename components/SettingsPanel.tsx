import React, { useEffect, useState } from 'react';
import { Settings, X, Volume2, Gauge, PlayCircle, User, Eye, Type, Accessibility, Mic, ShieldCheck, Hand } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setAvailableVoices(speechService.getVoices());
    const unsubscribe = speechService.subscribe(() => {
        setAvailableVoices(speechService.getVoices());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    soundService.play('neutral');
    setSettings({ ...settings, [key]: value });
  };

  const handleTestVoice = () => {
    soundService.play('social');
    const text = settings.language === Language.HINDI 
      ? 'नमस्ते, यह मेरी आवाज़ है' 
      : 'Hello, this is my voice';
    setTimeout(() => {
        speechService.speak(text, settings);
    }, 100);
  };

  const handleClose = () => {
    soundService.play('neutral');
    onClose();
  };

  const currentLangCode = settings.language.split('-')[0].toLowerCase();
  const filteredVoices = availableVoices.filter(v => 
    v.lang.toLowerCase().startsWith(currentLangCode) || 
    (settings.language === Language.HINDI && v.name.toLowerCase().includes('hindi'))
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`
        rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[90vh] overflow-y-auto
        ${settings.highContrast ? 'bg-black border-2 border-yellow-400' : 'bg-white'}
      `}>
        <button 
          onClick={handleClose}
          className={`
            absolute top-4 right-4 p-2 rounded-full transition-colors
            ${settings.highContrast ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}
          `}
          aria-label="Close Settings"
        >
          <X size={24} />
        </button>

        <h2 className={`
          text-2xl font-bold mb-6 flex items-center gap-2
          ${settings.highContrast ? 'text-yellow-400' : 'text-slate-800'}
        `}>
          <Settings className={settings.highContrast ? 'text-yellow-400' : 'text-blue-600'} />
          Settings
        </h2>

        <div className="space-y-6">
          
          {/* AI & Features Section */}
          <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-indigo-50 border border-indigo-100'}`}>
            <h3 className={`font-bold mb-3 flex items-center gap-2 ${settings.highContrast ? 'text-yellow-400' : 'text-indigo-800'}`}>
                <ShieldCheck size={18} />
                Communication Bridge
            </h3>
            
            <div className="flex items-center justify-between mb-4">
                <label className={`font-medium flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
                    <Hand size={16} />
                    Sign Visualization (GenAI)
                </label>
                <button 
                    onClick={() => handleChange('signGenerationEnabled', !settings.signGenerationEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.signGenerationEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${settings.signGenerationEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <label className={`font-medium flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
                    <ShieldCheck size={16} />
                    On-Device Privacy Mode
                </label>
                <button 
                    onClick={() => handleChange('privacyEnabled', !settings.privacyEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.privacyEnabled ? 'bg-green-600' : 'bg-slate-300'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${settings.privacyEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-blue-50 border border-blue-100'}`}>
            <h3 className={`font-bold mb-3 flex items-center gap-2 ${settings.highContrast ? 'text-yellow-400' : 'text-blue-800'}`}>
                <Accessibility size={18} />
                Accessibility
            </h3>
            
            <div className="flex items-center justify-between mb-4">
                <label className={`font-medium flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
                    <Eye size={16} />
                    High Contrast
                </label>
                <button 
                    onClick={() => handleChange('highContrast', !settings.highContrast)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.highContrast ? 'bg-yellow-400' : 'bg-slate-300'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${settings.highContrast ? 'translate-x-7 bg-black' : 'translate-x-1'}`} />
                </button>
            </div>

            <div>
                <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-600'}`}>
                    <Type size={16} />
                    Text Size
                </label>
                <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
                    {['normal', 'large', 'extra'].map((size) => (
                        <button
                            key={size}
                            onClick={() => handleChange('textSize', size)}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all capitalize ${settings.textSize === size ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-white text-blue-600 shadow-sm') : (settings.highContrast ? 'text-white hover:bg-gray-700' : 'text-slate-500 hover:bg-slate-200')}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <hr className={settings.highContrast ? 'border-gray-700' : 'border-slate-200'} />

          <div>
            <label className={`block text-sm font-semibold mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-600'}`}>Language / भाषा</label>
            <div className={`flex p-1 rounded-xl ${settings.highContrast ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => handleChange('language', Language.ENGLISH)}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${settings.language === Language.ENGLISH ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-white text-blue-600 shadow-sm') : (settings.highContrast ? 'text-white' : 'text-slate-500')}`}
              >
                English
              </button>
              <button
                onClick={() => handleChange('language', Language.HINDI)}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${settings.language === Language.HINDI ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-white text-orange-600 shadow-sm') : (settings.highContrast ? 'text-white' : 'text-slate-500')}`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          <div>
             <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-600'}`}>
                <Mic size={16} /> Preferred Voice
             </label>
             <select
                value={settings.selectedVoiceURI || ''}
                onChange={(e) => handleChange('selectedVoiceURI', e.target.value || null)}
                className={`w-full p-3 rounded-xl appearance-none outline-none ${settings.highContrast ? 'bg-gray-800 text-white border border-gray-600 focus:border-yellow-400' : 'bg-slate-100 text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
             >
                 <option value="">Auto-detect (Recommended)</option>
                 {filteredVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}
             </select>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className={`text-sm font-semibold flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-600'}`}>
                <Gauge size={16} /> Voice Speed
              </label>
              <span className={`text-sm font-mono ${settings.highContrast ? 'text-yellow-400' : 'text-slate-500'}`}>{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range" min="0.5" max="2.0" step="0.1" value={settings.rate}
              onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${settings.highContrast ? 'bg-gray-700 accent-yellow-400' : 'bg-slate-200 accent-blue-600'}`}
            />
          </div>

          <button
            onClick={handleTestVoice}
            className={`w-full py-3 rounded-xl font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 border ${settings.highContrast ? 'bg-gray-800 text-yellow-400 border-yellow-400' : 'bg-slate-100 text-blue-700 border-slate-200 hover:bg-slate-200'}`}
          >
            <PlayCircle size={20} /> Test Voice Output
          </button>
        </div>

        <button
          onClick={handleClose}
          className={`w-full mt-6 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-colors shadow-lg ${settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white shadow-blue-200'}`}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};