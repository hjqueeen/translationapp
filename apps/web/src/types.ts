import type { LanguageCode, ParticipantRole } from '@translation/shared';

export interface SessionParams {
  role: ParticipantRole;
  code: string;
  token: string;
  livekitUrl: string;
  identity: string;
  roomName: string;
  language?: LanguageCode;
}
