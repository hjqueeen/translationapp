'use client';

import { useState } from 'react';
import { useRoomStore } from '@/lib/store/roomStore';
import { UserRole } from '@/types';

interface RoomEntryProps {
  onJoin: (roomId: string, role: UserRole) => void;
}

export default function RoomEntry({ onJoin }: RoomEntryProps) {
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState<UserRole>('listener');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim(), role);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          실시간 음성 번역
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              방 아이디
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="방 아이디를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              역할 선택
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('speaker')}
                className={`px-6 py-4 rounded-lg font-medium transition-all ${
                  role === 'speaker'
                    ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                말하는 사람
              </button>
              <button
                type="button"
                onClick={() => setRole('listener')}
                className={`px-6 py-4 rounded-lg font-medium transition-all ${
                  role === 'listener'
                    ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                듣는 사람
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            방 입장하기
          </button>
        </form>
      </div>
    </div>
  );
}
