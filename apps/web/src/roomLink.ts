import { normalizeRoomCode, isValidRoomCode } from '@translation/shared';

/**
 * QR / share payload for joining a room.
 * Uses a web URL when origin is available so phone cameras can open the site.
 * Falls back to the same deep-link scheme as the mobile app.
 */
export function buildRoomJoinLink(code: string, origin?: string): string {
  const normalized = normalizeRoomCode(code);
  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (base) {
    return `${base.replace(/\/$/, '')}/?code=${encodeURIComponent(normalized)}`;
  }

  return `sermon-interp://join?code=${encodeURIComponent(normalized)}`;
}

/**
 * Extract a room code from typed input, a deep link, or QR scan data.
 * Accepts: plain code, ?code=, sermon-interp://join?code=, .../join/CODE
 */
export function parseRoomCodeFromPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalizedDirect = normalizeRoomCode(trimmed);
  if (isValidRoomCode(normalizedDirect)) {
    return normalizedDirect;
  }

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('code') ?? url.searchParams.get('join');
    if (fromQuery) {
      const code = normalizeRoomCode(fromQuery);
      return isValidRoomCode(code) ? code : null;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    const joinIdx = parts.findIndex((p) => p.toLowerCase() === 'join');
    if (joinIdx >= 0 && parts[joinIdx + 1]) {
      const code = normalizeRoomCode(parts[joinIdx + 1]);
      return isValidRoomCode(code) ? code : null;
    }
  } catch {
    // not a URL
  }

  const match = trimmed.toUpperCase().match(/[A-Z0-9]{6}/);
  if (match && isValidRoomCode(match[0])) {
    return match[0];
  }

  return null;
}
