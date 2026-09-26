import { TextChunk, TextStats } from '../types/tts';

/**
 * Counts Hindi & alphanumeric words accurately in a text string.
 */
export function countHindiWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Match contiguous non-whitespace sequences
  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0 && !/^[\p{P}\p{S}]+$/u.test(t));
  return tokens.length;
}

/**
 * Calculates detailed statistics for massive Hindi text.
 */
export function calculateTextStats(text: string, wordsPerMinute = 140, chunkSizeWords = 250): TextStats {
  if (!text || !text.trim()) {
    return {
      words: 0,
      characters: 0,
      sentences: 0,
      estimatedMinutes: 0,
      chunkCount: 0,
    };
  }

  const words = countHindiWords(text);
  const characters = text.length;

  // Split on Hindi purna viram '।' or ? or ! or newline
  const sentences = text
    .split(/[।?!;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2).length;

  const estimatedMinutes = Math.max(1, Math.round((words / wordsPerMinute) * 10) / 10);
  const chunkCount = Math.max(1, Math.ceil(words / chunkSizeWords));

  return {
    words,
    characters,
    sentences,
    estimatedMinutes,
    chunkCount,
  };
}

/**
 * Chunks massive Hindi text into coherent speech units (preserving sentences and paragraphs).
 * Even if text has 100,000 words, this creates an organized sequence of 200-400 word chunks.
 */
export function chunkHindiText(text: string, targetChunkWords = 250): TextChunk[] {
  if (!text || !text.trim()) return [];

  // Normalize newlines
  const normalized = text.replace(/\r\n/g, '\n').trim();

  // Split into paragraphs first
  const rawParagraphs = normalized.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const chunks: TextChunk[] = [];
  let currentChunkText = '';
  let currentWordCount = 0;
  let chunkIndex = 1;

  for (const para of rawParagraphs) {
    const paraWords = countHindiWords(para);

    // If adding this paragraph exceeds targetChunkWords and we already have words, commit current chunk
    if (currentWordCount > 0 && currentWordCount + paraWords > targetChunkWords * 1.3) {
      chunks.push({
        id: chunkIndex++,
        text: currentChunkText.trim(),
        wordCount: currentWordCount,
        charCount: currentChunkText.length,
        status: 'idle',
      });
      currentChunkText = '';
      currentWordCount = 0;
    }

    // If single paragraph is itself gigantic (> 1.5x targetChunkWords), break it down by sentences
    if (paraWords > targetChunkWords * 1.5) {
      // Split by Hindi sentences ending in । ? ! or .
      const sentenceRegex = /([^।?!.\n]+[।?!.]*)/g;
      const sentences = para.match(sentenceRegex) || [para];

      for (const sent of sentences) {
        const sentWords = countHindiWords(sent);
        if (currentWordCount > 0 && currentWordCount + sentWords > targetChunkWords) {
          chunks.push({
            id: chunkIndex++,
            text: currentChunkText.trim(),
            wordCount: currentWordCount,
            charCount: currentChunkText.length,
            status: 'idle',
          });
          currentChunkText = '';
          currentWordCount = 0;
        }
        currentChunkText += (currentChunkText ? ' ' : '') + sent.trim();
        currentWordCount += sentWords;
      }
    } else {
      currentChunkText += (currentChunkText ? '\n\n' : '') + para.trim();
      currentWordCount += paraWords;
    }
  }

  // Push remainder
  if (currentChunkText.trim().length > 0) {
    chunks.push({
      id: chunkIndex++,
      text: currentChunkText.trim(),
      wordCount: currentWordCount,
      charCount: currentChunkText.length,
      status: 'idle',
    });
  }

  return chunks;
}
