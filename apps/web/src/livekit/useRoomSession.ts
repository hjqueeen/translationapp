'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteAudioTrack,
  type RemoteTrackPublication,
} from 'livekit-client';
import {
  languageTrackName,
  type LanguageCode,
  type ParticipantRole,
} from '@translation/shared';

export interface CaptionMessage {
  type: 'caption';
  language: LanguageCode;
  translated: string;
  source: string;
  ts: number;
}

interface UseRoomSessionOptions {
  token: string;
  livekitUrl: string;
  role: ParticipantRole;
  language?: LanguageCode;
}

export function useRoomSession(options: UseRoomSessionOptions) {
  const { token, livekitUrl, role, language } = options;
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [micEnabled, setMicEnabled] = useState(role === 'speaker');
  const [participantCount, setParticipantCount] = useState(1);
  const [caption, setCaption] = useState<CaptionMessage | null>(null);
  const [captionHistory, setCaptionHistory] = useState<CaptionMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioAttached, setAudioAttached] = useState(false);

  const attachLanguageTrack = useCallback((room: Room, lang: LanguageCode) => {
    const wanted = languageTrackName(lang);
    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.audioTrackPublications.values()) {
        const name = publication.trackName;
        const isWanted = name === wanted || name?.includes(wanted);
        if (!isWanted) {
          if (name?.startsWith('lang-') && publication.track) {
            publication.setSubscribed(false);
          }
          continue;
        }
        publication.setSubscribed(true);
        const track = publication.track as RemoteAudioTrack | undefined;
        if (track) {
          track.attach();
          setAudioAttached(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as CaptionMessage;
        if (msg.type !== 'caption') return;
        if (role === 'listener' && language && msg.language !== language) return;
        setCaption(msg);
        setCaptionHistory((prev) => [msg, ...prev].slice(0, 10));
      } catch {
        // ignore non-json
      }
    };

    const refreshCount = () => {
      setParticipantCount(room.numParticipants);
    };

    const onTrackSubscribed = (
      track: RemoteAudioTrack,
      publication: RemoteTrackPublication,
    ) => {
      if (track.kind !== Track.Kind.Audio) return;
      if (role !== 'listener' || !language) return;
      const name = publication.trackName;
      const wanted = languageTrackName(language);
      if (name === wanted || name?.includes(wanted)) {
        track.attach();
        setAudioAttached(true);
      } else if (name?.startsWith('lang-')) {
        publication.setSubscribed(false);
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, setConnectionState);
    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantConnected, refreshCount);
    room.on(RoomEvent.ParticipantDisconnected, refreshCount);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed as never);
    room.on(RoomEvent.TrackPublished, (publication) => {
      if (role !== 'listener' || !language) return;
      if (publication.kind !== Track.Kind.Audio) return;
      const name = publication.trackName;
      const wanted = languageTrackName(language);
      if (name === wanted || name?.includes(wanted)) {
        void publication.setSubscribed(true);
      }
    });

    (async () => {
      try {
        if (cancelled) return;
        await room.connect(livekitUrl, token, {
          autoSubscribe: role === 'speaker',
        });
        refreshCount();

        if (role === 'speaker') {
          await room.localParticipant.setMicrophoneEnabled(true);
          setMicEnabled(true);
        } else if (language) {
          for (const participant of room.remoteParticipants.values()) {
            for (const publication of participant.audioTrackPublications.values()) {
              const name = publication.trackName;
              const wanted = languageTrackName(language);
              if (name === wanted || name?.includes(wanted)) {
                await publication.setSubscribed(true);
              }
            }
          }
          attachLanguageTrack(room, language);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
        }
      }
    })();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      void room.disconnect();
      roomRef.current = null;
    };
  }, [token, livekitUrl, role, language, attachLanguageTrack]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || role !== 'listener' || !language) return;
    attachLanguageTrack(room, language);
  }, [language, role, attachLanguageTrack]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || role !== 'speaker') return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [micEnabled, role]);

  return {
    connectionState,
    micEnabled,
    toggleMic,
    participantCount,
    caption,
    captionHistory,
    error,
    audioAttached,
  };
}
