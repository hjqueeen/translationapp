import { create } from 'zustand';
import { User, Room, UserRole, SupportedLanguage } from '@/types';

interface RoomState {
  room: Room | null;
  currentUser: User | null;
  isConnected: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  
  // Actions
  setRoom: (room: Room | null) => void;
  setCurrentUser: (user: User | null) => void;
  setConnected: (connected: boolean) => void;
  setRecording: (recording: boolean) => void;
  setPlaying: (playing: boolean) => void;
  updateUserRole: (role: UserRole) => void;
  updateUserLanguage: (language: SupportedLanguage) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  reset: () => void;
}

const initialState = {
  room: null,
  currentUser: null,
  isConnected: false,
  isRecording: false,
  isPlaying: false,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  
  setRoom: (room) => set({ room }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setRecording: (recording) => set({ isRecording: recording }),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  updateUserRole: (role) => set((state) => {
    if (!state.currentUser) return state;
    const updatedUser = { ...state.currentUser, role };
    return {
      currentUser: updatedUser,
      room: state.room ? {
        ...state.room,
        users: state.room.users.map(u => 
          u.id === updatedUser.id ? updatedUser : u
        ),
      } : null,
    };
  }),
  
  updateUserLanguage: (language) => set((state) => {
    if (!state.currentUser) return state;
    const updatedUser = { ...state.currentUser, language };
    return {
      currentUser: updatedUser,
      room: state.room ? {
        ...state.room,
        users: state.room.users.map(u => 
          u.id === updatedUser.id ? updatedUser : u
        ),
      } : null,
    };
  }),
  
  addUser: (user) => set((state) => {
    if (!state.room) return state;
    const existingUser = state.room.users.find(u => u.id === user.id);
    if (existingUser) return state;
    return {
      room: {
        ...state.room,
        users: [...state.room.users, user],
      },
    };
  }),
  
  removeUser: (userId) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        users: state.room.users.filter(u => u.id !== userId),
      },
    };
  }),
  
  reset: () => set(initialState),
}));
