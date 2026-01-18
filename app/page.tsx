'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRoomStore } from '@/lib/store/roomStore';
import { User, UserRole, SupportedLanguage } from '@/types';
import RoomEntry from '@/components/RoomEntry';
import RoomView from '@/components/RoomView';

export default function Home() {
  const { room, currentUser, setRoom, setCurrentUser } = useRoomStore();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async (roomId: string, role: UserRole) => {
    setIsJoining(true);
    
    try {
      // 사용자 생성
      const userId = uuidv4();
      const user: User = {
        id: userId,
        role,
        language: role === 'listener' ? 'en' : undefined, // 기본 언어는 영어
      };

      // 방 생성 또는 조회
      const newRoom = {
        id: roomId,
        users: [user],
        createdAt: new Date(),
      };

      setRoom(newRoom);
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  if (room && currentUser) {
    return <RoomView />;
  }

  return <RoomEntry onJoin={handleJoinRoom} />;
}
