API 컴파일 체크를 실행하세요.

```bash
cd apps/api && ./gradlew.bat classes --console=plain
```

**성공 시:** "BUILD SUCCESSFUL" 확인 후 간단히 보고.
**실패 시:**
1. 에러 메시지에서 파일명과 라인 번호 추출
2. 해당 파일을 읽고 문제 분석
3. 수정 후 재컴파일하여 성공 확인
