import OpenAI from 'openai';
import { SupportedLanguage } from '@/types';

// OpenAI 클라이언트 초기화 (환경 변수에서 API 키 가져오기)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * 음성을 텍스트로 변환 (STT - Speech to Text)
 */
export async function speechToText(audioBuffer: ArrayBuffer): Promise<string> {
  try {
    // ArrayBuffer를 File 객체로 변환
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ko', // 한국어로 고정 (말하는 사람은 한국어로 말함)
    });
    
    return transcription.text;
  } catch (error) {
    console.error('STT Error:', error);
    throw new Error('음성을 텍스트로 변환하는데 실패했습니다.');
  }
}

/**
 * 텍스트를 자연스럽게 번역 (AI 기반 번역)
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage
): Promise<string> {
  try {
    const languageNames: Record<SupportedLanguage, string> = {
      ko: 'Korean',
      en: 'English',
      zh: 'Chinese',
      ja: 'Japanese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ru: 'Russian',
      ar: 'Arabic',
      pt: 'Portuguese',
      vi: 'Vietnamese',
      th: 'Thai',
      id: 'Indonesian',
      hi: 'Hindi',
    };
    
    const targetLangName = languageNames[targetLanguage];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 또는 'gpt-4o' 더 나은 품질을 위해
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following Korean text to ${targetLangName} naturally and accurately. 
          Maintain the original meaning and context. Do not add or remove information. 
          The translation should sound natural in ${targetLangName}, not like a machine translation.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3, // 낮은 temperature로 일관성 있는 번역
    });
    
    return completion.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('Translation Error:', error);
    throw new Error('번역에 실패했습니다.');
  }
}

/**
 * 텍스트를 음성으로 변환 (TTS - Text to Speech)
 */
export async function textToSpeech(
  text: string,
  language: SupportedLanguage
): Promise<ArrayBuffer> {
  try {
    // OpenAI TTS API 사용
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd', // 또는 'tts-1' (더 빠르지만 품질 낮음)
      voice: getVoiceForLanguage(language),
      input: text,
      speed: 1.0,
    });
    
    // MP3를 ArrayBuffer로 변환
    const buffer = await mp3.arrayBuffer();
    return buffer;
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error('음성 합성에 실패했습니다.');
  }
}

/**
 * 언어에 맞는 TTS 음성 선택
 */
function getVoiceForLanguage(language: SupportedLanguage): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  // OpenAI TTS는 언어에 따라 자동으로 적절한 음성을 선택하지만,
  // 음성 타입을 선택할 수 있습니다.
  const voiceMap: Record<SupportedLanguage, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
    ko: 'nova',
    en: 'alloy',
    zh: 'nova',
    ja: 'nova',
    es: 'nova',
    fr: 'nova',
    de: 'onyx',
    ru: 'onyx',
    ar: 'nova',
    pt: 'nova',
    vi: 'nova',
    th: 'nova',
    id: 'nova',
    hi: 'nova',
  };
  
  return voiceMap[language] || 'nova';
}

/**
 * 전체 파이프라인: 음성 -> 텍스트 -> 번역 -> 음성
 */
export async function translateAudio(
  audioBuffer: ArrayBuffer,
  targetLanguage: SupportedLanguage
): Promise<{ translatedAudio: ArrayBuffer; translatedText: string; originalText: string }> {
  // 1. STT: 음성을 텍스트로
  const originalText = await speechToText(audioBuffer);
  
  // 2. 번역: 텍스트를 대상 언어로
  const translatedText = await translateText(originalText, targetLanguage);
  
  // 3. TTS: 번역된 텍스트를 음성으로
  const translatedAudio = await textToSpeech(translatedText, targetLanguage);
  
  return {
    translatedAudio,
    translatedText,
    originalText,
  };
}
