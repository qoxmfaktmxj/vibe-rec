# Recruitment Legacy Modernization Plan

## 1. 목표

- 레거시 채용 시스템을 단계적으로 현대화한다.
- 프론트는 Next.js 기반으로 재구성한다.
- 백엔드는 Java 기반으로 재구성한다.
- 데이터베이스는 시작부터 PostgreSQL을 사용한다.
- 레거시와 병행 검증하면서 화면/기능 단위로 점진 이행한다.

## 2. 최종 권장 스택

### Frontend

- Next.js App Router
- TypeScript
- shadcn/ui
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Grid adapter layer
  - 1차: react-data-grid
  - 2차: vige-grid로 교체 가능하도록 공통 래퍼 사용

### Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Validation
- Spring Data JPA
- Flyway
- Testcontainers

### Database

- PostgreSQL
- JSONB 적극 활용
- pg_trgm / full text search는 검색 요구사항 확인 후 도입

### 운영 보조

- Docker Compose for local
- S3 compatible storage or MinIO for file handling
- OpenAPI for API contract

## 3. Backend 선택: Java vs Python

결론은 코어 백엔드는 Java가 맞다.

이유:

- 현재 레거시 핵심 도메인이 Java/Spring/JPA 기반이다.
- 채용 시스템은 단순 CRUD보다 전형, 평가, 면접 배정, 합불, 통지, 배치가 중요하다.
- 트랜잭션과 상태 전이가 많아서 Spring 기반 재구성이 안전하다.
- 마이그레이션 중 레거시 로직 비교와 재현이 Java 쪽이 훨씬 수월하다.

Python은 아래 영역에 제한적으로 사용하는 것이 좋다.

- 문서 파싱
- OCR
- AI 요약/매칭
- 통계/분석 배치
- 데이터 마이그레이션 보조 스크립트

즉:

- Core API: Java
- Auxiliary service / ETL / AI: Python 가능

## 4. PostgreSQL을 처음부터 도입할 때의 원칙

PostgreSQL 선행 전환은 가능하지만, 레거시의 MySQL 의존 SQL을 먼저 통제해야 한다.

현재 확인된 리스크:

- `DATE_FORMAT`
- `IFNULL`
- MySQL식 문자열/날짜 처리
- public DB(`rec_*`)와 admin DB(`rem_*`)의 이중 저장 구조

따라서 전략은 "DB 엔진만 바꾸는 이행"이 아니라 "도메인 기준으로 다시 설계한 PostgreSQL 스키마"로 가야 한다.

## 5. 타깃 아키텍처

```text
vibe-rec/
  apps/
    web/        # Next.js
    api/        # Spring Boot
  infra/
    docker/
    postgres/
  docs/
  legacy-notes/
```

### 구조 원칙

- 레거시 코드는 즉시 삭제하지 않는다.
- 신규 시스템은 `apps/web`, `apps/api`에 분리한다.
- DB는 PostgreSQL 단일 인스턴스로 시작한다.
- public/admin 이중 DB 대신 단일 도메인 DB를 목표로 한다.
- 단, applicant raw payload는 JSONB로 보존한다.

## 6. PostgreSQL 타깃 모델 원칙

### 6.1 단일 source of truth

레거시의 `rec_applicant`와 `rem_applicant_by_announce` 이중 구조를 그대로 복제하지 않는다.

신규에서는 아래처럼 정리한다.

- `job_posting`
- `job_posting_step`
- `application`
- `application_resume_raw`
- `resume_basic`
- `resume_education`
- `resume_career`
- `interview_room`
- `interview_group`
- `interview_assignment`
- `evaluation_sheet`
- `evaluation_result`
- `evaluation_result_item`
- `hiring_decision`
- `notice_campaign`
- `notice_target`
- `todo_task`

### 6.2 raw + normalized hybrid

레거시 지원서는 섹션 JSON 성격이 강하다. 따라서 처음부터 완전 정규화만 고집하면 이행 속도가 느려진다.

권장:

- `application_resume_raw.payload jsonb`
- 조회/검색에 필요한 공통 필드만 정규화
- 세부 섹션은 순차적으로 정규화

### 6.3 legacy key 보존

모든 주요 테이블에 legacy 식별자를 추적할 수 있게 한다.

예:

- `legacy_anno_id`
- `legacy_recruit_id`
- `legacy_appl_id`
- `legacy_appl_no`

이건 병행검증과 데이터 이관에 필수다.

## 7. 단계별 실행 계획

### Phase 0. Foundation

목표:

- 신규 저장소 구조 생성
- Next.js/Spring Boot 기본 앱 부팅
- PostgreSQL 로컬 개발환경 구성
- Flyway baseline 준비

산출물:

- `apps/web`
- `apps/api`
- `infra/docker/docker-compose.yml`
- PostgreSQL 연결 확인
- 기본 CI 명령 정의

완료 기준:

- web dev 서버 기동
- api 서버 기동
- PostgreSQL 연결 성공
- 기본 헬스체크 통과

### Phase 1. Schema Baseline

목표:

- 레거시 엔티티를 분석해 PostgreSQL v1 스키마 설계
- rec/rem 중복 구조를 신규 도메인 모델로 통합
- Flyway migration v1 작성

산출물:

- `V1__init_schema.sql`
- ERD 문서
- legacy-to-new table mapping 문서

완료 기준:

- 빈 PostgreSQL DB에 스키마 생성 가능
- 주요 도메인 관계가 문서화됨

### Phase 2. Auth + App Shell

목표:

- 로그인/세션/권한
- 보호 라우트
- 사이드바/헤더/공통 레이아웃

완료 기준:

- 로그인 후 보호 화면 접근 가능
- 미로그인 시 redirect 동작

### Phase 3. Job Posting Read Side

목표:

- 공고 목록
- 공고 상세
- 전형(step) 조회

완료 기준:

- 레거시와 주요 조회 결과 비교 가능

### Phase 4. Applicant Submission

목표:

- 지원서 임시저장
- 최종제출
- 첨부파일 업로드
- raw payload 저장

완료 기준:

- 한 명의 지원자가 신규 시스템에서 공고 지원 가능
- PostgreSQL에 raw + normalized 데이터 저장

### Phase 5. Recruiter Applicant Management

목표:

- 지원자 목록/검색/필터
- 지원자 상세
- 상태 변경

완료 기준:

- 운영자가 실제 검토 흐름을 수행 가능

### Phase 6. Interview + Evaluation

목표:

- 면접실/면접조
- 면접관 배정
- 평가표/점수입력
- 단계별 합불

완료 기준:

- 한 step의 평가와 합불 처리 end-to-end 가능

### Phase 7. Hiring Decision + Notice

목표:

- 최종합격/불합격
- 통지
- 추가 제출 todo
- 확인 프로세스

완료 기준:

- 후보자 결과 발표 및 후속 액션 수행 가능

### Phase 8. Data Migration + Cutover

목표:

- 레거시 데이터 이관
- 병행검증
- 운영 전환

완료 기준:

- 핵심 화면/집계/합불 결과 parity 확인
- rollback 절차 문서화

## 8. 검증 전략

PostgreSQL을 처음부터 쓸 경우, 검증이 계획의 핵심이다.

### 8.1 데이터 검증

- legacy export vs new DB row count 비교
- 공고별 지원자 수 비교
- step별 합격/불합격 수 비교
- 최종합격자 수 비교

### 8.2 API 검증

- Spring integration test
- Testcontainers PostgreSQL 사용
- 상태 전이 테스트 작성

### 8.3 UI 검증

- Playwright E2E
- 핵심 시나리오 중심
  - 로그인
  - 공고 조회
  - 지원서 제출
  - 지원자 조회
  - 평가 입력
  - 최종결과 처리

## 9. 첫 실행 백로그

### Track A. Foundation

- [ ] `apps/web` 초기화
- [ ] `apps/api` 초기화
- [ ] Docker Compose로 PostgreSQL 구성
- [ ] 환경변수 정책 수립
- [ ] 공통 README 작성

### Track B. Data

- [ ] legacy entity -> target schema mapping 표 작성
- [ ] MySQL 의존 SQL 목록 추출
- [ ] PostgreSQL 대체 문법 설계
- [ ] Flyway `V1__init_schema.sql` 작성

### Track C. Architecture

- [ ] 인증 방식 결정
- [ ] 파일 저장 방식 결정
- [ ] 알림 발송 인터페이스 결정
- [ ] Grid adapter 인터페이스 정의

### Track D. First Slice

- [ ] 로그인/레이아웃
- [ ] 공고 목록
- [ ] 공고 상세
- [ ] 지원서 초안 저장

## 10. 현재 권장 결정사항

- 프론트는 Next.js + shadcn/ui로 확정
- 백엔드는 Java/Spring Boot로 확정
- DB는 PostgreSQL로 시작
- applicant raw payload는 JSONB 유지
- grid는 직접 사용하지 말고 adapter로 감싼다
- 레거시 rec/rem 이중 저장 구조는 신규에서 단일 모델로 정리한다

## 11. 바로 다음 작업

다음 순서로 진행하는 것이 가장 안전하다.

1. 워크스페이스 기본 구조 생성
2. PostgreSQL Docker 환경 구성
3. Spring Boot 프로젝트 생성
4. Next.js 프로젝트 생성
5. 신규 PostgreSQL v1 스키마 설계
6. 첫 화면은 `로그인 -> 공고 목록 -> 공고 상세` 순으로 구현
