# Sermon Interp

실시간 설교 AI 통역 앱. 화자가 방을 열면 청취자가 언어를 선택해 통역된 음성을 듣습니다.

- **웹**: Next.js (`apps/web`)
- **실시간 오디오**: LiveKit
- **통역 파이프라인**: OpenAI STT → 번역 → TTS (서버 Agent)

> 모바일 Expo 클라이언트는 sibling 레포 `translationapp-mobile`을 참고하세요. API·Agent·shared 패키지 구조는 동일합니다.

## 구조

```
translationapp/
  apps/web/          Next.js 웹 앱
  packages/shared/   공통 타입·언어·방 코드
  server/api/        방 생성·입장·LiveKit 토큰
  server/agent/      STT→번역→TTS 워커
```

## 사전 준비

1. **Node.js 20+**
2. **LiveKit**
   - 로컬: `docker compose up -d`
   - 또는 [LiveKit Cloud](https://cloud.livekit.io)
3. **OpenAI API Key**

```bash
cp .env.example .env
# LIVEKIT_* 와 OPENAI_API_KEY 를 채웁니다.
```

웹 앱에서 API를 쓰려면 `apps/web`에 env를 넘기거나 루트 `.env`의 `NEXT_PUBLIC_API_URL`을 사용하세요.

```bash
# apps/web/.env.local 예시
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
```

## 실행

```bash
npm install

# 터미널 1 — API
npm run api

# 터미널 2 — Translation agent
npm run agent

# 터미널 3 — Web
npm run web
```

브라우저: [http://localhost:3000](http://localhost:3000)

웹에서 마이크를 쓰려면 `localhost` 또는 HTTPS가 필요합니다.

## 사용 흐름

1. **화자**: 홈 → Create room → 6자리 코드 공유 → 마이크 ON
2. **청취자**: 홈 → 코드 입력 → 언어 선택 → Enter room
3. Agent가 화자 음성을 문장 단위로 통역하고 `lang-en` 등 언어별 오디오 트랙을 publish
4. 청취자 앱은 선택한 언어 트랙만 재생하고, 자막(data channel)을 표시

## API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 헬스체크 |
| GET | `/languages` | 지원 언어 |
| POST | `/rooms` | 방 생성 (화자 토큰) |
| POST | `/rooms/:code/join` | 입장 `{ "language": "en" }` |
| GET | `/rooms/:code` | 방 상태 |

Agent: `POST /dispatch` `{ "roomName", "code" }` — API가 방 생성 시 자동 호출합니다.

## MVP 범위

- 로그인 없음, 방 코드만
- 원문 언어: 한국어 고정
- 청취 언어: en / ja / zh / es
- 계정·녹음·사람 통역사 채널은 제외

## 문제 해결

- **Room not found**: API를 재시작하면 인메모리 방이 사라집니다.
- **번역이 안 됨**: `OPENAI_API_KEY`, agent 로그, LiveKit 연결을 확인하세요.
- **웹 마이크 거부**: 브라우저 권한과 localhost/HTTPS를 확인하세요.
