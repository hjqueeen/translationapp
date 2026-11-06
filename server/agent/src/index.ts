import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { config } from './config.js';
import { dispatchRoom, shutdownAll } from './roomSession.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get('/health', async () => ({
  ok: true,
  openai: Boolean(config.openaiApiKey),
}));

const dispatchSchema = z.object({
  roomName: z.string().min(1),
  code: z.string().min(4),
});

app.post('/dispatch', async (req, reply) => {
  const parsed = dispatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid body' });
  }

  const { roomName, code } = parsed.data;
  try {
    await dispatchRoom(roomName, code);
    return { ok: true, roomName };
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      error: err instanceof Error ? err.message : 'Dispatch failed',
    });
  }
});

const shutdown = async () => {
  await shutdownAll();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Agent listening on http://0.0.0.0:${config.port}`);
  if (!config.openaiApiKey) {
    app.log.warn('OPENAI_API_KEY is not set — transcription/TTS will fail until configured');
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
