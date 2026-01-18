// Next.js 커스텀 서버 (Socket.IO 통합)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 방 관리 (메모리 기반, 프로덕션에서는 Redis 등 사용 권장)
const rooms = new Map();
const users = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 서버 초기화
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // 번역 함수 (간단한 예시, 실제로는 API 라우트 사용)
  const translateAudio = async (audioBuffer, targetLanguage) => {
    // 실제 구현에서는 /api/translate 엔드포인트를 호출
    const response = await fetch(`http://localhost:${port}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: Buffer.from(audioBuffer).toString('base64'),
        language: targetLanguage,
      }),
    });
    return await response.json();
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 방 입장
    socket.on('join-room', (data) => {
      const { roomId, user } = data;
      
      // 방 생성 또는 조회
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: [],
          createdAt: new Date(),
        });
      }
      
      const room = rooms.get(roomId);
      const existingUserIndex = room.users.findIndex(u => u.id === user.id);
      
      if (existingUserIndex >= 0) {
        room.users[existingUserIndex] = user;
      } else {
        room.users.push(user);
      }
      
      users.set(user.id, user);
      rooms.set(roomId, room);
      
      socket.join(roomId);
      socket.emit('room-joined', { room, user });
      socket.to(roomId).emit('user-joined', { user, room });
      
      console.log(`User ${user.id} joined room ${roomId}`);
    });

    // 방 퇴장
    socket.on('leave-room', (data) => {
      const { roomId, userId } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        room.users = room.users.filter(u => u.id !== userId);
        users.delete(userId);
        
        if (room.users.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, room);
        }
      }
      
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { userId, room: rooms.get(roomId) });
      
      console.log(`User ${userId} left room ${roomId}`);
    });

    // 역할 변경
    socket.on('role-changed', (data) => {
      const { roomId, userId, role } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        const user = room.users.find(u => u.id === userId);
        if (user) {
          user.role = role;
          socket.to(roomId).emit('role-changed', { userId, role, room });
        }
      }
    });

    // 언어 변경
    socket.on('language-changed', (data) => {
      const { roomId, userId, language } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        const user = room.users.find(u => u.id === userId);
        if (user) {
          user.language = language;
          socket.to(roomId).emit('language-changed', { userId, language });
        }
      }
    });

    // 오디오 청크 수신 (Speaker가 보냄)
    socket.on('audio-chunk', async (data) => {
      const { roomId, userId, audioChunk } = data;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      // 방의 모든 Listener에게 번역된 오디오 전송
      const listeners = room.users.filter(u => u.role === 'listener' && u.language);
      
      // 각 Listener의 언어로 번역
      for (const listener of listeners) {
        if (!listener.language) continue;
        
        try {
          // Base64 문자열을 Buffer로 변환
          const audioBuffer = Buffer.from(audioChunk, 'base64');
          
          // FormData 생성
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('audio', audioBuffer, { filename: 'audio.webm', contentType: 'audio/webm' });
          formData.append('language', listener.language);
          
          // 번역 API 호출
          const response = await fetch(`http://localhost:${port}/api/translate`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Translation failed: ${errorText}`);
          }
          
          const result = await response.json();
          
          // Base64를 Buffer로 변환
          const translatedAudioBuffer = Buffer.from(result.translatedAudio, 'base64');
          
          // 해당 Listener에게 번역된 오디오 전송 (숫자 배열로 변환)
          io.to(listener.id).emit('translated-audio', {
            audioData: Array.from(new Uint8Array(translatedAudioBuffer)),
            text: result.translatedText,
            originalText: result.originalText,
            sourceLanguage: 'ko',
            targetLanguage: listener.language,
            timestamp: Date.now(),
          });
          
          // 번역된 텍스트도 전송
          io.to(listener.id).emit('translated-text', {
            originalText: result.originalText,
            translatedText: result.translatedText,
            sourceLanguage: 'ko',
            targetLanguage: listener.language,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Translation error:', error);
          socket.emit('error', { message: '번역 중 오류가 발생했습니다: ' + error.message });
        }
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
