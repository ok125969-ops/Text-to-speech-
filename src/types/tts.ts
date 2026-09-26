export type EngineType = 'gemini' | 'browser';

export type VoiceGender = 'male' | 'female' | 'dual';

export type VoiceAge = 'adult' | 'mature' | 'young';

export type VoiceEmotion = 'storytelling' | 'mature' | 'devotional' | 'news' | 'energetic' | 'neutral';

export interface VoiceOption {
  id: string;
  name: string;
  hindiName: string;
  gender: VoiceGender;
  age: VoiceAge;
  tagline: string;
  description: string;
  geminiVoice: string;
  browserVoiceMatch?: string[];
  recommendedStyle: VoiceEmotion;
  previewText: string;
  avatarIcon: string;
  color: string;
}

export interface TextChunk {
  id: number;
  text: string;
  wordCount: number;
  charCount: number;
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'error';
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  error?: string;
}

export interface TTSConfig {
  engine: EngineType;
  voiceId: string;
  emotion: VoiceEmotion;
  speed: number;
  pitch: number;
  chunkSizeWords: number;
  autoPlayNext: boolean;
}

export interface TextStats {
  words: number;
  characters: number;
  sentences: number;
  estimatedMinutes: number;
  chunkCount: number;
}
