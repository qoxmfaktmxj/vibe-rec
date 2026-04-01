전체 검증 파이프라인을 순차 실행하세요.

**각 단계를 순서대로 실행하고, 실패 시 해당 단계에서 중단하여 수정합니다.**

## 1단계: API 컴파일
```bash
cd apps/api && ./gradlew.bat classes --console=plain
```

## 2단계: API 테스트
```bash
cd apps/api && ./gradlew.bat test --console=plain
```
Docker가 필요합니다. 실패 시 테스트 분석 후 수정.

## 3단계: 웹 타입 체크
```bash
cd apps/web && npx tsc --noEmit --pretty
```

## 4단계: 웹 린트
```bash
cd apps/web && npm run lint
```

## 5단계: 디자인 체크
변경된 TSX 파일에 대해 DESIGN.md 규칙 준수 검증 (`/design-check` 로직 실행).

## 결과 보고

각 단계 결과를 테이블로 요약:
| 단계 | 결과 | 비고 |
|------|------|------|
| API 컴파일 | PASS/FAIL | ... |
| API 테스트 | PASS/FAIL | N개 테스트 |
| 웹 타입 | PASS/FAIL | ... |
| 웹 린트 | PASS/FAIL | ... |
| 디자인 | PASS/FAIL | N개 위반 |

모든 단계 PASS 시 "All checks passed" 보고.
