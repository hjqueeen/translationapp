'use client';

import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { socketClient } from '@/lib/socket/client';
import { useRoomStore } from '@/lib/store/roomStore';
import { SupportedLanguage, TranslatedText } from '@/types';
import LanguageSelector from './LanguageSelector';

export default function ListenerPanel() {
  const { currentUser, updateUserLanguage } = useRoomStore();
  const { playAudio } = useAudioPlayer();
  const [translatedTexts, setTranslatedTexts] = useState<TranslatedText[]>([]);
  const [currentText, setCurrentText] = useState<TranslatedText | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'listener') return;

    // 번역된 오디오 수신
    const handleTranslatedAudio = async (data: {
      audioData: number[] | ArrayBuffer | string;
      text: string;
      originalText: string;
      targetLanguage: SupportedLanguage;
    }) => {
      try {
        // ArrayBuffer로 변환
        let audioBuffer: ArrayBuffer;
        
        if (Array.isArray(data.audioData)) {
          // 숫자 배열인 경우
          audioBuffer = new Uint8Array(data.audioData).buffer;
        } else if (typeof data.audioData === 'string') {
          // Base64 문자열인 경우
          const binaryString = atob(data.audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        } else {
          // 이미 ArrayBuffer인 경우
          audioBuffer = data.audioData;
        }

        // 오디오 재생
        await playAudio(audioBuffer);
      } catch (error) {
        console.error('Audio playback error:', error);
      }
    };

    // 번역된 텍스트 수신
    const handleTranslatedText = (data: TranslatedText) => {
      setCurrentText(data);
      setTranslatedTexts((prev) => [data, ...prev].slice(0, 10)); // 최근 10개만 유지
    };

    socketClient.on('translated-audio', handleTranslatedAudio);
    socketClient.on('translated-text', handleTranslatedText);

    return () => {
      socketClient.off('translated-audio', handleTranslatedAudio);
      socketClient.off('translated-text', handleTranslatedText);
    };
  }, [currentUser, playAudio]);

  const handleLanguageChange = (language: SupportedLanguage) => {
    updateUserLanguage(language);
    socketClient.changeLanguage(language);
  };

  if (!currentUser || currentUser.role !== 'listener') return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">듣는 사람</h2>

      <LanguageSelector
        selectedLanguage={currentUser.language || 'en'}
        onLanguageChange={handleLanguageChange}
      />

      {/* 현재 번역 텍스트 */}
      {currentText && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-gray-600 mb-2">원문 (한국어):</p>
          <p className="text-gray-800 mb-4">{currentText.originalText}</p>
          <p className="text-sm text-gray-600 mb-2">번역:</p>
          <p className="text-lg font-semibold text-indigo-700">
            {currentText.translatedText}
          </p>
        </div>
      )}

      {/* 번역 히스토리 */}
      {translatedTexts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">번역 히스토리</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {translatedTexts.map((text, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg text-sm"
              >
                <p className="text-gray-600">{text.originalText}</p>
                <p className="text-gray-800 font-medium mt-1">
                  {text.translatedText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!currentText && (
        <div className="mt-6 text-center text-gray-500">
          <p>번역된 음성을 기다리는 중...</p>
        </div>
      )}
    </div>
  );
}
