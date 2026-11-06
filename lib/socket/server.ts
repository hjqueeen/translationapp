// Socket.IO 서버 설정
// Next.js에서는 별도의 서버 파일이 필요합니다.
// 이 파일은 server.js 또는 별도 프로세스로 실행되어야 합니다.

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { translateAudio } from '@/lib/ai/translation';
import { SupportedLanguage, SocketMessage, UserRole } from '@/types';
import {
  getOrCreateRoom,
  addUserToRoom,
  removeUserFromRoom,
  getRoom,
} from '@/lib/socket/rooms';

let io: SocketIOServer | null = null;

export function initializeSocketServer(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 방 입장
    socket.on('join-room', async (data: { roomId: string; user: { id: string; role: UserRole; language?: SupportedLanguage } }) => {
      const { roomId, user } = data;
      
      // 방에 사용자 추가
      addUserToRoom(roomId, user as any);
      socket.join(roomId);
      
      // 방 정보 전송
      const room = getRoom(roomId);
      socket.emit('room-joined', { room, user });
      
      // 다른 사용자들에게 알림
      socket.to(roomId).emit('user-joined', { user, room });
      
      console.log(`User ${user.id} joined room ${roomId}`);
    });

    // 방 퇴장
    socket.on('leave-room', (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      
      removeUserFromRoom(roomId, userId);
      socket.leave(roomId);
      
      // 다른 사용자들에게 알림
      socket.to(roomId).emit('user-left', { userId, room: getRoom(roomId) });
      
      console.log(`User ${userId} left room ${roomId}`);
    });

    // 역할 변경
    socket.on('role-changed', (data: { roomId: string; userId: string; role: UserRole }) => {
      const { roomId, userId, role } = data;
      const room = getRoom(roomId);
      
      if (room) {
        const user = room.users.find(u => u.id === userId);
        if (user) {
          user.role = role;
          socket.to(roomId).emit('role-changed', { userId, role, room });
        }
      }
    });

    // 언어 변경
    socket.on('language-changed', (data: { roomId: string; userId: string; language: SupportedLanguage }) => {
      const { roomId, userId, language } = data;
      const room = getRoom(roomId);
      
      if (room) {
        const user = room.users.find(u => u.id === userId);
        if (user) {
          user.language = language;
          socket.to(roomId).emit('language-changed', { userId, language });
        }
      }
    });

    // 오디오 청크 수신 (Speaker가 보냄)
    socket.on('audio-chunk', async (data: { roomId: string; userId: string; audioChunk: ArrayBuffer }) => {
      const { roomId, userId, audioChunk } = data;
      const room = getRoom(roomId);
      
      if (!room) return;
      
      // 방의 모든 Listener에게 번역된 오디오 전송
      const listeners = room.users.filter(u => u.role === 'listener' && u.language);
      
      // 각 Listener의 언어로 번역
      for (const listener of listeners) {
        if (!listener.language) continue;
        
        try {
          const { translatedAudio, translatedText, originalText } = await translateAudio(
            audioChunk,
            listener.language
          );
          
          // 해당 Listener에게 번역된 오디오 전송
          io!.to(listener.id).emit('translated-audio', {
            audioData: translatedAudio,
            text: translatedText,
            originalText,
            sourceLanguage: 'ko' as SupportedLanguage,
            targetLanguage: listener.language,
            timestamp: Date.now(),
          });
          
          // 번역된 텍스트도 전송
          io!.to(listener.id).emit('translated-text', {
            originalText,
            translatedText,
            sourceLanguage: 'ko' as SupportedLanguage,
            targetLanguage: listener.language,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Translation error:', error);
          socket.emit('error', { message: '번역 중 오류가 발생했습니다.' });
        }
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
