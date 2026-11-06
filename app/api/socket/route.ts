import { NextRequest } from 'next/server';

// Next.js App Router에서는 직접 Socket.IO 서버를 만들 수 없으므로
// 커스텀 서버(server.js)에서 WebSocket을 처리합니다.
export { getOrCreateRoom, getUser, addUserToRoom, removeUserFromRoom, getRoom } from '@/lib/socket/rooms';

export async function GET(_request: NextRequest) {
  return new Response('WebSocket server endpoint', { status: 200 });
}
