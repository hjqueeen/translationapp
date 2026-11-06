'use client';

import { useEffect, useState } from 'react';
import { TARGET_LANGUAGES, type LanguageCode } from '@translation/shared';
import { fetchLanguages, joinRoom } from '@/src/api';
import type { SessionParams } from '@/src/types';

interface JoinScreenProps {
  code: string;
  onBack: () => void;
  onJoined: (session: SessionParams) => void;
}

export default function JoinScreen({ code, onBack, onJoined }: JoinScreenProps) {
  const [languages, setLanguages] = useState(TARGET_LANGUAGES);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLanguages()
      .then((res) => setLanguages(res.languages))
      .catch(() => {
        // keep defaults
      });
  }, []);

  const onJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      const room = await joinRoom(code, language, displayName || undefined);
      onJoined({
        role: room.role,
        code: room.code,
        token: room.token,
        livekitUrl: room.livekitUrl,
        identity: room.identity,
        roomName: room.roomName,
        language: room.language,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 입장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F0E8] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-[#4A5C52]"
        >
          ← Back
        </button>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4A5C52]">
          Room
        </p>
        <p className="mb-6 text-3xl font-extrabold tracking-[0.2em] text-[#0B3D2E]">
          {code}
        </p>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A5C52]">
          Display name (optional)
        </label>
        <input
          className="mb-6 w-full rounded border border-[#C9C2B2] bg-white px-3.5 py-3 text-base text-[#14231C] outline-none"
          placeholder="Your name"
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4A5C52]">
          Listen in
        </p>
        <div className="mb-7 grid grid-cols-2 gap-2.5">
          {languages.map((lang) => {
            const selected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`rounded border px-3 py-3.5 text-left ${
                  selected
                    ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                    : 'border-[#C9C2B2] bg-white text-[#14231C]'
                }`}
              >
                <div className="text-lg font-bold">{lang.nativeLabel}</div>
                <div className={`text-sm ${selected ? 'text-white/80' : 'text-[#4A5C52]'}`}>
                  {lang.label}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void onJoin()}
          disabled={loading}
          className="w-full rounded bg-[#C45C26] py-4 text-center text-base font-bold text-white disabled:opacity-70"
        >
          {loading ? '입장 중…' : 'Enter room'}
        </button>

        {error ? <p className="mt-4 text-sm text-[#9B2C2C]">{error}</p> : null}
      </div>
    </main>
  );
}
