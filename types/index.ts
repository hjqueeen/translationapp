// 사용자 역할 타입
export type UserRole = 'speaker' | 'listener';

// 지원 언어 타입
export type SupportedLanguage = 
  | 'ko' // 한국어
  | 'en' // 영어
  | 'zh' // 중국어
  | 'ja' // 일본어
  | 'es' // 스페인어
  | 'fr' // 프랑스어
  | 'de' // 독일어
  | 'ru' // 러시아어
  | 'ar' // 아랍어
  | 'pt' // 포르투갈어
  | 'vi' // 베트남어
  | 'th' // 태국어
  | 'id' // 인도네시아어
  | 'hi'; // 힌디어

// 언어 정보 인터페이스
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

// 사용자 정보 인터페이스
export interface User {
  id: string;
  role: UserRole;
  language?: SupportedLanguage; // Listener만 필요
  name?: string;
}

// 방 정보 인터페이스
export interface Room {
  id: string;
  users: User[];
  createdAt: Date;
}

// WebSocket 메시지 타입
export type SocketMessageType = 
  | 'join-room'
  | 'leave-room'
  | 'user-joined'
  | 'user-left'
  | 'role-changed'
  | 'language-changed'
  | 'audio-chunk'
  | 'translated-audio'
  | 'translated-text'
  | 'error';

// WebSocket 메시지 인터페이스
export interface SocketMessage {
  type: SocketMessageType;
  roomId: string;
  userId?: string;
  data?: any;
  timestamp: number;
}

// 오디오 청크 인터페이스
export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  userId: string;
}

// 번역된 오디오 인터페이스
export interface TranslatedAudio {
  audioData: ArrayBuffer;
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  timestamp: number;
}

// 번역된 텍스트 인터페이스
export interface TranslatedText {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  timestamp: number;
}

// 언어 목록
export const LANGUAGES: LanguageInfo[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];
