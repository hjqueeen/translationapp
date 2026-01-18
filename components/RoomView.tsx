'use client';

import { useEffect, useState } from 'react';
import { useRoomStore } from '@/lib/store/roomStore';
import { socketClient } from '@/lib/socket/client';
import { Room, User, UserRole, SupportedLanguage } from '@/types';
import SpeakerPanel from './SpeakerPanel';
import ListenerPanel from './ListenerPanel';
import LanguageSelector from './LanguageSelector';

export default function RoomView() {
  const { room, currentUser, setRoom, setCurrentUser, setConnected, updateUserRole } = useRoomStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!room || !currentUser) return;

    // Socket 연결
    socketClient.connect();
    socketClient.joinRoom(room.id, currentUser);

    // 이벤트 리스너 설정
    const handleRoomJoined = (data: { room: Room; user: User }) => {
      setRoom(data.room);
      setCurrentUser(data.user);
      setConnected(true);
      setIsConnected(true);
    };

    const handleUserJoined = (data: { user: User; room: Room }) => {
      setRoom(data.room);
    };

    const handleUserLeft = (data: { userId: string; room: Room }) => {
      setRoom(data.room);
    };

    const handleRoleChanged = (data: { userId: string; role: UserRole; room: Room }) => {
      if (data.userId === currentUser.id) {
        updateUserRole(data.role);
      }
      setRoom(data.room);
    };

    const handleError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
      alert(data.message);
    };

    socketClient.on('room-joined', handleRoomJoined);
    socketClient.on('user-joined', handleUserJoined);
    socketClient.on('user-left', handleUserLeft);
    socketClient.on('role-changed', handleRoleChanged);
    socketClient.on('error', handleError);

    return () => {
      socketClient.off('room-joined', handleRoomJoined);
      socketClient.off('user-joined', handleUserJoined);
      socketClient.off('user-left', handleUserLeft);
      socketClient.off('role-changed', handleRoleChanged);
      socketClient.off('error', handleError);
      socketClient.leaveRoom();
      socketClient.disconnect();
    };
  }, [room, currentUser, setRoom, setCurrentUser, setConnected, updateUserRole]);

  const handleRoleSwitch = (newRole: UserRole) => {
    if (!currentUser) return;
    
    updateUserRole(newRole);
    socketClient.changeRole(newRole);
  };

  const handleLeaveRoom = () => {
    socketClient.leaveRoom();
    socketClient.disconnect();
    useRoomStore.getState().reset();
  };

  if (!room || !currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">방: {room.id}</h1>
              <p className="text-sm text-gray-600 mt-1">
                연결됨: {isConnected ? '✓' : '✗'} | 사용자 수: {room.users.length}
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              방 나가기
            </button>
          </div>

          {/* 역할 전환 */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">역할 전환:</span>
            <button
              onClick={() => handleRoleSwitch('speaker')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentUser.role === 'speaker'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              말하는 사람
            </button>
            <button
              onClick={() => handleRoleSwitch('listener')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentUser.role === 'listener'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              듣는 사람
            </button>
          </div>
        </div>

        {/* 메인 패널 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentUser.role === 'speaker' ? (
            <SpeakerPanel />
          ) : (
            <ListenerPanel />
          )}

          {/* 사용자 목록 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">방 참여자</h2>
            <div className="space-y-2">
              {room.users.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg ${
                    user.id === currentUser.id
                      ? 'bg-indigo-100 border-2 border-indigo-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {user.name || `사용자 ${user.id.slice(0, 8)}`}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                      {user.role === 'speaker' ? '말하는 사람' : '듣는 사람'}
                    </span>
                  </div>
                  {user.role === 'listener' && user.language && (
                    <p className="text-xs text-gray-600 mt-1">
                      언어: {user.language}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
