새 Flyway 마이그레이션을 생성하세요. 인자로 설명을 받습니다: `/new-migration add_column_to_application`

**절차:**

1. 현재 최신 마이그레이션 번호 확인:
```bash
ls apps/api/src/main/resources/db/migration/ | sort -V | tail -1
```

2. 다음 버전 번호로 파일 생성:
   - 파일명: `V{다음번호}__{설명}.sql` (더블 언더스코어)
   - 위치: `apps/api/src/main/resources/db/migration/`

3. SQL 작성 (사용자 요구사항에 따라)

4. 컴파일 체크로 엔티티 매핑 검증:
```bash
cd apps/api && ./gradlew.bat classes --console=plain
```

**핵심 규칙:**
- 기존 마이그레이션 파일 **절대 수정 금지**
- `ddl-auto: validate` 이므로 엔티티 클래스와 마이그레이션이 정확히 일치해야 함
- 테이블/컬럼명은 snake_case
- 스키마: `platform.*` (인증/권한), `recruit.*` (채용 도메인)
