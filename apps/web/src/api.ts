import type {
  CreateRoomResponse,
  JoinRoomResponse,
  LanguageCode,
  LanguagesResponse,
} from '@translation/shared';
import { API_URL } from './config';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function fetchLanguages() {
  return request<LanguagesResponse>('/languages');
}

export function createRoom() {
  return request<CreateRoomResponse>('/rooms', {
    method: 'POST',
    body: '{}',
  });
}

export function joinRoom(code: string, language: LanguageCode, displayName?: string) {
  return request<JoinRoomResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    body: JSON.stringify({ language, displayName }),
  });
}
