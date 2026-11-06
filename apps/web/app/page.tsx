'use client';

import { useState } from 'react';
import { normalizeRoomCode } from '@translation/shared';
import { createRoom } from '@/src/api';
import type { SessionParams } from '@/src/types';
import JoinScreen from '@/components/JoinScreen';
import RoomScreen from '@/components/RoomScreen';

type Screen =
  | { name: 'home' }
  | { name: 'join'; code: string }
  | { name: 'room'; session: SessionParams };

export default function Home() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom();
      setScreen({
        name: 'room',
        session: {
          role: room.role,
          code: room.code,
          token: room.token,
          livekitUrl: room.livekitUrl,
          identity: room.identity,
          roomName: room.roomName,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onContinueJoin = () => {
    const normalized = normalizeRoomCode(code);
    if (normalized.length !== 6) {
      setError('6자리 방 코드를 입력하세요.');
      return;
    }
    setError(null);
    setScreen({ name: 'join', code: normalized });
  };

  if (screen.name === 'room') {
    return (
      <RoomScreen
        session={screen.session}
        onLeave={() => {
          setScreen({ name: 'home' });
          setCode('');
          setError(null);
        }}
      />
    );
  }

  if (screen.name === 'join') {
    return (
      <JoinScreen
        code={screen.code}
        onBack={() => setScreen({ name: 'home' })}
        onJoined={(session) => setScreen({ name: 'room', session })}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F0E8] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <section className="mb-9 rounded border border-[#C9C2B2] bg-[#E6E1D4] p-5">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#0B3D2E]">
            Sermon Interp
          </h1>
          <p className="text-base leading-6 text-[#4A5C52]">
            방을 열고 한 번 말하면, 청취자가 선택한 언어로 실시간 AI 통역을 듣습니다.
          </p>
        </section>

        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={loading}
          className="w-full rounded bg-[#0B3D2E] py-4 text-center text-base font-bold text-white disabled:opacity-70"
        >
          {loading ? '생성 중…' : 'Create room (speaker)'}
        </button>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#C9C2B2]" />
          <span className="text-sm font-semibold text-[#4A5C52]">or join</span>
          <div className="h-px flex-1 bg-[#C9C2B2]" />
        </div>

        <input
          className="mb-3 w-full rounded border border-[#C9C2B2] bg-white px-3.5 py-3.5 text-lg font-bold tracking-[0.3em] text-[#14231C] outline-none"
          placeholder="Room code"
          autoCapitalize="characters"
          autoCorrect="off"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          type="button"
          onClick={onContinueJoin}
          className="w-full rounded border-[1.5px] border-[#0B3D2E] py-3.5 text-center text-base font-bold text-[#0B3D2E]"
        >
          Continue
        </button>

        {error ? <p className="mt-4 text-sm text-[#9B2C2C]">{error}</p> : null}
      </div>
    </main>
  );
}
