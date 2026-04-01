API DTO와 프론트엔드 TypeScript 타입의 동기화를 검증하세요.

**절차:**

## 1. API Response DTO 수집
```bash
find apps/api/src/main/java -name "*Response.java" -o -name "*Request.java" | sort
```
각 DTO의 필드명과 타입을 파싱합니다.

## 2. 프론트엔드 Entity 타입 수집
```bash
ls apps/web/src/entities/
```
각 `.ts` 파일의 interface/type 정의를 읽습니다.

## 3. 매핑 대조

주요 매핑:
| API DTO | 프론트엔드 타입 파일 |
|---------|---------------------|
| `admin/applicant/web/*Response.java` | `entities/admin/applicant-model.ts` |
| `admin/auth/web/*Response.java` | `entities/admin/model.ts` |
| `candidate/auth/web/*Response.java` | `entities/candidate/model.ts` |
| `candidate/profile/web/*Response.java` | `entities/candidate/profile-model.ts` |
| `recruitment/*/web/*Response.java` | `entities/recruitment/model.ts` |
| `recruitment/attachment/web/*Response.java` | `entities/recruitment/attachment-model.ts` |

## 4. 불일치 보고

필드 단위로 비교:
- **누락된 필드**: API에는 있지만 프론트에 없는 필드
- **추가된 필드**: 프론트에만 있는 필드 (API 제거 후 미정리)
- **타입 불일치**: `Long` vs `number`, `String` vs `string`, `LocalDateTime` vs `string` 등
- **네이밍 불일치**: camelCase 변환 오류

## 5. 수정 제안

불일치 발견 시 프론트엔드 타입 파일 수정을 제안합니다.
API가 source of truth이므로 프론트엔드를 API에 맞춥니다.
