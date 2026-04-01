변경된 TSX 파일의 디자인 시스템 준수 여부를 검증하세요.

**절차:**

1. 변경된 파일 확인:
```bash
git diff --name-only HEAD | grep '\.tsx$'
```
(staged 포함: `git diff --name-only --cached HEAD`)

2. 각 파일을 DESIGN.md 규칙과 대조 검증:

**금지 패턴 (즉시 수정):**
| 패턴 | 대체 |
|------|------|
| `bg-white` | `bg-card` |
| `text-gray-*`, `bg-gray-*` | `text-on-surface-variant`, `bg-surface-container` 등 토큰 |
| `bg-blue-*`, `text-blue-*` | `bg-primary`, `text-primary` 등 토큰 |
| `bg-[#...]`, `text-[#...]` | globals.css 토큰 사용 |
| `font-inter`, `font-roboto` | `font-headline`, `font-sans`, `font-mono` |
| `rounded-2xl`, `rounded-3xl` | `rounded-lg` (컨테이너/버튼), `rounded-full` (뱃지) |

**필수 패턴 (누락 시 추가):**
- `outline-none` 사용 시 → `focus:ring-2 focus:ring-primary/20` 동반
- 버튼/터치 타깃 → `min-h-[44px]` 또는 `py-2.5` 이상
- 상태 뱃지 → `getApplicationStatusClassName()` 사용 여부

3. 위반 사항을 파일:라인 형식으로 보고하고 자동 수정 제안.
4. 위반이 없으면 "Design check passed" 보고.
