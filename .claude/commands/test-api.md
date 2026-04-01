API 통합 테스트를 실행하세요.

```bash
cd apps/api && ./gradlew.bat test --console=plain
```

**사전 확인:** Docker가 실행 중인지 `docker ps`로 확인. Testcontainers가 PostgreSQL 컨테이너를 자동 생성합니다.

**성공 시:** 테스트 수와 결과 요약.
**실패 시:**
1. 실패한 테스트명과 assertion 메시지 확인
2. 테스트 코드와 대상 코드를 함께 읽고 원인 분석
3. Testcontainers 연결 실패 시: Docker Desktop 실행 상태 확인 안내
4. 수정 후 해당 테스트만 재실행하여 확인
