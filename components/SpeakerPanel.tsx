'use client';

import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { socketClient } from '@/lib/socket/client';
import { useRoomStore } from '@/lib/store/roomStore';

export default function SpeakerPanel() {
  const [isMicActive, setIsMicActive] = useState(false);

  const handleAudioChunk = async (chunk: ArrayBuffer) => {
    // 오디오 청크를 서버로 전송
    socketClient.sendAudioChunk(chunk);
  };

  const { startRecording: startRec, stopRecording: stopRec, error: recError } = useAudioRecorder(handleAudioChunk);

  const handleToggleRecording = async () => {
    if (isMicActive) {
      stopRec();
      useRoomStore.getState().setRecording(false);
      setIsMicActive(false);
    } else {
      try {
        await startRec();
        useRoomStore.getState().setRecording(true);
        setIsMicActive(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">말하는 사람</h2>
      
      <div className="flex flex-col items-center space-y-6">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
          isMicActive
            ? 'bg-red-500 animate-pulse shadow-lg'
            : 'bg-gray-200'
        }`}>
          <svg
            className={`w-16 h-16 ${isMicActive ? 'text-white' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <button
          onClick={handleToggleRecording}
          className={`px-8 py-4 rounded-lg font-semibold text-white transition-all ${
            isMicActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } shadow-md hover:shadow-lg`}
        >
          {isMicActive ? '녹음 중지' : '녹음 시작'}
        </button>

        {isMicActive && (
          <p className="text-sm text-gray-600 animate-pulse">말씀해 주세요...</p>
        )}

        {recError && (
          <p className="text-sm text-red-600">{recError}</p>
        )}
      </div>
    </div>
  );
}
