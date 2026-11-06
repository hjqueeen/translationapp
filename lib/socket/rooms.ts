import { Room, User } from '@/types';

// 메모리 기반 방 저장 (프로덕션에서는 Redis 등 사용 권장)
const rooms = new Map<string, Room>();
const users = new Map<string, User>();

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
  const existingUserIndex = room.users.findIndex((u) => u.id === user.id);

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
    room.users = room.users.filter((u) => u.id !== userId);
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
