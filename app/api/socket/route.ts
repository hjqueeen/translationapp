import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Room, User, SocketMessage } from '@/types';

// Next.js App Router에서는 직접 Socket.IO 서버를 만들 수 없으므로
// 별도의 서버 파일이 필요합니다.
// 대신 API 라우트를 통해 WebSocket 연결을 관리합니다.

// 임시로 메모리에 방 정보 저장 (프로덕션에서는 Redis 등 사용 권장)
const rooms = new Map<string, Room>();
const users = new Map<string, User>();

export async function GET(request: NextRequest) {
  // WebSocket 연결은 별도 서버 파일에서 처리
  return new Response('WebSocket server endpoint', { status: 200 });
}

// 방 생성/조회 헬퍼 함수
export function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      users: [],
      createdAt: new Date(),
    });
  }
  return rooms.get(roomId)!;
}

export function getUser(userId: string): User | undefined {
  return users.get(userId);
}

export function addUserToRoom(roomId: string, user: User): void {
  const room = getOrCreateRoom(roomId);
  const existingUserIndex = room.users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    room.users[existingUserIndex] = user;
  } else {
    room.users.push(user);
  }
  
  users.set(user.id, user);
  rooms.set(roomId, room);
}

export function removeUserFromRoom(roomId: string, userId: string): void {
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
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}
