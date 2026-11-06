import {
  generateRoomCode,
  normalizeRoomCode,
  type LanguageCode,
  type RoomRecord,
} from '@translation/shared';

const rooms = new Map<string, RoomRecord>();

export function createRoom(): RoomRecord {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room: RoomRecord = {
    code,
    livekitRoom: `sermon-${code}`,
    createdAt: Date.now(),
    speakerIdentity: `speaker-${code}`,
    listenersByLanguage: {},
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomRecord | undefined {
  return rooms.get(normalizeRoomCode(code));
}

export function addListener(code: string, language: LanguageCode): RoomRecord | undefined {
  const room = getRoom(code);
  if (!room) return undefined;
  room.listenersByLanguage[language] = (room.listenersByLanguage[language] ?? 0) + 1;
  return room;
}

export function getActiveLanguages(code: string): LanguageCode[] {
  const room = getRoom(code);
  if (!room) return [];
  return (Object.entries(room.listenersByLanguage) as [LanguageCode, number][])
    .filter(([, count]) => count > 0)
    .map(([lang]) => lang);
}

export function listRooms(): RoomRecord[] {
  return [...rooms.values()];
}
