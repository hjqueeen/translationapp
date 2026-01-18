import { NextRequest, NextResponse } from 'next/server';
import { translateAudio } from '@/lib/ai/translation';
import { SupportedLanguage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const targetLanguage = formData.get('language') as SupportedLanguage;

    if (!audioFile || !targetLanguage) {
      return NextResponse.json(
        { error: 'Audio file and target language are required' },
        { status: 400 }
      );
    }

    // File을 ArrayBuffer로 변환
    const arrayBuffer = await audioFile.arrayBuffer();

    // 번역 수행
    const result = await translateAudio(arrayBuffer, targetLanguage);

    // ArrayBuffer를 Base64로 변환하여 JSON으로 전송
    const base64Audio = Buffer.from(result.translatedAudio).toString('base64');

    return NextResponse.json({
      translatedAudio: base64Audio,
      translatedText: result.translatedText,
      originalText: result.originalText,
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
