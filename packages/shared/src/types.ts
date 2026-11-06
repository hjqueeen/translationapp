import type { LanguageCode } from './languages';

export type ParticipantRole = 'speaker' | 'listener';

export interface RoomRecord {
  code: string;
  livekitRoom: string;
  createdAt: number;
  speakerIdentity: string;
  /** language -> listener count */
  listenersByLanguage: Partial<Record<LanguageCode, number>>;
}

export interface CreateRoomResponse {
  code: string;
  token: string;
  livekitUrl: string;
  role: 'speaker';
  identity: string;
  roomName: string;
}

export interface JoinRoomRequest {
  language: LanguageCode;
  displayName?: string;
}

export interface JoinRoomResponse {
  code: string;
  token: string;
  livekitUrl: string;
  role: 'listener';
  identity: string;
  roomName: string;
  language: LanguageCode;
}

export interface LanguagesResponse {
  source: 'ko';
  languages: Array<{
    code: LanguageCode;
    label: string;
    nativeLabel: string;
  }>;
}

export interface LiveKitParticipantMeta {
  role: ParticipantRole;
  language?: LanguageCode;
}
