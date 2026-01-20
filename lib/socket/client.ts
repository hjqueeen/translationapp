'use client';

import { io, Socket } from 'socket.io-client';
import { SocketMessage, Room, User, UserRole, SupportedLanguage } from '@/types';

class SocketClient {
  private socket: Socket | null = null;
  private _roomId: string | null = null;
  private userId: string | null = null;

  get roomId(): string | null {
    return this._roomId;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, user: User) {
    // 이미 같은 방에 연결되어 있으면 재연결하지 않음
    if (this.socket?.connected && this._roomId === roomId && this.userId === user.id) {
      return;
    }

    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    this._roomId = roomId;
    this.userId = user.id;

    this.socket?.emit('join-room', { roomId, user });
  }

  leaveRoom() {
    if (this.socket && this._roomId && this.userId) {
      this.socket.emit('leave-room', { roomId: this._roomId, userId: this.userId });
      this._roomId = null;
      this.userId = null;
    }
  }

  sendAudioChunk(audioChunk: ArrayBuffer) {
    if (this.socket && this._roomId && this.userId) {
      // ArrayBuffer를 Base64로 인코딩
      const uint8Array = new Uint8Array(audioChunk);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      this.socket.emit('audio-chunk', {
        roomId: this._roomId,
        userId: this.userId,
        audioChunk: base64,
      });
    }
  }

  changeRole(role: UserRole) {
    if (this.socket && this._roomId && this.userId) {
      this.socket.emit('role-changed', {
        roomId: this._roomId,
        userId: this.userId,
        role,
      });
    }
  }

  changeLanguage(language: SupportedLanguage) {
    if (this.socket && this._roomId && this.userId) {
      this.socket.emit('language-changed', {
        roomId: this._roomId,
        userId: this.userId,
        language,
      });
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
