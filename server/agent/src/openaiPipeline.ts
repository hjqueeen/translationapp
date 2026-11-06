import OpenAI, { toFile } from 'openai';
import {
  TARGET_LANGUAGES,
  type LanguageCode,
} from '@translation/shared';
import { config } from './config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey || 'missing' });

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
  es: 'Spanish',
};

export function pcmToWav(pcm: Buffer, sampleRate: number, channels = 1): Buffer {
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export async function transcribeKorean(pcm: Buffer, sampleRate: number): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const wav = pcmToWav(pcm, sampleRate);
  const file = await toFile(wav, 'chunk.wav', { type: 'audio/wav' });

  const result = await openai.audio.transcriptions.create({
    file,
    model: 'gpt-4o-mini-transcribe',
    language: 'ko',
  });

  return (result.text ?? '').trim();
}

export async function translateText(
  text: string,
  targets: LanguageCode[],
): Promise<Partial<Record<LanguageCode, string>>> {
  if (targets.length === 0) return {};
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const targetList = targets
    .map((code) => `${code}: ${LANGUAGE_NAMES[code]}`)
    .join(', ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a sermon interpreter. Translate the Korean source faithfully into the requested languages. Return JSON object mapping language codes to translated strings only.',
      },
      {
        role: 'user',
        content: `Target languages: ${targetList}\n\nKorean text:\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Record<string, string>;
  const out: Partial<Record<LanguageCode, string>> = {};
  for (const code of targets) {
    if (typeof parsed[code] === 'string' && parsed[code].trim()) {
      out[code] = parsed[code].trim();
    }
  }
  return out;
}

export async function synthesizeSpeech(text: string, language: LanguageCode): Promise<Buffer> {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  // Alloy is clear for multilingual sermon listening.
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
    response_format: 'pcm',
    speed: 1.0,
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function supportedTargets(): LanguageCode[] {
  return TARGET_LANGUAGES.map((l) => l.code);
}
