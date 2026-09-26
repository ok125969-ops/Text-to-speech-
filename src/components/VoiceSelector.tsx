import React, { useState } from 'react';
import { HINDI_VOICES, EMOTIONS } from '../data/voices';
import { VoiceOption, VoiceEmotion, VoiceGender, VoiceAge } from '../types/tts';
import { Volume2, Sparkles, Sliders, CheckCircle2, UserCheck, Play, Square } from 'lucide-react';
import { speakWithBrowser, stopBrowserSpeech } from '../services/ttsService';

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onSelectVoice: (voice: VoiceOption) => void;
  selectedEmotion: VoiceEmotion;
  onSelectEmotion: (emotion: VoiceEmotion) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedEmotion,
  onSelectEmotion,
  speed,
  onSpeedChange,
  pitch,
  onPitchChange,
}) => {
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'mature' | 'dual'>('all');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const filteredVoices = HINDI_VOICES.filter((voice) => {
    if (genderFilter === 'male') return voice.gender === 'male';
    if (genderFilter === 'female') return voice.gender === 'female';
    if (genderFilter === 'mature') return voice.age === 'mature' && voice.gender !== 'dual';
    if (genderFilter === 'dual') return voice.gender === 'dual';
    return true;
  });

  const handlePreviewVoice = (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id) {
      stopBrowserSpeech();
      setPreviewingVoiceId(null);
      return;
    }

    stopBrowserSpeech();
    setPreviewingVoiceId(voice.id);

    speakWithBrowser(voice.previewText, {
      rate: speed,
      pitch: voice.gender === 'female' ? 1.1 : 0.9,
      onEnd: () => setPreviewingVoiceId(null),
      onError: () => setPreviewingVoiceId(null),
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <span>हिंदी आवाज़ चुनें (Hindi Voice Selection)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            पुरुष, महिला एवं गंभीर प्रौढ़ आवाजें (Male, Female & Adult Voices)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              genderFilter === 'all'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            सभी (All)
          </button>
          <button
            onClick={() => setGenderFilter('male')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              genderFilter === 'male'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👨 पुरुष (Male)
          </button>
          <button
            onClick={() => setGenderFilter('female')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              genderFilter === 'female'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👩 महिला (Female)
          </button>
          <button
            onClick={() => setGenderFilter('mature')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              genderFilter === 'mature'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🧔 प्रौढ़ (Adult/Mature)
          </button>
          <button
            onClick={() => setGenderFilter('dual')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              genderFilter === 'dual'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 युगल (Dual Male+Female)
          </button>
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`relative group rounded-xl p-4 cursor-pointer transition-all duration-200 border text-left ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-850 to-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Active Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 text-amber-400 flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>सक्रिय</span>
                </div>
              )}

              {/* Avatar & Name */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10 shrink-0 ${
                    isSelected ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-slate-800'
                  }`}
                >
                  <span>{voice.avatarIcon}</span>
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">
                      {voice.hindiName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        voice.gender === 'female'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          : voice.gender === 'dual'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {voice.gender === 'female'
                        ? 'महिला (Female)'
                        : voice.gender === 'dual'
                        ? 'युगल (Adult Male + Female)'
                        : 'पुरुष (Male)'}
                    </span>

                    {voice.age === 'mature' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20">
                        प्रौढ़ (Mature Adult)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tagline & Description */}
              <p className="text-xs font-medium text-amber-200/90 mt-3">
                {voice.tagline}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {voice.description}
              </p>

              {/* Preview Button */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Model: {voice.geminiVoice}
                </span>

                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(e, voice)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                    isPreviewing
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title="इस आवाज़ का नमूना सुनें"
                >
                  {isPreviewing ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>रोकें</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current text-amber-400" />
                      <span>नमूना सुनें</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mood / Style Selector */}
      <div className="border-t border-slate-800 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>वाचन भाव एवं शैली (Speaking Emotion & Style)</span>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EMOTIONS.map((emotion) => {
            const isSelected = selectedEmotion === emotion.id;
            return (
              <button
                key={emotion.id}
                onClick={() => onSelectEmotion(emotion.id as VoiceEmotion)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-lg mb-1">{emotion.icon}</div>
                <div className="text-xs font-bold text-white line-clamp-1">{emotion.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{emotion.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders: Speed & Pitch */}
      <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speed */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>वाचन गति (Speed)</span>
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
              {speed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0.5x (धीमी)</span>
            <span>1.0x (सामान्य)</span>
            <span>2.0x (तीव्र)</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>स्वर का सुर (Pitch / Base)</span>
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-mono">
              {pitch < 1 ? 'गंभीर (Deep)' : pitch > 1 ? 'ऊंचा (High)' : 'संतुलित (Normal)'}
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={pitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>गंभीर प्रौढ़ (Deep)</span>
            <span>सामान्य (Natural)</span>
            <span>सुरीला (Sharp)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
