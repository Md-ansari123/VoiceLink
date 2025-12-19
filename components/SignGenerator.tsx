import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Hand, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { AppSettings, Language } from '../types';

interface SignGeneratorProps {
  text: string;
  settings: AppSettings;
}

export const SignGenerator: React.FC<SignGeneratorProps> = ({ text, settings }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text || !settings.signGenerationEnabled) return;

    const generateSign = async () => {
      setLoading(true);
      setError(null);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A clear, professional instructional illustration of the American Sign Language (ASL) sign for the word or phrase: "${text}". The background should be a clean, neutral studio setting. Focus on hands and upper body. High quality, medical-grade clarity.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
          setImageUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        } else {
          setError("Could not visualize sign.");
        }
      } catch (err) {
        console.error("Sign generation error:", err);
        setError("AI Visualization failed.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(generateSign, 500); // Debounce to prevent over-generation
    return () => clearTimeout(timer);
  }, [text, settings.signGenerationEnabled]);

  if (!settings.signGenerationEnabled) return null;

  return (
    <div className={`
      mt-2 rounded-xl overflow-hidden border-2 transition-all duration-500
      ${settings.highContrast ? 'border-yellow-400 bg-black' : 'border-blue-100 bg-white'}
      ${loading ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}
    `}>
      <div className="p-2 flex items-center justify-between border-b bg-slate-50/50">
        <span className="text-[10px] font-black uppercase flex items-center gap-1 opacity-60">
          <Hand size={12} /> Sign Translation
        </span>
        {loading && <Loader2 size={12} className="animate-spin text-blue-500" />}
      </div>
      
      <div className="aspect-square relative flex items-center justify-center bg-slate-900 min-h-[160px]">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="text-blue-400 animate-pulse" size={32} />
            <span className="text-xs font-bold text-white/50">Visualizing...</span>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={`Sign for ${text}`} className="w-full h-full object-cover animate-pop" />
        ) : error ? (
          <div className="flex flex-col items-center p-4 text-center">
             <AlertCircle className="text-rose-400 mb-1" size={24} />
             <span className="text-[10px] text-white/50">{error}</span>
          </div>
        ) : (
          <span className="text-xs text-white/30 italic">Sign will appear here</span>
        )}
      </div>
    </div>
  );
};