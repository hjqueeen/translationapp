'use client';

import { useEffect, useRef, useState } from 'react';
import { parseRoomCodeFromPayload } from '@/src/roomLink';

interface ScanScreenProps {
  onBack: () => void;
  onScanned: (code: string) => void;
}

export default function ScanScreen({ onBack, onScanned }: ScanScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const lockedRef = useRef(false);
  const regionId = 'room-qr-reader';

  useEffect(() => {
    let cancelled = false;
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;

    const start = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        const instance = new Html5Qrcode(regionId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scanner = instance;

        await instance.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (lockedRef.current || cancelled) return;
            const code = parseRoomCodeFromPayload(decoded);
            if (!code) {
              setError('유효한 방 QR이 아닙니다. 다시 시도하세요.');
              return;
            }
            lockedRef.current = true;
            setError(null);
            void instance
              .stop()
              .catch(() => undefined)
              .finally(() => {
                if (!cancelled) onScanned(code);
              });
          },
          () => {
            // ignore frame-level scan misses
          },
        );
        if (!cancelled) setStarting(false);
      } catch (err) {
        if (!cancelled) {
          setStarting(false);
          setError(
            err instanceof Error
              ? err.message
              : '카메라를 시작할 수 없습니다. HTTPS 또는 localhost에서 권한을 확인하세요.',
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }
    };
  }, [onScanned]);

  return (
    <main className="min-h-screen bg-[#14231C] px-6 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-[#F0D5C4]"
        >
          ← Back
        </button>

        <h1 className="mb-2 text-2xl font-bold">Scan room QR</h1>
        <p className="mb-6 text-sm text-[#D5E5DD]">
          방 QR 코드를 카메라 프레임 안에 맞춰 주세요.
        </p>

        <div className="overflow-hidden rounded border border-[#1F5A45] bg-black">
          <div id={regionId} />
        </div>

        {starting ? (
          <p className="mt-4 text-center text-sm text-[#D5E5DD]">카메라 시작 중…</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-[#FFB4B4]">{error}</p> : null}
      </div>
    </main>
  );
}
