# Node 24.13.0을 사용하는 베이스 이미지
FROM node:24.13.0-alpine AS base

# 의존성 설치 단계
FROM base AS deps
# 패키지 매니저 캐시를 위한 작업 디렉토리 설정
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package.json package-lock.json* ./
# 의존성 설치
RUN npm ci

# 빌드 단계
FROM base AS builder
WORKDIR /app
# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
# 소스 코드 복사
COPY . .

# Next.js 빌드 (환경 변수 설정 가능)
ENV NEXT_TELEMETRY_DISABLED 1

# 프로덕션 빌드 실행
RUN npm run build

# 프로덕션 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 시스템 사용자 생성 (보안을 위해 root가 아닌 사용자로 실행)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 빌드 결과물 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
