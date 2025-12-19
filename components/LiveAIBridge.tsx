
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Waves, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { soundService } from '../services/soundService';

interface LiveAIBridgeProps {
  settings: AppSettings;
  onMessage: (text: string, sender: 'user' | 'partner') => void;
  userName: string;
}

export const LiveAIBridge: React.FC<LiveAIBridgeProps> = ({ settings, onMessage, userName }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiTalking, setIsAiTalking] = useState(false);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Decoding functions for PCM data
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopAllAudio = () => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    if (isActive || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    soundService.play('social');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let currentInputTranscription = '';
      let currentOutputTranscription = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription) onMessage(currentInputTranscription, 'partner');
              if (currentOutputTranscription) onMessage(currentOutputTranscription, 'user');
              currentInputTranscription = '';
              currentOutputTranscription = '';
            }

            // Handle Audio Data
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio) {
              setIsAiTalking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsAiTalking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              stopAllAudio();
              setIsAiTalking(false);
            }
          },
          onerror: (e) => {
            console.error('Live Bridge Error', e);
            setError("Connection lost. Tap to retry.");
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.gender === 'male' ? 'Puck' : 'Kore' } },
          },
          systemInstruction: `You are a friendly communication assistant for ${userName}, an AAC user. 
            Help facilitate conversation with their partner or answer questions. 
            Be concise, patient, and use clear language. The user might be using symbols to talk, or their partner might be speaking to you.`,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Mic access required or AI offline.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    stopAllAudio();
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  const isHighContrast = settings.highContrast;

  return (
    <div className={`
      flex flex-col items-center justify-center h-full p-8 animate-enter
      ${isHighContrast ? 'bg-black text-yellow-400' : 'bg-indigo-50/50'}
    `}>
      <div className={`
        w-48 h-48 rounded-full flex items-center justify-center relative mb-8
        ${isActive ? (isAiTalking ? 'bg-indigo-600 scale-110 shadow-2xl' : 'bg-indigo-500 shadow-xl') : 'bg-slate-200'}
        transition-all duration-500
      `}>
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-20" />
        )}
        
        {isConnecting ? (
          <RefreshCcw size={64} className="animate-spin text-indigo-400" />
        ) : isActive ? (
          isAiTalking ? <Waves size={80} className="text-white animate-pulse" /> : <Mic size={80} className="text-white" />
        ) : (
          <MicOff size={80} className="text-slate-400" />
        )}
      </div>

      <div className="text-center max-w-sm">
        <h2 className={`text-2xl font-black mb-2 uppercase tracking-tighter flex items-center justify-center gap-2 ${isHighContrast ? 'text-yellow-400' : 'text-indigo-900'}`}>
          <Sparkles className="text-indigo-500" />
          {isActive ? "AI Bridge Active" : "AI Assistant"}
        </h2>
        <p className={`text-sm font-bold opacity-70 mb-8 ${isHighContrast ? 'text-white' : 'text-indigo-700/60'}`}>
          {isActive 
            ? "Gemini is listening. Talk naturally or use your symbols." 
            : isConnecting 
              ? "Establishing Neural Link..." 
              : "Let the AI help you communicate in real-time."}
        </p>

        {error && (
          <div className="flex items-center gap-2 text-rose-500 font-bold mb-6 bg-rose-50 px-4 py-2 rounded-xl">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!isActive && !isConnecting && (
          <button 
            onClick={startSession}
            className={`
              w-full py-5 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all
              ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white shadow-indigo-200'}
            `}
          >
            Connect AI Voice
          </button>
        )}

        {isActive && (
          <button 
            onClick={stopSession}
            className={`
              w-full py-5 rounded-[2rem] font-black text-xl shadow-lg active:scale-95 transition-all
              ${isHighContrast ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-white text-indigo-600 border border-indigo-100'}
            `}
          >
            End Session
          </button>
        )}
      </div>
      
      {isActive && (
        <div className="mt-12 flex gap-4">
          <div className="flex flex-col items-center">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1" />
             <span className="text-[10px] font-black uppercase opacity-50">Real-time</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
             <span className="text-[10px] font-black uppercase opacity-50">Transcription</span>
          </div>
        </div>
      )}
    </div>
  );
};
