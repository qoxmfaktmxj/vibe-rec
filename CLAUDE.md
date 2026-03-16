# CLAUDE.md — vibe-rec 프로젝트 규칙

## 프로젝트 개요

레거시 채용 시스템 현대화 프로젝트. Next.js 16 + Spring Boot 4 기반 모노레포.
현재 MVP 단계: 공고 조회 → 지원서 저장/제출 → 관리자 인증 → 운영자 지원자 관리

## 기술 스택

- **Web:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui
- **API:** Java 21, Spring Boot 4, Spring Data JPA, Flyway
- **DB:** PostgreSQL 16, Docker Compose (port 5435)
- **Font:** Noto Sans KR, JetBrains Mono

## 디렉터리 구조 규칙

```
apps/
  web/src/
    app/              # Next.js App Router 페이지 & 라우트 핸들러
    components/ui/    # shadcn/ui 공통 컴포넌트
    entities/         # 도메인 타입 정의 (model.ts)
    features/         # 기능별 컴포넌트 (recruitment/, admin/)
    shared/
      api/            # API 클라이언트 함수 (서버 전용)
      lib/            # 유틸리티, 포맷터, 헬퍼
    lib/              # 공통 유틸 (cn 함수 등)
  api/src/main/java/  # Spring Boot (domain → repository → service → web)
infra/docker/         # Docker Compose 설정
docs/                 # 현대화 계획 문서
```

## 코드 규칙

### 공통

- EditorConfig 준수: JS/TS 2-space, Java/SQL 4-space
- TypeScript strict mode 활성화
- `any` 타입 사용 금지 — 명확한 타입 또는 제네릭 사용
- import 경로는 `@/` alias 사용 (`@/*` → `./src/*`)

### React / Next.js (Vercel Best Practices 기반)

#### Server Components (기본값)

- 모든 페이지/레이아웃은 Server Component로 작성 (async function)
- `"use client"`는 인터랙션이 필요한 컴포넌트에만 사용
- Client Component는 최소한의 범위로 격리 — 전체 페이지가 아닌 인터랙티브 부분만

#### 데이터 페칭 — 워터폴 제거 (CRITICAL)

- 독립적인 fetch는 반드시 `Promise.all()` 사용
- await는 실제 필요한 분기에서만 수행 (early return 우선)
- Suspense boundary로 스트리밍 렌더링 활용
- `cache: "no-store"` — 사용자별/실시간 데이터에 적용 (현재 전체 적용 중)

```typescript
// GOOD
const [applicants, jobPostings] = await Promise.all([
  getAdminApplicants(filters),
  getJobPostings(),
]);

// BAD — 순차 워터폴
const applicants = await getAdminApplicants(filters);
const jobPostings = await getJobPostings();
```

#### 번들 최적화 (CRITICAL)

- barrel file (index.ts 재수출) 금지 — 직접 파일 경로 import
- 무거운 라이브러리는 `next/dynamic`으로 동적 import
- analytics/logging 등 비필수 라이브러리는 hydration 후 로드
- 조건부 기능은 활성화 시에만 모듈 로드

```typescript
// GOOD
import { Button } from "@/components/ui/button";

// BAD — barrel import
import { Button } from "@/components/ui";
```

#### 서버 사이드 성능 (HIGH)

- RSC → Client Component로 전달하는 props는 최소화
- `React.cache()`로 요청 단위 중복 제거
- Server Action에도 인증 검증 필수
- 비차단 작업은 `after()` 사용

#### 상태 관리

- 외부 상태 라이브러리 사용하지 않음 — React hooks (useState, useRef) 만 사용
- 파생 가능한 값은 state 대신 계산으로 처리 (`const isPending = pendingAction !== null`)
- useEffect 남용 금지 — 이벤트 핸들러에서 처리
- `startTransition`으로 비긴급 업데이트 래핑

```typescript
// GOOD — 파생 상태
const isPending = pendingAction !== null;
const isSubmitted = state.currentStatus === "SUBMITTED";

// BAD — 불필요한 state
const [isPending, setIsPending] = useState(false);
// pendingAction 변경 시마다 수동 동기화 필요
```

#### 조건부 렌더링

- `&&` 대신 삼항 연산자 사용 (falsy 값 렌더 방지)

```typescript
// GOOD
{items.length > 0 ? <List items={items} /> : null}

// BAD — 0이 렌더될 수 있음
{items.length && <List items={items} />}
```

#### 에러 처리

- Route Handler에서 try/catch + ApiError 분류
- error.tsx에서 전역 에러 바운더리
- 커스텀 에러 클래스 (ApiError, AdminApiError) 사용

### API 클라이언트 규칙

- `shared/api/` 파일은 서버 전용 (SSR에서만 호출)
- fetch 요청에 `Content-Type`, `Accept` 헤더 명시
- 에러 응답은 status code 기반 분기 처리
- 인증이 필요한 요청은 `X-Admin-Session` 헤더 포함

### Java / Spring Boot

- package-by-feature 구조: `domain/`, `repository/`, `service/`, `web/`
- JPA 엔티티: `@PrePersist`, `@PreUpdate`로 타임스탬프 관리
- `open-in-view: false` — lazy loading 주의
- `ddl-auto: validate` — 스키마 변경은 Flyway 마이그레이션만 허용
- DTO로 API 응답 구성 (엔티티 직접 노출 금지)
- `@Transactional(readOnly = true)` 읽기 전용 서비스에 적용

### 데이터베이스

- 스키마 변경은 반드시 Flyway 마이그레이션 파일로 수행
- 마이그레이션 파일명: `V{n}__{description}.sql`
- recruit 스키마: 채용 도메인, platform 스키마: 관리자/세션
- 시드 데이터도 마이그레이션으로 관리

## 스타일링 규칙

### Tailwind CSS 4

- 인라인 Tailwind 클래스 사용 (CSS Modules 사용하지 않음)
- `cn()` 유틸리티로 조건부 클래스 병합 (clsx + tailwind-merge)
- shadcn/ui 컴포넌트 기반 + 커스텀 확장
- CSS 변수: oklch 색상 체계 (light/dark 모드)
- 반응형: `lg:` 브레이크포인트 중심

### 디자인 토큰

- 색상: CSS 변수 기반 (`--background`, `--foreground`, `--primary` 등)
- 둥글기: `--radius` 변수 기반 스케일링
- 폰트: Noto Sans KR (본문), JetBrains Mono (코드)

## 인증 규칙

- 세션 토큰: HTTP-only 쿠키 (`admin-session`)
- 백엔드 세션 저장: PostgreSQL `platform.admin_session` 테이블
- 세션 만료: 12시간 (설정 가능)
- 보호된 라우트: admin layout에서 서버사이드 세션 검증
- 미인증 시 `/login`으로 리다이렉트

## Git & 개발 워크플로우

- 모노레포 (single repo, multiple apps)
- 커밋 메시지: 한국어 또는 영어 (일관성 유지)
- output/ 디렉터리는 .gitignore 처리
- Playwright 테스트 산출물은 output/playwright/에 저장

## 검증 명령

```bash
# DB
cd infra/docker && docker compose up -d

# API
cd apps/api && ./mvnw.cmd spring-boot:run

# Web
cd apps/web && npm install && npm run dev

# 검증
cd apps/api && ./mvnw.cmd test        # 백엔드 테스트
cd apps/web && npm run lint           # 프론트엔드 린트
cd apps/web && npm run build          # 프론트엔드 빌드
```

## 현재 구현 상태

- [x] 공고 목록/상세 조회
- [x] 지원서 draft 저장 / 최종 제출 / 제출 잠금
- [x] 관리자 로그인/로그아웃/세션
- [x] 운영자 지원자 목록/상세/검토 상태 변경
- [ ] 첨부파일 업로드
- [ ] 지원서 정규화 테이블 확장
- [ ] 운영자 권한 세분화
- [ ] 면접/평가/합불 집계
- [ ] 최종 합격/통지
- [ ] CI 파이프라인 / Testcontainers
- [ ] legacy 데이터 이관
