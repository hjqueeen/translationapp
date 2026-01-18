import { useRef, useCallback, useState } from 'react';

interface UseAudioPlayerReturn {
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      // 기존 재생 중지
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }

      // AudioContext 생성 (없는 경우)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // ArrayBuffer를 AudioBuffer로 디코딩
      const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));

      // AudioBufferSourceNode 생성
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioContext.destination);

      // 재생 완료 이벤트
      sourceNode.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      sourceNodeRef.current = sourceNode;
      setIsPlaying(true);

      // 재생 시작
      sourceNode.start(0);
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    isPlaying,
  };
}
