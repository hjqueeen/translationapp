'use client';

import { useMemo } from 'react';
import { ConnectionState } from 'livekit-client';
import { useRoomSession } from '@/src/livekit/useRoomSession';
import type { SessionParams } from '@/src/types';

interface RoomScreenProps {
  session: SessionParams;
  onLeave: () => void;
}

export default function RoomScreen({ session, onLeave }: RoomScreenProps) {
  const { role, code, token, livekitUrl, language } = session;
  const live = useRoomSession({ token, livekitUrl, role, language });

  const statusLabel = useMemo(() => {
    switch (live.connectionState) {
      case ConnectionState.Connected:
        return 'Connected';
      case ConnectionState.Connecting:
        return 'Connecting…';
      case ConnectionState.Reconnecting:
        return 'Reconnecting…';
      default:
        return 'Disconnected';
    }
  }, [live.connectionState]);

  return (
    <main className="min-h-screen bg-[#F3F0E8] px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col">
        <header className="mb-5 rounded bg-[#0B3D2E] p-5 text-white">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#F0D5C4]">
            {role === 'speaker' ? 'Speaking' : 'Listening'}
          </p>
          <p className="mb-2 text-4xl font-extrabold tracking-[0.2em]">{code}</p>
          <p className="text-sm text-[#D5E5DD]">
            {statusLabel} · {live.participantCount} in room
            {role === 'listener' && language ? ` · ${language.toUpperCase()}` : ''}
          </p>
        </header>

        <section className="flex-1 rounded border border-[#C9C2B2] bg-white p-5">
          {role === 'speaker' ? (
            <>
              <h2 className="mb-2 text-xl font-bold text-[#14231C]">
                Share this code with listeners
              </h2>
              <p className="mb-5 text-[15px] leading-6 text-[#4A5C52]">
                마이크 오디오가 AI 통역으로 전달됩니다. 청취자는 언어를 고르고 번역된
                음성 트랙을 듣습니다.
              </p>
              <button
                type="button"
                onClick={() => void live.toggleMic()}
                className={`w-full rounded py-3.5 text-center text-[15px] font-bold text-white ${
                  live.micEnabled ? 'bg-[#1F5A45]' : 'bg-[#9B2C2C]'
                }`}
              >
                {live.micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-2 text-xl font-bold text-[#14231C]">Live interpretation</h2>
              <p className="mb-5 text-[15px] leading-6 text-[#4A5C52]">
                {live.audioAttached
                  ? 'Translated audio is attached. Keep this screen open.'
                  : 'Waiting for translated audio track…'}
              </p>

              {live.caption ? (
                <div className="rounded bg-[#E6E1D4] p-3.5">
                  <p className="mb-1.5 text-xs font-bold uppercase text-[#4A5C52]">Caption</p>
                  <p className="mb-2.5 text-lg font-semibold leading-7 text-[#14231C]">
                    {live.caption.translated}
                  </p>
                  <p className="text-sm text-[#4A5C52]">{live.caption.source}</p>
                </div>
              ) : (
                <p className="text-sm text-[#4A5C52]">
                  Captions will appear as speech is translated.
                </p>
              )}

              {live.captionHistory.length > 1 ? (
                <div className="mt-5 max-h-48 space-y-2 overflow-y-auto">
                  <p className="text-xs font-bold uppercase text-[#4A5C52]">Recent</p>
                  {live.captionHistory.slice(1).map((item) => (
                    <div key={item.ts} className="rounded bg-[#F3F0E8] p-3 text-sm">
                      <p className="text-[#4A5C52]">{item.source}</p>
                      <p className="mt-1 font-medium text-[#14231C]">{item.translated}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>

        {live.error ? <p className="mt-3 text-sm text-[#9B2C2C]">{live.error}</p> : null}

        <button
          type="button"
          onClick={onLeave}
          className="mt-4 w-full rounded border border-[#C9C2B2] py-3.5 text-center font-bold text-[#14231C]"
        >
          Leave room
        </button>
      </div>
    </main>
  );
}
