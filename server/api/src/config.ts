import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });
dotenv.config();

function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (value == null || value.trim() === '') return fallback;
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  livekitUrl: env('LIVEKIT_URL', 'ws://localhost:7880'),
  livekitApiKey: env('LIVEKIT_API_KEY', 'devkey'),
  livekitApiSecret: env('LIVEKIT_API_SECRET', 'secret'),
  agentDispatchUrl: env('AGENT_DISPATCH_URL', 'http://127.0.0.1:8790/dispatch'),
};
