import { AccessToken } from 'livekit-server-sdk';
import type { LanguageCode, ParticipantRole } from '@translation/shared';
import { config } from './config.js';

export async function createParticipantToken(options: {
  roomName: string;
  identity: string;
  role: ParticipantRole;
  language?: LanguageCode;
  canPublish: boolean;
}): Promise<string> {
  const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
    identity: options.identity,
    metadata: JSON.stringify({
      role: options.role,
      language: options.language,
    }),
    ttl: '6h',
  });

  at.addGrant({
    roomJoin: true,
    room: options.roomName,
    canPublish: options.canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}
