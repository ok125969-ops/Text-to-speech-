import { VoiceOption, VoiceEmotion } from '../types/tts';

// Audio Cache for rendered chunks to save bandwidth and enable instantaneous re-play
const audioCache = new Map<string, { audioUrl: string; base64: string }>();

export interface SynthesisResult {
  audioUrl: string;
  base64: string;
  source: 'gemini' | 'browser';
  duration?: number;
}

/**
 * Calls the backend Gemini TTS API to generate studio-grade Hindi audio.
 */
export async function synthesizeGeminiSpeech(
  text: string,
  voice: VoiceOption,
  emotion: VoiceEmotion
): Promise<SynthesisResult> {
  const cacheKey = `${voice.id}_${emotion}_${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    const cached = audioCache.get(cacheKey)!;
    return {
      audioUrl: cached.audioUrl,
      base64: cached.base64,
      source: 'gemini',
    };
  }

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: voice.geminiVoice,
      emotion,
      style: `${voice.tagline}. High quality native Hindi pronunciation.`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS request failed with status ${response.status}`);
  }

  const data = await response.json();
  const audioUrl = data.audioUrl;
  const base64 = data.audioBase64;

  audioCache.set(cacheKey, { audioUrl, base64 });

  return {
    audioUrl,
    base64,
    source: 'gemini',
  };
}

/**
 * Inspects all browser SpeechSynthesis voices and finds Hindi (hi-IN) voices.
 */
export function getBrowserHindiVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const allVoices = window.speechSynthesis.getVoices();
  const hindiVoices = allVoices.filter(
    v => v.lang.startsWith('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('hindi')
  );
  return hindiVoices.length > 0 ? hindiVoices : allVoices;
}

/**
 * Plays text using browser's native SpeechSynthesis (offline, unlimited words, zero latency).
 */
export function speakWithBrowser(
  text: string,
  options: {
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
    onError?: (err: any) => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onError) options.onError(new Error('SpeechSynthesis not supported'));
    return null;
  }

  window.speechSynthesis.cancel(); // Stop any pending utterances

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;

  if (options.voice) {
    utterance.voice = options.voice;
  } else {
    const hindiVoices = getBrowserHindiVoices();
    if (hindiVoices.length > 0) {
      utterance.voice = hindiVoices[0];
    }
  }

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (e) => {
    if (options.onError) options.onError(e);
  };

  if (options.onBoundary) {
    utterance.onboundary = (e) => {
      options.onBoundary!(e.charIndex);
    };
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopBrowserSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
