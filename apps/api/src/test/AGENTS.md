<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# test

## Purpose

Integration tests for the Spring Boot API. All tests run against a real PostgreSQL instance via Testcontainers.

## Key Files

| File | Description |
|------|-------------|
| `java/com/viberec/api/VibeRecApiApplicationTests.java` | Application context load test |
| `java/com/viberec/api/support/IntegrationTestBase.java` | Base class for all integration tests — configures Testcontainers PostgreSQL |
| `java/com/viberec/api/support/TestcontainersConfig.java` | Testcontainers PostgreSQL configuration |

## Test Files

| Test | Coverage Area |
|------|--------------|
| `admin/auth/AdminAuthTests.java` | Admin signup, login, session management |
| `admin/auth/AdminAuthorizationTests.java` | Admin RBAC permission checks |
| `admin/applicant/AdminApplicantTests.java` | Admin applicant list/detail/review |
| `admin/hiring/AdminHiringDecisionTests.java` | Final decisions and notifications |
| `admin/interview/AdminInterviewTests.java` | Interview scheduling and evaluation |
| `candidate/auth/CandidateAuthTests.java` | Candidate signup, login, session |
| `candidate/auth/CandidateApplicationAuthorizationTests.java` | Candidate application ownership checks |
| `candidate/profile/CandidateProfileTests.java` | Candidate profile CRUD |
| `recruitment/RecruitmentMvpTests.java` | Core recruitment flow (postings, applications) |

## For AI Agents

### Working In This Directory

- Extend `IntegrationTestBase` for all new test classes
- Tests use real PostgreSQL via Testcontainers — no mocks for database access
- Flyway migrations run automatically on the test database
- Test data setup should be self-contained within each test method or `@BeforeEach`
- Run tests: `.\gradlew.bat test --console=plain` from `apps/api/`

<!-- MANUAL: -->
