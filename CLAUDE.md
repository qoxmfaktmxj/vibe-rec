# vibe-rec (HireFlow)

모노레포 채용 운영 플랫폼. Next.js 16 프론트엔드(`apps/web`) + Spring Boot 4 API(`apps/api`) + PostgreSQL 16.

## 빌드 & 테스트

```bash
# API
cd apps/api && ./gradlew.bat bootRun --args=--server.port=8080   # 실행
cd apps/api && ./gradlew.bat classes --console=plain              # 컴파일
cd apps/api && ./gradlew.bat test --console=plain                 # 테스트 (Testcontainers)

# Web
cd apps/web && npm run dev      # 개발 서버 (API_BASE_URL, NEXT_PUBLIC_API_BASE_URL 필요)
cd apps/web && npm run build    # 프로덕션 빌드
cd apps/web && npm run lint     # ESLint
cd apps/web && npx tsc --noEmit # 타입 체크

# DB
docker compose -f compose.deploy.yaml up -d postgres
```

## 핵심 규칙

### 1. 디자인 시스템 (DESIGN.md)
UI 작업 전 반드시 `DESIGN.md`를 읽을 것. 모든 색상은 `globals.css` 토큰 사용.
- 금지: `bg-white`(→`bg-card`), `text-gray-*`, `bg-blue-*`, hardcoded hex
- 금지: `font-inter`, `font-roboto` (→ Sora + IBM Plex Mono)
- 금지: `rounded-2xl`, `rounded-3xl` (→ `rounded-lg`, `rounded-full` for badges)

### 2. Flyway 마이그레이션 (append-only)
기존 `V*.sql` 파일 **절대 수정 금지**. 새 마이그레이션만 추가.
현재 최신: `V25__refresh_realistic_demo_dataset.sql`. 다음: `V26__`.

### 3. BFF 패턴
브라우저 → Next.js route handler → Spring API. 브라우저가 Spring API를 직접 호출하지 않음.
세션 쿠키는 HTTP-only. `X-Admin-Session` / `X-Candidate-Session` 헤더로 전달.

### 4. 디자인 토큰 전용
`apps/web/src/app/globals.css`의 CSS 변수가 유일한 색상 소스.
상태 뱃지: `shared/lib/recruitment.ts`의 `getApplicationStatusClassName()` 사용.

### 5. 엔티티 동기화
API의 Java DTO(`*Response.java`, `*Request.java`) 변경 시 → `apps/web/src/entities/` TypeScript 타입도 반드시 업데이트.

### 6. 테스트 필수
API 변경 후 `./gradlew.bat test` 실행. 테스트는 Testcontainers + 실제 PostgreSQL.
`IntegrationTestBase.java` 확장하여 새 테스트 작성.

## 디렉토리 가이드

```
apps/web/src/
├── app/           # Next.js 페이지, 레이아웃, BFF route handlers
├── features/      # 도메인별 UI 컴포넌트 (admin/, candidate/, recruitment/)
├── shared/        # API 클라이언트(api/), 인증 헬퍼(lib/), 유틸리티
├── entities/      # TypeScript 타입 (API 응답 미러링)
├── components/ui/ # shadcn 기본 컴포넌트 (수정 최소화)
└── lib/           # 범용 유틸리티 (cn/clsx)

apps/api/src/main/java/com/viberec/api/
├── admin/         # 관리자: auth, applicant, attachment, hiring, interview, jobposting
├── candidate/     # 지원자: auth, profile
├── recruitment/   # 핵심 도메인: application, attachment, evaluation, interview, jobposting, notification
├── migration/     # 레거시 데이터 마이그레이션
└── platform/      # 권한 시스템 (RBAC)
```

## 커밋 컨벤션

Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- 한국어 본문 허용, subject line은 영문
- Flyway 마이그레이션 포함 시 마이그레이션 번호 명시

## 커스텀 명령어

| 명령어 | 설명 |
|--------|------|
| `/build-api` | API 컴파일 체크 |
| `/test-api` | API 통합 테스트 실행 |
| `/new-migration` | 새 Flyway 마이그레이션 생성 |
| `/design-check` | 변경된 TSX 디자인 시스템 준수 검증 |
| `/verify` | 전체 검증 파이프라인 (빌드+테스트+타입+린트+디자인) |
| `/sync-types` | API DTO↔프론트엔드 타입 동기화 검증 |
