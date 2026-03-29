# Executive Demo 90s Typed Cut

목표:

- 약 `1분 30초`
- 화면 전환을 더 천천히
- 회원가입, 프로필, 지원서 작성 입력이 실제 타이핑처럼 보이게

실행:

```powershell
$env:DEMO_BASE_URL="http://127.0.0.1:3181"
$env:DEMO_HUMAN_TYPING="1"
$env:DEMO_TYPE_DELAY="90"
node scripts/executive-demo-90s-typed-record.cjs
```

출력:

- `output/demo/video/hireflow-executive-demo-90s-typed-*.webm`

이미 있는 90초 슬로우 컷:

- `output/demo/final/hireflow-executive-demo-90s.webm`
- `output/demo/final/hireflow-executive-demo-90s.mp4`
- `output/demo/final/hireflow-executive-demo-90s.srt`

권장:

- 실제 녹화는 `mkv`
- 종료 후 `mp4` remux
- 지금처럼 `webm -> mp4` 재인코딩은 가능하면 마지막 단계에서만 수행
