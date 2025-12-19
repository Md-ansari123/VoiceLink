import React, { useState } from 'react';
import { User, MessageSquare, ArrowRight, Check } from 'lucide-react';
import { Language } from '../types';

interface LandingPageProps {
  onComplete: (data: { name: string; gender: 'male' | 'female'; language: Language }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2 && gender) {
      setStep(3);
    } else if (step === 3) {
      onComplete({ name, gender: gender!, language });
    }
  };

  const isMale = gender === 'male';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 animate-enter relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-2 bg-slate-100 w-full">
            <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
            />
        </div>

        <div className="text-center mb-8 mt-4">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <MessageSquare size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">VoiceLink AAC</h1>
            <p className="text-slate-500">Your voice, your way.</p>
        </div>

        <div className="space-y-6">
            
            {/* Step 1: Name */}
            {step === 1 && (
                <div className="animate-slide-up space-y-4">
                    <label className="block text-lg font-semibold text-slate-700">What is your name?</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium transition-all"
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Gender */}
            {step === 2 && (
                <div className="animate-slide-up space-y-4">
                    <label className="block text-lg font-semibold text-slate-700">Select your voice profile</label>
                    <p className="text-sm text-slate-500 -mt-2">This customizes the app theme and voice.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setGender('male')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-200 text-slate-600'}`}
                        >
                            <span className="text-4xl">👨</span>
                            <span className="font-bold">Male</span>
                        </button>
                        <button
                            onClick={() => setGender('female')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-pink-200 text-slate-600'}`}
                        >
                            <span className="text-4xl">👩</span>
                            <span className="font-bold">Female</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Language */}
            {step === 3 && (
                <div className="animate-slide-up space-y-4">
                    <label className="block text-lg font-semibold text-slate-700">Preferred Language</label>
                    <div className="space-y-3">
                        <button
                            onClick={() => setLanguage(Language.ENGLISH)}
                            className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${language === Language.ENGLISH ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700'}`}
                        >
                            <span className="font-bold">English</span>
                            {language === Language.ENGLISH && <Check size={20} />}
                        </button>
                        <button
                            onClick={() => setLanguage(Language.HINDI)}
                            className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${language === Language.HINDI ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200 text-slate-700'}`}
                        >
                            <span className="font-bold">हिंदी (Hindi)</span>
                            {language === Language.HINDI && <Check size={20} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <button
                onClick={handleNext}
                disabled={step === 1 && !name.trim() || step === 2 && !gender}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95
                    ${step === 1 && !name.trim() || step === 2 && !gender 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : (gender === 'female' && step > 1 ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white')}
                `}
            >
                {step === 3 ? 'Get Started' : 'Next'}
                {step !== 3 && <ArrowRight size={20} />}
            </button>

            {step === 1 && (
                 <p className="text-center text-xs text-slate-400 mt-4">
                    Your data is stored locally on this device.
                 </p>
            )}
        </div>
      </div>
    </div>
  );
};