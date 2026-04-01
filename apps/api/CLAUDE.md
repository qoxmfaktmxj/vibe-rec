# apps/api — Spring Boot 4 API

## 명령어

```bash
./gradlew.bat bootRun --args=--server.port=8080  # 실행
./gradlew.bat classes --console=plain             # 컴파일 체크
./gradlew.bat test --console=plain                # 통합 테스트
```

API context path: `/api`. 모든 엔드포인트는 `/api/` 접두사.

## Package-by-Feature 구조

```
com.viberec.api.{domain}/
├── domain/      # JPA 엔티티, Enum, Value Object (의존성 없음)
├── repository/  # Spring Data JPA 인터페이스 (→ domain)
├── service/     # 비즈니스 로직, 검증 (→ domain, repository)
└── web/         # REST 컨트롤러, Request/Response DTO (→ service, domain)
```

**레이어 규칙:** web → service → repository → domain. 역방향 금지.

## 새 기능 추가 체크리스트

1. **Domain**: JPA `@Entity` 클래스 + Enum 정의
2. **Repository**: `JpaRepository<Entity, Long>` 인터페이스
3. **Service**: 비즈니스 로직 (`@Service`)
4. **Web**: `@RestController` + Java record DTO
5. **Migration**: `V{n}__description.sql` Flyway 마이그레이션
6. **Test**: `IntegrationTestBase` 확장한 통합 테스트

## 인증 & 권한

### 세션 기반 인증
- Admin: `X-Admin-Session` 헤더 → `AdminSession` 조회
- Candidate: `X-Candidate-Session` 헤더 → `CandidateSession` 조회

### RBAC 권한 시스템
```java
@RequiresPermission("MANAGE_APPLICANTS")
@PostMapping("/admin/applicants/{id}/review-status")
public ResponseEntity<?> updateReviewStatus(...) { }
```
`PermissionInterceptor`가 어노테이션을 읽고 세션의 role → permission 매핑으로 검증.

## Flyway 마이그레이션

- 파일 위치: `src/main/resources/db/migration/`
- 네이밍: `V{번호}__{설명}.sql` (더블 언더스코어)
- 현재 최신: `V25`
- **기존 마이그레이션 파일 수정 절대 금지** (append-only)
- `ddl-auto: validate` — Hibernate가 엔티티↔스키마 불일치 시 시작 실패

## 테스트 패턴

```java
class MyFeatureTests extends IntegrationTestBase {
    @Test
    void shouldDoSomething() {
        // TestcontainersConfig이 PostgreSQL 컨테이너 자동 제공
        // Flyway 마이그레이션 자동 실행
        // 테스트 데이터는 각 테스트 내에서 자체 생성
    }
}
```

Docker가 실행 중이어야 Testcontainers 동작. `docker ps`로 확인.

## 주요 도메인 모델

| 엔티티 | 설명 |
|--------|------|
| `JobPosting` → `JobPostingStep` | 채용 공고 + 채용 단계 |
| `Application` → `ApplicationResumeRaw` | 지원서 + 이력서 원본 |
| `ApplicationAttachment` | 첨부파일 |
| `Interview` → `Evaluation` | 면접 + 평가 |
| `NotificationLog` | 지원자 알림 |
| `ApplicationFinalStatus` | 최종 합격/불합격 결정 |
