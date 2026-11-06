import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import {
  TARGET_LANGUAGES,
  SOURCE_LANGUAGE,
  isLanguageCode,
  isValidRoomCode,
  normalizeRoomCode,
  type CreateRoomResponse,
  type JoinRoomResponse,
  type LanguagesResponse,
} from '@translation/shared';
import { config } from './config.js';
import { addListener, createRoom, getRoom } from './rooms.js';
import { createParticipantToken } from './tokens.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Allow POST with Content-Type: application/json and an empty body.
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (req, body, done) => {
    if (!body || body === '') {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

app.get('/health', async () => ({ ok: true }));

app.get('/languages', async (): Promise<LanguagesResponse> => ({
  source: SOURCE_LANGUAGE,
  languages: TARGET_LANGUAGES,
}));

app.post('/rooms', async (_req, reply): Promise<CreateRoomResponse> => {
  const room = createRoom();
  const token = await createParticipantToken({
    roomName: room.livekitRoom,
    identity: room.speakerIdentity,
    role: 'speaker',
    canPublish: true,
  });

  // Best-effort: wake translation agent for this room.
  void fetch(config.agentDispatchUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roomName: room.livekitRoom, code: room.code }),
  }).catch((err) => {
    app.log.warn({ err }, 'Failed to dispatch translation agent');
  });

  return {
    code: room.code,
    token,
    livekitUrl: config.livekitUrl,
    role: 'speaker',
    identity: room.speakerIdentity,
    roomName: room.livekitRoom,
  };
});

const joinBodySchema = z.object({
  language: z.string(),
  displayName: z.string().max(40).optional(),
});

app.post<{ Params: { code: string } }>('/rooms/:code/join', async (req, reply) => {
  const code = normalizeRoomCode(req.params.code);
  if (!isValidRoomCode(code)) {
    return reply.code(400).send({ error: 'Invalid room code' });
  }

  const room = getRoom(code);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  const parsed = joinBodySchema.safeParse(req.body);
  if (!parsed.success || !isLanguageCode(parsed.data.language)) {
    return reply.code(400).send({ error: 'Invalid language' });
  }

  const language = parsed.data.language;
  addListener(code, language);

  const identity = `listener-${language}-${Date.now().toString(36)}`;
  const token = await createParticipantToken({
    roomName: room.livekitRoom,
    identity,
    role: 'listener',
    language,
    canPublish: false,
  });

  const response: JoinRoomResponse = {
    code: room.code,
    token,
    livekitUrl: config.livekitUrl,
    role: 'listener',
    identity,
    roomName: room.livekitRoom,
    language,
  };
  return response;
});

app.get<{ Params: { code: string } }>('/rooms/:code', async (req, reply) => {
  const room = getRoom(req.params.code);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }
  return {
    code: room.code,
    roomName: room.livekitRoom,
    createdAt: room.createdAt,
    listenersByLanguage: room.listenersByLanguage,
  };
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`API listening on http://0.0.0.0:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
