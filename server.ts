import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to convert 16-bit PCM buffer to WAV buffer (24000Hz mono by default)
function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Check API status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
  });
});

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'Fenrir',
      emotion = 'storytelling',
      speakerMode = 'single', // 'single' or 'dual'
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'API_KEY_MISSING',
      });
    }

    const isDual = speakerMode === 'dual' || voice === 'dual';

    // Tailored native Hindi pronunciation and intonation directives
    const baseHindiIntonation =
      'Authentic native Hindi speaker with precise Devanagari pronunciation, natural cadence, and accurate intonation. Clear articulation of Hindi consonants and vowels. Thoughtful natural pauses at Purna Viram (।), commas, and question marks.';

    let stylePrompt = '';
    if (voice === 'Fenrir' || voice === 'charon-wise-male' || voice === 'puck-dynamic-male') {
      stylePrompt = `${baseHindiIntonation} Deep, resonant, mature adult male voice (प्रौढ़ पुरुष स्वर). Authoritative, warm, dignified, and natural baritone with rich presence.`;
    } else if (voice === 'Kore' || voice === 'zephyr-news-female' || voice === 'aoede-poetic-female') {
      stylePrompt = `${baseHindiIntonation} Elegant, warm, mature adult female voice (परिपक्व वयस्क महिला स्वर). Expressive, soothing, articulate, and crystal clear delivery.`;
    } else {
      stylePrompt = `${baseHindiIntonation} Natural and clear adult Hindi speech.`;
    }

    if (emotion === 'mature') {
      stylePrompt += ' Resonant adult baritone / contralto, deep gravitas, scholarly cadence, and profound philosophical weight.';
    } else if (emotion === 'storytelling') {
      stylePrompt += ' Engaging Hindi katha-vachak narrative style, captivating modulations, warm and immersive.';
    } else if (emotion === 'devotional') {
      stylePrompt += ' Peaceful, serene, devotional cadence, tranquil and heartfelt.';
    } else if (emotion === 'news') {
      stylePrompt += ' Formal, crisp, broadcast news anchor tone with swift and articulate clarity.';
    } else if (emotion === 'energetic') {
      stylePrompt += ' Dynamic, inspirational, upbeat cadence with passionate energy.';
    }

    // Determine prebuilt voice name
    let voiceName = 'Fenrir';
    if (['Kore', 'kore-warm-female'].includes(voice)) voiceName = 'Kore';
    else if (['Zephyr', 'zephyr-news-female'].includes(voice)) voiceName = 'Zephyr';
    else if (['Aoede', 'aoede-poetic-female'].includes(voice)) voiceName = 'Aoede';
    else if (['Charon', 'charon-wise-male'].includes(voice)) voiceName = 'Charon';
    else if (['Puck', 'puck-dynamic-male'].includes(voice)) voiceName = 'Puck';
    else if (['Fenrir', 'fenrir-adult-male'].includes(voice)) voiceName = 'Fenrir';

    let response;

    if (isDual) {
      // Dual-Speaker mode: Adult Male (Fenrir) + Adult Female (Kore)
      // Break paragraph into alternating turns or check dialog markers
      const rawText = text.trim();
      const lines = rawText.split(/\n+/).filter((l) => l.trim().length > 0);
      const partsPayload: any[] = [];

      lines.forEach((line, idx) => {
        const isMaleTurn = idx % 2 === 0;
        const speaker = isMaleTurn ? 'Purush' : 'Mahila';
        const speakerStyle = isMaleTurn
          ? `${baseHindiIntonation} Deep mature adult male baritone, clear and authoritative.`
          : `${baseHindiIntonation} Graceful mature adult female voice, warm, soothing, and articulate.`;

        partsPayload.push({
          text: line,
          speechMetadata: {
            speaker,
            style: speakerStyle,
          },
        });
      });

      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: partsPayload,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Purush',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                  },
                },
                {
                  speaker: 'Mahila',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
                },
              ],
            },
          },
        },
      });
    } else {
      // High-efficiency, pristine single adult speaker
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
    }

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const inlineData = part?.inlineData;

    if (!inlineData || !inlineData.data) {
      return res.status(502).json({
        error: 'No audio returned from Gemini TTS engine.',
        raw: candidate,
      });
    }

    const rawData = inlineData.data;
    const mimeType = inlineData.mimeType || 'audio/pcm;rate=24000';

    // If it's raw PCM, convert it to a valid WAV file so HTML5 <audio> can play it directly!
    let wavBase64 = rawData;
    let format = 'wav';

    if (mimeType.includes('pcm')) {
      const pcmBuffer = Buffer.from(rawData, 'base64');
      const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
      wavBase64 = wavBuffer.toString('base64');
    }

    return res.json({
      audioUrl: `data:audio/wav;base64,${wavBase64}`,
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
      voice,
      format,
    });
  } catch (err: any) {
    console.error('TTS Generation error:', err);
    return res.status(500).json({
      error: err?.message || 'Error occurred while generating Hindi speech.',
      code: 'SYNTHESIS_ERROR',
    });
  }
});

// Start Vite middleware or static serving
async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
