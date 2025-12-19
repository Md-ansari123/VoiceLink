import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, XCircle, RefreshCcw, SwitchCamera } from 'lucide-react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { AppSettings, Language } from '../types';
import { speechService } from '../services/speechService';
import { soundService } from '../services/soundService';

interface SignLanguageCameraProps {
  settings: AppSettings;
}

// Map gestures to phrases
const GESTURE_MAP: Record<string, { en: string; hi: string; emoji: string }> = {
  // Native Model Gestures
  'Thumb_Up': { en: 'Yes', hi: 'हाँ', emoji: '👍' },
  'Thumb_Down': { en: 'No', hi: 'नहीं', emoji: '👎' },
  'Open_Palm': { en: 'Hello', hi: 'नमस्ते', emoji: '👋' },
  'Victory': { en: 'Peace', hi: 'शांति', emoji: '✌️' },
  'ILoveYou': { en: 'I Love You', hi: 'मैं तुमसे प्यार करता हूँ', emoji: '🤟' },
  'Pointing_Up': { en: 'Wait', hi: 'रुको', emoji: '☝️' },
  'Closed_Fist': { en: 'Stop', hi: 'रुको', emoji: '✊' },
  
  // Custom Heuristic Gestures
  'Call_Me': { en: 'Call Phone', hi: 'फ़ोन करो', emoji: '🤙' },
  'OK_Sign': { en: 'Okay', hi: 'ठीक है', emoji: '👌' },
  'Rock': { en: 'Music', hi: 'संगीत', emoji: '🤘' }
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export const SignLanguageCamera: React.FC<SignLanguageCameraProps> = ({ settings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gestureRecognizer, setGestureRecognizer] = useState<GestureRecognizer | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing AI...');
  const [error, setError] = useState<string | null>(null);
  
  // Throttling and state tracking
  const lastSpokenTimes = useRef<Map<string, number>>(new Map());
  const lastGestureRef = useRef<string>('');
  const gestureHoldStart = useRef<number>(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatusMessage("Loading Vision Modules...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        setStatusMessage("Loading Gesture Model...");
        let recognizer: GestureRecognizer;
        const modelPath = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

        try {
            recognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
            });
        } catch (gpuError) {
            console.warn("GPU Delegate failed, falling back to CPU", gpuError);
            recognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: modelPath,
                    delegate: "CPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
        }

        setGestureRecognizer(recognizer);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load gesture model:", err);
        setError("Failed to load AI Model. Please check internet connection.");
        setLoading(false);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (gestureRecognizer && !isCameraRunning && !error) {
        enableCam();
    }
    
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [gestureRecognizer, facingMode]);

  const enableCam = async () => {
    if (!gestureRecognizer) return;
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.error("Play error", e));
                predictWebcam();
            }
        };
        setIsCameraRunning(true);
        setError(null);
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError("Failed to access camera. Please check permissions.");
    }
  };

  const handleRetry = () => {
      setError(null);
      setLoading(true);
      if (!gestureRecognizer) window.location.reload();
      else enableCam();
  };

  const handleSwitchCamera = () => {
      setIsCameraRunning(false);
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const detectCustomGestures = (landmarks: any[]): string | null => {
    const dist = (i1: number, i2: number) => {
        const x = landmarks[i1].x - landmarks[i2].x;
        const y = landmarks[i1].y - landmarks[i2].y;
        const z = (landmarks[i1].z || 0) - (landmarks[i2].z || 0);
        return Math.sqrt(x * x + y * y + z * z);
    };

    const isExtended = (tipIdx: number, baseIdx: number) => {
        return dist(0, tipIdx) > dist(0, baseIdx) * 1.2;
    };

    const indexExt = isExtended(8, 6);
    const middleExt = isExtended(12, 10);
    const ringExt = isExtended(16, 14);
    const pinkyExt = isExtended(20, 18);
    const thumbExt = isExtended(4, 2);

    // Optimized 'Rock' Detection: Index and Pinky extended, middle and ring curled
    // We allow thumb to be either extended (ILoveYou-ish) or tucked for better accuracy
    if (indexExt && pinkyExt && !middleExt && !ringExt) {
        return 'Rock';
    }

    if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) {
        return 'Call_Me';
    }

    if (dist(4, 8) < 0.06 && middleExt && ringExt && pinkyExt) {
        return 'OK_Sign';
    }
    
    return null;
  };

  const predictWebcam = async () => {
    if (!videoRef.current || !canvasRef.current || !gestureRecognizer) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastVideoTime = -1;
    
    const renderLoop = async () => {
      if (!videoRef.current) return;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        try {
            const nowInMs = Date.now();
            const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                if (facingMode === 'user') {
                  ctx.scale(-1, 1);
                  ctx.translate(-canvas.width, 0);
                }
            }

            let categoryName = '';
            let score = 0;
            let landmarks = null;

            if (results.gestures.length > 0) {
                categoryName = results.gestures[0][0].categoryName;
                score = results.gestures[0][0].score;
            }
            if (results.landmarks.length > 0) {
                landmarks = results.landmarks[0];
                const customGesture = detectCustomGestures(landmarks);
                if (customGesture) {
                    categoryName = customGesture;
                    score = 0.85;
                }

                if (ctx) {
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#FACC15"; 
                    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                        const start = landmarks[startIdx];
                        const end = landmarks[endIdx];
                        if (start && end) {
                            ctx.beginPath();
                            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                            ctx.stroke();
                        }
                    }
                    ctx.fillStyle = "#EF4444"; 
                    for (const landmark of landmarks) {
                        ctx.beginPath();
                        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }

            if (score > 0.55 && categoryName !== 'None' && categoryName !== '') {
                handleGestureOutput(categoryName);
            } else {
                lastGestureRef.current = '';
                setDetectedGesture('');
            }
            if (ctx) ctx.restore();
        } catch (e) { /* ignore */ }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  };

  /**
   * Throttled gesture handler to prevent speech spamming.
   * - 400ms hold time to confirm gesture stability.
   * - 2000ms (2s) cooldown per unique gesture before repeating speech.
   */
  const handleGestureOutput = (gestureName: string) => {
    const now = Date.now();
    const map = GESTURE_MAP[gestureName];
    if (!map) return;

    if (lastGestureRef.current !== gestureName) {
        lastGestureRef.current = gestureName;
        gestureHoldStart.current = now;
        setDetectedGesture(`${map.emoji} ...`);
    } else {
        // Only trigger if held for stability (400ms)
        if (now - gestureHoldStart.current > 400) {
            const text = settings.language === Language.HINDI ? map.hi : map.en;
            setDetectedGesture(`${map.emoji} ${text}`);

            // Per-gesture cooldown: 2 seconds
            const lastSpoken = lastSpokenTimes.current.get(gestureName) || 0;
            if (now - lastSpoken > 2000) {
                soundService.play('happy');
                speechService.speak(text, settings);
                lastSpokenTimes.current.set(gestureName, now);
            }
        }
    }
  };

  const isHighContrast = settings.highContrast;

  return (
    <div className={`
      flex flex-col h-full rounded-2xl overflow-hidden relative
      ${isHighContrast ? 'bg-black border-2 border-yellow-400' : 'bg-slate-900 shadow-xl'}
    `}>
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-start">
        <div className="text-white">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Camera size={20} className="text-rose-500" />
                Sign Camera AI
            </h2>
            <p className="text-xs opacity-70 tracking-wide">Neural sign recognition active</p>
        </div>
        <div className="flex items-center gap-2">
            {!loading && !error && (
                <button onClick={handleSwitchCamera} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
                    <SwitchCamera size={20} />
                </button>
            )}
            {loading && !error && (
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin" />
                    {statusMessage}
                </div>
            )}
        </div>
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {error ? (
            <div className="text-center p-6 text-white max-w-sm animate-enter">
                <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500">
                    <XCircle size={40} className="text-red-500" />
                </div>
                <p className="font-bold text-lg mb-2">Camera Issue</p>
                <p className="opacity-70 text-sm mb-6">{error}</p>
                <button onClick={handleRetry} className="px-6 py-3 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 mx-auto hover:bg-gray-200 transition-colors shadow-lg active:scale-95">
                    <RefreshCcw size={18} />
                    Try Again
                </button>
            </div>
        ) : (
            <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} playsInline muted />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
                {!loading && isCameraRunning && (
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-1">
                        <div className="w-4 h-4 bg-red-500 rounded-full recording-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <span className="text-[10px] font-bold text-red-500 bg-black/50 px-1 rounded">LIVE</span>
                    </div>
                )}
            </>
        )}
        
        {detectedGesture && !error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-pop w-full px-4 flex justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl text-3xl font-bold shadow-2xl flex items-center gap-4 border-l-4 border-l-rose-500">
                    {detectedGesture}
                </div>
            </div>
        )}
      </div>

      <div className={`p-4 shrink-0 overflow-x-auto no-scrollbar ${isHighContrast ? 'bg-gray-900 border-t border-yellow-400' : 'bg-white border-t border-slate-200'}`}>
         <h3 className={`text-xs font-bold uppercase mb-2 ${isHighContrast ? 'text-yellow-400' : 'text-slate-500'}`}>Supported Signs</h3>
         <div className="flex gap-3">
            {Object.entries(GESTURE_MAP).map(([key, val]) => (
                <div key={key} className={`shrink-0 flex flex-col items-center p-2 rounded-lg w-20 transition-all duration-300 ${detectedGesture.includes(val.emoji) ? (isHighContrast ? 'bg-yellow-400 text-black' : 'bg-rose-100 border-rose-200 ring-2 ring-rose-500 scale-105') : (isHighContrast ? 'bg-gray-800' : 'bg-slate-50 border border-slate-100')}`}>
                    <span className="text-2xl mb-1">{val.emoji}</span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${isHighContrast && !detectedGesture.includes(val.emoji) ? 'text-white' : 'text-slate-600'}`}>
                        {settings.language === Language.HINDI ? val.hi : val.en}
                    </span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};