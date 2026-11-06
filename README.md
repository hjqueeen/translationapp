# 실시간 음성 번역 앱

Next.js, TypeScript, Tailwind CSS를 사용한 실시간 음성 번역 애플리케이션입니다.

## 주요 기능

- **방 기반 연결**: 방 아이디를 통해 여러 사용자가 같은 방에 입장
- **역할 선택**: 말하는 사람(Speaker) 또는 듣는 사람(Listener) 역할 선택
- **실시간 번역**: 한국어 음성을 실시간으로 다른 언어로 번역하여 전달
- **AI 기반 번역**: OpenAI GPT를 사용한 자연스러운 번역
- **음성 합성**: 번역된 텍스트를 자연스러운 음성으로 변환 (TTS)
- **역할 전환**: 언제든지 말하는 사람과 듣는 사람 역할 전환 가능
- **언어 선택**: 듣는 사람은 원하는 언어를 선택하여 번역된 음성 청취

## 기술 스택

- **프론트엔드**: Next.js 16, React 19, TypeScript
- **스타일링**: Tailwind CSS
- **실시간 통신**: Socket.IO
- **상태 관리**: Zustand
- **AI 번역**: OpenAI API (Whisper STT, GPT-4 번역, TTS)
- **음성 처리**: Web Audio API, MediaRecorder API

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## GitHub Pages 배포

정적 프론트엔드는 GitHub Pages로 배포할 수 있습니다. Socket.IO·번역 API는 Pages에서 동작하지 않으므로, **UI 미리보기용**입니다. 실시간 번역은 Docker/로컬 서버가 필요합니다.

### 1. 저장소 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**를 **GitHub Actions**로 선택

### 2. 배포

`main` 또는 `develop`에 push하거나 Actions에서 **Deploy to GitHub Pages** 워크플로를 수동 실행합니다.

배포 URL 예: `https://hjqueeen.github.io/translationapp/`

### 3. 로컬에서 정적 빌드 확인

```bash
npm run build:pages
npx serve out
```

## Docker를 사용한 실행

이 프로젝트는 Node.js 24.13.0을 사용하며 Docker를 통해 실행할 수 있습니다.

### 프로덕션 빌드 및 실행

```bash
# Docker 이미지 빌드 및 실행
docker-compose up --build

# 또는 백그라운드에서 실행
docker-compose up -d --build
```

### 개발 모드 실행 (핫 리로드 지원)

```bash
# 개발 모드로 실행
docker-compose -f docker-compose.dev.yml up --build

# 또는 백그라운드에서 실행
docker-compose -f docker-compose.dev.yml up -d --build
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 사용 방법

1. **방 입장**
   - 방 아이디를 입력하거나 새로 생성
   - 말하는 사람 또는 듣는 사람 역할 선택
   - "방 입장하기" 버튼 클릭

2. **말하는 사람 (Speaker)**
   - "녹음 시작" 버튼을 클릭하여 마이크 권한 허용
   - 한국어로 말하기 시작
   - 말하는 내용이 자동으로 실시간 번역되어 방의 모든 듣는 사람에게 전달

3. **듣는 사람 (Listener)**
   - 원하는 언어 선택
   - 말하는 사람의 음성이 선택한 언어로 실시간 번역되어 재생됨
   - 번역된 텍스트도 화면에 표시됨

4. **역할 전환**
   - 언제든지 말하는 사람과 듣는 사람 역할을 전환할 수 있음

## 지원 언어

- 한국어 (ko)
- 영어 (en)
- 중국어 (zh)
- 일본어 (ja)
- 스페인어 (es)
- 프랑스어 (fr)
- 독일어 (de)
- 러시아어 (ru)
- 아랍어 (ar)
- 포르투갈어 (pt)
- 베트남어 (vi)
- 태국어 (th)
- 인도네시아어 (id)
- 힌디어 (hi)

## 프로젝트 구조

```
my-next-app/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── socket/        # Socket.IO 엔드포인트
│   │   └── translate/    # 번역 API
│   ├── page.tsx           # 메인 페이지
│   └── layout.tsx         # 레이아웃
├── components/            # React 컴포넌트
│   ├── RoomEntry.tsx      # 방 입장 컴포넌트
│   ├── RoomView.tsx       # 방 뷰 컴포넌트
│   ├── SpeakerPanel.tsx   # 말하는 사람 패널
│   ├── ListenerPanel.tsx  # 듣는 사람 패널
│   └── LanguageSelector.tsx # 언어 선택 컴포넌트
├── hooks/                 # 커스텀 훅
│   ├── useAudioRecorder.ts # 음성 녹음 훅
│   └── useAudioPlayer.ts   # 음성 재생 훅
├── lib/                   # 라이브러리 및 유틸리티
│   ├── ai/                # AI 번역 관련
│   │   └── translation.ts # STT, 번역, TTS 함수
│   ├── socket/            # Socket.IO 클라이언트
│   └── store/             # 상태 관리 (Zustand)
├── types/                 # TypeScript 타입 정의
├── server.js              # 커스텀 서버 (Socket.IO 통합)
└── package.json

```

## 주의사항

- OpenAI API 키가 필요합니다. [OpenAI](https://platform.openai.com/)에서 API 키를 발급받으세요.
- 마이크 권한이 필요합니다. 브라우저에서 마이크 접근을 허용해야 합니다.
- HTTPS 환경에서 실행하는 것을 권장합니다 (프로덕션 환경).
- 실시간 번역은 API 호출 비용이 발생할 수 있습니다.

## 라이선스

MIT
