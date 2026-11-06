import {
  AudioFrame,
  AudioSource,
  AudioStream,
  LocalAudioTrack,
  Room,
  RoomEvent,
  Track,
  TrackKind,
  TrackPublishOptions,
  TrackSource,
  dispose,
} from '@livekit/rtc-node';
import { AccessToken } from 'livekit-server-sdk';
import {
  TARGET_LANGUAGE_CODES,
  languageTrackName,
  type LanguageCode,
} from '@translation/shared';
import { config } from './config.js';
import {
  synthesizeSpeech,
  transcribeKorean,
  translateText,
} from './openaiPipeline.js';

interface LangPublisher {
  source: AudioSource;
  track: LocalAudioTrack;
}

const activeSessions = new Map<string, RoomSession>();

async function agentToken(roomName: string): Promise<string> {
  const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
    identity: `agent-translator-${roomName}`,
    metadata: JSON.stringify({ role: 'agent' }),
    ttl: '12h',
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}

function int16ToBuffer(samples: Int16Array): Buffer {
  return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
}

export class RoomSession {
  private room = new Room();
  private publishers = new Map<LanguageCode, LangPublisher>();
  private pcmChunks: Buffer[] = [];
  private bufferedSamples = 0;
  private processing = false;
  private closed = false;
  private speakerStreamTask: Promise<void> | null = null;
  private sampleRate = config.sampleRate;

  constructor(
    readonly roomName: string,
    readonly code: string,
  ) {}

  async start() {
    const token = await agentToken(this.roomName);
    await this.room.connect(config.livekitUrl, token, {
      autoSubscribe: true,
      dynacast: false,
    });

    for (const lang of TARGET_LANGUAGE_CODES) {
      await this.ensurePublisher(lang);
    }

    this.room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (track.kind !== TrackKind.KIND_AUDIO) return;
      if (participant.identity.startsWith('agent-')) return;
      // Prefer human speaker identity; also accept any non-listener publisher.
      const meta = safeParseMeta(participant.metadata);
      if (meta?.role === 'listener') return;
      void this.attachSpeakerTrack(track);
    });

    // Attach existing speaker tracks (if speaker joined before agent).
    for (const participant of this.room.remoteParticipants.values()) {
      const meta = safeParseMeta(participant.metadata);
      if (meta?.role === 'listener') continue;
      for (const publication of participant.trackPublications.values()) {
        if (publication.track && publication.track.kind === TrackKind.KIND_AUDIO) {
          void this.attachSpeakerTrack(publication.track);
        }
      }
    }

    console.log(`[agent] joined room ${this.roomName} (code=${this.code})`);
  }

  private async ensurePublisher(language: LanguageCode) {
    if (this.publishers.has(language)) return;
    const source = new AudioSource(this.sampleRate, 1);
    const track = LocalAudioTrack.createAudioTrack(languageTrackName(language), source);
    const options = new TrackPublishOptions();
    options.source = TrackSource.SOURCE_MICROPHONE;
    await this.room.localParticipant?.publishTrack(track, options);
    this.publishers.set(language, { source, track });
  }

  private attachSpeakerTrack(track: Track) {
    if (this.speakerStreamTask) return;
    const stream = new AudioStream(track, this.sampleRate);
    this.speakerStreamTask = this.consumeSpeaker(stream);
  }

  private async consumeSpeaker(stream: AudioStream) {
    const samplesPerChunk = this.sampleRate * config.sttChunkSeconds;
    try {
      for await (const frame of stream) {
        if (this.closed) break;
        const data = frame.data;
        this.pcmChunks.push(int16ToBuffer(data));
        this.bufferedSamples += data.length;
        if (this.bufferedSamples >= samplesPerChunk && !this.processing) {
          const pcm = Buffer.concat(this.pcmChunks);
          this.pcmChunks = [];
          this.bufferedSamples = 0;
          void this.processChunk(pcm);
        }
      }
    } catch (err) {
      console.warn('[agent] speaker stream ended', err);
      this.speakerStreamTask = null;
    }
  }

  private async activeLanguages(): Promise<LanguageCode[]> {
    try {
      const res = await fetch(`${config.apiUrl}/rooms/${this.code}`);
      if (!res.ok) return TARGET_LANGUAGE_CODES;
      const body = (await res.json()) as {
        listenersByLanguage?: Partial<Record<LanguageCode, number>>;
      };
      const active = TARGET_LANGUAGE_CODES.filter(
        (lang) => (body.listenersByLanguage?.[lang] ?? 0) > 0,
      );
      // If nobody joined yet, still prepare all languages for demos.
      return active.length > 0 ? active : TARGET_LANGUAGE_CODES;
    } catch {
      return TARGET_LANGUAGE_CODES;
    }
  }

  private async processChunk(pcm: Buffer) {
    if (this.processing || this.closed) return;
    this.processing = true;
    try {
      // Skip near-silence chunks (very low energy).
      if (isMostlySilence(pcm)) {
        return;
      }

      const transcript = await transcribeKorean(pcm, this.sampleRate);
      if (!transcript || transcript.length < 2) {
        return;
      }

      console.log(`[agent] STT: ${transcript}`);
      const targets = await this.activeLanguages();
      const translations = await translateText(transcript, targets);

      await Promise.all(
        targets.map(async (lang) => {
          const text = translations[lang];
          if (!text) return;
          try {
            const pcmOut = await synthesizeSpeech(text, lang);
            await this.playPcm(lang, pcmOut);
            await this.publishCaption(lang, text, transcript);
          } catch (err) {
            console.warn(`[agent] TTS failed for ${lang}`, err);
          }
        }),
      );
    } catch (err) {
      console.warn('[agent] chunk processing failed', err);
    } finally {
      this.processing = false;
    }
  }

  private async playPcm(language: LanguageCode, pcm: Buffer) {
    const publisher = this.publishers.get(language);
    if (!publisher) return;

    const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 2);
    const frameSize = Math.floor(this.sampleRate / 100); // 10ms
    for (let offset = 0; offset < samples.length; offset += frameSize) {
      if (this.closed) return;
      const end = Math.min(offset + frameSize, samples.length);
      const slice = samples.subarray(offset, end);
      const frame = new AudioFrame(slice, this.sampleRate, 1, slice.length);
      await publisher.source.captureFrame(frame);
    }
  }

  private async publishCaption(language: LanguageCode, translated: string, source: string) {
    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: 'caption',
        language,
        translated,
        source,
        ts: Date.now(),
      }),
    );
    await this.room.localParticipant?.publishData(payload, { reliable: true });
  }

  async close() {
    this.closed = true;
    try {
      await this.room.disconnect();
    } catch {
      // ignore
    }
  }
}

function safeParseMeta(metadata?: string): { role?: string } | null {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata) as { role?: string };
  } catch {
    return null;
  }
}

function isMostlySilence(pcm: Buffer): boolean {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  if (samples.length === 0) return true;
  let sum = 0;
  const step = Math.max(1, Math.floor(samples.length / 2000));
  let count = 0;
  for (let i = 0; i < samples.length; i += step) {
    sum += Math.abs(samples[i] ?? 0);
    count += 1;
  }
  const avg = sum / Math.max(count, 1);
  return avg < 180;
}

export async function dispatchRoom(roomName: string, code: string): Promise<void> {
  const existing = activeSessions.get(roomName);
  if (existing) {
    console.log(`[agent] already active for ${roomName}`);
    return;
  }
  const session = new RoomSession(roomName, code);
  activeSessions.set(roomName, session);
  try {
    await session.start();
  } catch (err) {
    activeSessions.delete(roomName);
    await session.close();
    throw err;
  }
}

export async function shutdownAll() {
  const sessions = [...activeSessions.values()];
  activeSessions.clear();
  await Promise.all(sessions.map((s) => s.close()));
  await dispose();
}
