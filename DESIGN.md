---
name: HireFlow
description: "지원의 전 과정을 하나의 커리어 시그널로 연결하는 채용 경험"
colors:
  signal-blue: "#1746E8"
  signal-foreground: "#F7FAFF"
  signal-accent: "#D8FF59"
  signal-accent-hover: "#C7F43B"
  signal-ink: "#0A1426"
  paper: "#F7F9FB"
  surface: "#FFFFFF"
  surface-low: "#F2F5F8"
  surface-mid: "#EAEEF3"
  surface-high: "#DEE4EB"
  ink: "#121C28"
  ink-soft: "rgba(18, 28, 40, 0.68)"
  outline: "rgba(18, 28, 40, 0.28)"
  hairline: "rgba(18, 28, 40, 0.10)"
  action-ink: "#16283C"
  action-hover: "#22344A"
  action-foreground: "#FFFFFF"
  operational-blue: "#0369A1"
  operational-blue-strong: "#075985"
  footer-ink: "#0C1826"
  footer-foreground: "#E9EFF6"
  footer-soft: "#93A5B8"
  success: "#16A34A"
  destructive: "#DC2626"
  error-surface: "#FEE2E2"
typography:
  display:
    fontFamily: "Sora, Wanted Sans Variable, sans-serif"
    fontSize: "clamp(3.25rem, 7vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, Wanted Sans Variable, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, Wanted Sans Variable, sans-serif"
    fontSize: "clamp(1.45rem, 2.3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Wanted Sans Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Spline Sans Mono, Wanted Sans Variable, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  none: "0px"
  compact: "6.4px"
  control: "8px"
  container: "11.2px"
  pill: "999px"
spacing:
  tight: "8px"
  related: "12px"
  control: "20px"
  container: "24px"
  cluster: "40px"
  section-mobile: "64px"
  section-desktop: "96px"
components:
  signal-action:
    backgroundColor: "{colors.signal-accent}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  operational-action:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.action-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "44px"
  filter-selected:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.action-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "44px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    height: "48px"
  job-index-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "28px 20px"
    height: "176px"
---

# Design System: HireFlow

## Overview

**Creative North Star: "Career Signal Atlas"**

HireFlow의 시각 세계는 지원의 전 과정을 하나의 커리어 시그널로 읽게 한다. 장식적인 SaaS 카드 모음 대신 강한 색면, 실제 공고 데이터, 궤도와 경로, 정렬된 인덱스를 사용해 발견부터 지원과 상태 확인까지 같은 방향 감각을 유지한다.

공개 탐색 화면은 시그널 블루, 액션 라임, 깊은 잉크, 차가운 종이의 대비로 대담하게 설득한다. 첫 화면은 왼쪽의 큰 한국어 명제와 오른쪽의 전형 단계 트래커 예시를 짝지으며, 단 하나의 라임 행동이 다음 단계로 이끈다. 공고 탐색은 카드 그리드가 아니라 메타데이터가 정렬된 편집형 인덱스 행으로 이어진다.

지원서 작성과 진행 상태, 공유 컴포넌트, 관리자 워크스페이스는 기존의 차분한 운영 언어를 유지한다. 이 영역은 종이와 순백 표면, 잉크 행동색, 제한적인 운영 블루를 사용한다. 관리자는 1024px 이상의 데스크톱 작업 공간이며, 공개 화면의 표현적인 색면을 그대로 가져오지 않는다.

**Key Characteristics:**

- 실제 공고와 전형 흐름이 장식 이미지보다 먼저 보인다.
- 시그널 블루 색면과 액션 라임 하나가 공개 탐색의 방향을 만든다.
- 순서가 분명한 전형 단계 트래커와 편집형 공고 인덱스가 발견, 비교, 다음 단계의 이야기를 연결한다.
- 운영 화면은 근단색 표면과 촘촘한 정보 위계를 유지한다.
- 모든 상호작용은 키보드 포커스, 44px 터치 영역, 모션 감소 설정을 존중한다.

## Colors

공개 탐색은 선명한 시그널 팔레트를, 운영 화면은 차분한 잉크와 종이 팔레트를 사용한다. 색상 값의 단일 기준은 이 문서의 frontmatter와 `apps/web/src/app/globals.css`다.

### Primary

- **Signal Blue:** 공개 홈의 주 색면과 커리어 시그널 세계를 소유한다. 일반 링크나 작은 상태 표시에 분산 사용하지 않는다.
- **Signal White:** 블루 위 제목, 경로, 지도 라벨 표면에 사용해 정보가 색면에서 또렷하게 읽히게 한다.

### Secondary

- **Action Lime:** 블루 또는 깊은 잉크 색면에서 가장 중요한 행동 하나와 시그널 노드를 표시한다.
- **Pressed Lime:** 라임 행동의 hover 상태에만 사용한다.

### Tertiary

- **Operational Ink:** 지원서, 상태 화면, 관리자 도구의 기본 filled 행동색이다.
- **Operational Blue:** 링크, 활성 상태, 포커스 링, 라이브 상태처럼 운영 의미를 전달하는 작은 신호에만 사용한다.
- **Success Green, Destructive Red:** 성공과 위험 상태에만 사용한다. 상태 배지는 `shared/lib/recruitment.ts`의 클래스 생성 함수를 단일 소스로 삼는다.

### Neutral

- **Cool Paper:** 공개 목록과 운영 화면의 기본 캔버스다.
- **Pure Surface:** 카드, 입력, 활성 내비게이션의 명확한 표면이다.
- **Low, Mid, High Surface:** 중첩 카드 대신 정보 그룹과 표면 위계를 만든다.
- **Reading Ink, Soft Ink:** 본문 위계를 담당한다. Soft Ink는 보조 설명과 메타데이터에만 사용한다.
- **Structural Outline, Quiet Hairline:** 선택 가능한 경계와 인덱스 구획을 구분한다.
- **Deep Signal Ink, Footer Ink:** 공고 인덱스의 큰 색면과 공개 푸터를 닫는 깊은 배경이다.
- **Footer White, Footer Soft:** 어두운 푸터의 제목과 보조 문장을 분리한다.

**The One Lime Action Rule.** 하나의 블루 또는 깊은 잉크 밴드에는 라임 filled 행동을 하나만 둔다. 라임의 희소성이 우선순위를 만든다.

**The Operational Separation Rule.** 공개 탐색의 시그널 블루와 라임을 관리자 표면의 장식색으로 가져오지 않는다. 관리자는 잉크 행동과 운영 블루 신호를 유지한다.

## Typography

**Display Font:** Sora, 한글은 Wanted Sans Variable로 대체

**Body Font:** Wanted Sans Variable, Apple SD Gothic Neo와 Malgun Gothic 대체

**Label/Mono Font:** Spline Sans Mono, 한글은 Wanted Sans Variable로 대체

**Character:** Sora의 기하학적 구조가 큰 문장을 포스터처럼 세우고, Wanted Sans가 긴 한국어 설명과 조작 문구를 안정적으로 읽게 한다. Spline Sans Mono는 공고 수, 날짜, 단계 수, 운영 메타데이터를 인덱스처럼 정렬한다.

### Hierarchy

- **Display** (600, `clamp(3.25rem, 7vw, 6rem)`, 0.98): 공개 홈과 공고 탐색의 첫 명제다. 한 문장의 폭은 약 11자 수준으로 제한해 왼쪽 질량을 만든다.
- **Headline** (600, `clamp(2.5rem, 5vw, 4.5rem)`, 1.03): 공개 섹션 제목과 주요 전환점에 사용한다.
- **Title** (600, `clamp(1.45rem, 2.3vw, 2.25rem)`, 1.25): 편집형 공고 행의 역할명과 중요한 콘텐츠 제목이다.
- **Body** (400, 1rem, 1.75): 설명과 조작 문구의 기본이다. 긴 본문은 약 65ch 이내로 유지하고 한국어 단어 중간 줄바꿈을 막는다.
- **Label** (500, 0.6875rem, 0.14em, uppercase): 영문 카운터, 날짜, D-day, 단계 수, 테이블 메타데이터에 사용한다. 숫자는 tabular 설정으로 열을 맞춘다.

**The Korean Rhythm Rule.** 한국어 제목은 `word-break: keep-all`과 균형 줄바꿈을 유지한다. 일반 display와 headline은 조밀하지만 뭉치지 않는 자간을 사용하고, 더 촘촘한 자간은 구현된 공고 제목이나 대형 영문 로고처럼 검증된 역할에만 허용한다.

## Layout

공개 화면의 기본 컨테이너는 최대 1280px이며 좌우 여백은 모바일 24px, 중형 이상 64px이다. 주요 섹션의 수직 여백은 모바일 64px 이상, 데스크톱 96px 이상으로 두되 실제 콘텐츠 밀도에 맞춰 80px과 112px 단계를 사용할 수 있다. 관련 요소는 8px에서 12px, 그룹 사이는 40px 이상으로 대비를 만든다.

홈 첫 화면은 12열 비대칭 그리드다. 데스크톱에서 문장 영역은 7열, 전형 단계 트래커는 5열을 사용한다. 큰 한국어 명제 아래에 설명과 단일 행동을 두고, 오른쪽 트래커는 지원서 제출, 서류 검토, 면접, 최종 결과의 순서를 보여준다. 로그인 전에는 `지원 흐름 화면 예시`라고 명시하고 실제 개인 지원 상태처럼 표현하지 않는다. 격자 텍스처는 이 트래커가 있는 시그널 블루 색면에서만 허용한다.

공고 탐색은 섹션 제목, 설명, 수량을 상단 규칙선에 맞추고, 각 공고를 최소 높이 176px의 가로 인덱스 행으로 배열한다. 행은 순번, 역할 정보, 고용 조건과 기간, 전형 미리보기, 원형 화살표 순서로 정렬한다. 카드 그리드로 되돌리지 않는다.

지원 위저드는 최대 896px, 인증 폼은 최대 448px를 기준으로 한다. 관리자 화면은 `AdminRailNav`와 전폭 메인 영역으로 구성하며 `AdminMobileGuard`가 1024px 미만을 차단한다. 관리자 테이블은 sticky header, 16px 행 패딩, 정렬된 숫자와 날짜를 사용한다.

모바일에서 공개 첫 화면은 문장과 트래커를 세로로 쌓고 트래커 높이를 384px로 줄인다. 네 단계의 순서는 모두 유지하되 라벨과 노드 크기를 줄여 의미를 보존한다. 공고 행은 단일 열이 되고 원형 화살표는 오른쪽 위에 고정된다. 공개 내비게이션은 같은 링크와 인증 행동을 더 짧은 배열로 재배치한다. 채용 유형은 native disclosure 안에서 필요할 때만 펼치고, 홈은 최대 다섯 개의 실제 공고만 서버 렌더링해 탐색 화면보다 가볍게 유지한다.

**The Meaningful Geometry Rule.** 경로와 카운터는 실제 데이터 관계를 설명하거나 예시임을 명확히 밝힌 순서를 보여줄 때만 사용한다. 비어 있는 장식 배경으로 반복하지 않는다.

## Elevation & Depth

HireFlow는 색면, 표면 톤, 1px 경계를 먼저 사용하고 그림자를 상태나 중요한 부유 요소에만 더한다. 공개 히어로와 공고 인덱스는 기본적으로 평평하며, 지도 라벨과 핵심 행동만 주변 잉크를 머금은 짧은 그림자를 사용한다. 관리자 카드와 팝오버는 기존 3단계 잉크 틴트 그림자를 유지한다.

### Shadow Vocabulary

- **Elevation 1** (`0 1px 2px rgba(18, 28, 40, 0.05)`): 정지 카드와 활성 내비게이션의 최소 분리다.
- **Elevation 2** (`0 2px 8px rgba(18, 28, 40, 0.07), 0 1px 2px rgba(18, 28, 40, 0.04)`): hover 카드, 드롭다운, 툴팁이다.
- **Elevation 3** (`0 16px 40px -16px rgba(18, 28, 40, 0.18)`): 모달과 중요한 상위 표면이다.
- **Signal Action** (`0 12px 32px -18px rgba(10, 20, 38, 0.75)`): 라임 CTA를 블루 색면에서 분리한다.
- **Signal Label** (`0 10px 28px -18px rgba(10, 20, 38, 0.8)`): 지도 역할 라벨만 가볍게 띄운다.

기본 공개 내비게이션은 읽기 안정성을 위해 제한된 8px backdrop blur를 사용할 수 있다. 장식 목적의 글래스모피즘, 광택, 대형 glow는 사용하지 않는다.

**The Flat First Rule.** 정지 상태의 구조는 색면과 hairline으로 설명한다. 그림자는 hover, 오버레이, 신호 라벨처럼 깊이가 실제 의미를 가질 때만 나타난다.

## Shapes

운영 컨트롤과 카드에는 절제된 곡률을 사용하고, 공개 신호 세계에는 원과 궤도를 명확한 문법으로 사용한다. 기본 버튼과 입력은 8px, 큰 카드와 패널은 약 11px이다. `rounded-2xl`과 `rounded-3xl` 같은 부풀린 컨테이너는 사용하지 않는다.

완전한 pill은 행동, 필터, 활성 내비게이션, 배지에만 쓴다. 원은 시그널 노드, 상태 점, 전형 단계, 44px 방향 화살표에 사용한다. 공고 목록 자체는 둥근 카드가 아니라 상하 hairline으로 나뉜 평평한 행이다.

브랜드 route mark는 하나의 흐름이 여러 접점을 통과하는 경로를 그린다. 헤더에서는 currentColor 단색 선형 마크로 주변 톤에 적응하고, favicon은 시그널 블루의 22px 곡률 타일 위에 흰 경로와 라임 노드 세 개를 사용한다.

**The Orbit and Index Rule.** 원형 기하는 진행과 연결을, 직선형 인덱스는 비교를 표현한다. 두 형태의 역할을 바꾸거나 모든 컨테이너를 pill로 만들지 않는다.

## Components

### Buttons

- **Signal CTA:** 라임 배경, 깊은 시그널 잉크, 완전한 pill, 48px 높이다. 블루 또는 푸터 잉크 밴드에서 가장 중요한 행동 하나에만 사용한다.
- **Operational Primary:** 잉크 배경, 흰 텍스트, 8px 곡률이다. 지원서와 관리자 작업의 주 행동이며 공개 탐색의 라임 CTA와 경쟁하지 않는다.
- **Outline and Ghost:** 순백 표면과 hairline 또는 투명 배경을 사용한다. hover에서 운영 블루나 낮은 표면 톤으로 반응한다.
- **States:** 모든 사용자 행동은 최소 44px 터치 영역과 명시적 `focus-visible` 2px 링을 갖는다. press는 1px 아래 이동만 허용하며 disabled는 상호작용을 막고 불투명도를 낮춘다.

### Chips

- **Filter:** 44px 높이의 pill이다. 선택 상태는 운영 잉크 filled, 미선택 상태는 순백과 hairline이며 hover에서 운영 블루로 경계를 강조한다. 모바일에서는 채용 유형을 접힌 disclosure로 시작하고 결과 수를 live region으로 알린다. 초기화 뒤에는 검색 필드로 포커스를 돌려준다.
- **Status:** 상태 배지는 pill, 작은 현재색 점, 얇은 inset ring으로 구성한다. 성공, 진행, 대기, 실패 색의 결정은 공유 recruitment 유틸리티에서만 한다.

### Cards / Containers

- **Public Discovery:** 공고는 카드가 아니라 편집형 인덱스 행이다. hover와 키보드 focus에서 배경에 운영 블루를 6% 섞고 제목과 원형 화살표를 오른쪽으로 이동한다.
- **Operational Surface:** 카드와 패널은 순백, 약 11px 곡률, hairline, 24px 내부 여백을 기본으로 한다. 중첩 카드 대신 낮은 표면 톤이나 구분선을 사용한다.
- **Empty State:** 실제 빈 목록은 절제된 카드 또는 상하 규칙선 영역으로 표시하고, 설명과 다음 행동을 함께 제공한다.

### Inputs / Fields

- **Search Field:** 순백 배경, hairline, 완전한 pill, 좌우 20px 여백을 사용한다. focus에서 운영 블루 경계와 낮은 강도의 2px 링을 함께 표시한다.
- **Operational Field:** 긴 폼의 입력은 8px 곡률을 유지한다. `outline: none`을 사용할 때 focus ring을 반드시 동반한다.
- **Error and Disabled:** 오류는 destructive 텍스트와 error surface를 사용하고, disabled는 의미가 사라지지 않는 범위에서 불투명도를 낮춘다.

### Navigation

- **Public Signal Header:** 홈 히어로 위에서는 absolute로 놓이며 흰 route mark와 텍스트를 사용한다. 로그인이나 대시보드 행동은 라임이고, 활성 링크는 밝은 pill 표면이다.
- **Public Default Header:** 다른 공개 화면에서는 sticky 순백 계열 표면, 1px 하단 경계, 제한된 blur를 사용한다. 모바일은 링크와 인증 행동을 같은 정보 순서로 재배치한다.
- **Admin Rail:** 40px 정사각형 아이콘 버튼, 8px 곡률, 활성 왼쪽 선, hover 툴팁을 유지한다. 공개 신호 팔레트로 재설계하지 않는다.

### Application Stage Preview

지원서 제출, 서류 검토, 면접, 최종 결과를 하나의 상승하는 직선 경로에 배치한다. 큰 단계 번호는 현재 위치를 빠르게 인식시키고, 액션 라임은 현재 단계 하나에만 사용한다. 로그인 전 화면에서는 예시임을 명시하고, 경로가 먼저 그려진 뒤 노드가 차례로 나타난다.

### Editorial Job Index

각 행은 역할명보다 작은 mono 메타데이터, 정렬된 근무 조건과 기간, 점과 선으로 압축한 실제 전형 미리보기, 44px 원형 화살표를 사용한다. hover와 focus는 같은 결과를 내며 레이아웃 변경은 Motion 13의 위치 애니메이션으로 이어진다.

### RecruitmentStepper

지원 진행 언어의 단일 소스다. 완료는 잉크 채움과 체크, 현재는 순백 중심과 운영 블루 링, 예정은 hairline 원과 번호를 사용한다. 수평과 수직 방향을 지원하며 `<ol>` 구조와 화면 읽기용 상태 텍스트를 유지한다.

### Footer and Brand Mark

모든 공개 흐름은 깊은 푸터 잉크 색면으로 닫는다. 대형 HireFlow 워드마크, 지원 여정 설명, 채용과 지원자와 법적 링크, 단 하나의 라임 CTA를 포함한다. favicon과 route mark의 경로 비율이나 세 개 노드 구조를 임의로 바꾸지 않는다.

### Feedback, Legal, and Help

공고 로딩 화면은 실제 히어로, 필터, 인덱스 행의 형태를 유지하며 `aria-busy`와 polite live region으로 상태를 알린다. 조회 실패에는 안전한 설명과 다시 시도 행동을 제공하고, 검색 결과가 없으면 필터 초기화를 같은 영역에서 제공한다. 법적 고지는 focus trap, Escape 닫기, trigger focus 복원을 지원하는 Base UI dialog를 사용한다. 지원 도움말은 공고 목록 아래의 접힌 native disclosure로 제공해 기본 탐색을 방해하지 않는다.

**The Motion Contract Rule.** 모션은 경로와 상태 변화를 설명하는 데만 사용한다. `LazyMotion`과 `MotionConfig`의 사용자 모션 감소 설정을 유지하고, `prefers-reduced-motion`에서는 궤도, entrance, layout, hover transform, 자식 화살표 이동을 모두 정지한다.

## Do's and Don'ts

### Do:

- **Do** 실제 공고 정보와 명확히 표시된 전형 단계 예시를 공개 화면의 시각적 주인공으로 사용한다.
- **Do** 블루 또는 깊은 잉크 밴드에서 라임 CTA를 하나만 강조한다.
- **Do** 공고 비교에는 hairline으로 구획한 편집형 행과 정렬된 mono 메타데이터를 사용한다.
- **Do** 지원 진행 상태를 `RecruitmentStepper`로 표현하고 텍스트 상태도 함께 제공한다.
- **Do** 한국어 제목에 단어 보존 줄바꿈을 적용하고 본문 행간을 넉넉하게 유지한다.
- **Do** 공개 화면의 터치 영역과 키보드 focus를 44px 이상과 명시적 링으로 검증한다.
- **Do** 관리자 테이블, 상태 배지, 레일 내비게이션의 기존 운영 규칙을 유지한다.
- **Do** route mark와 favicon에서 경로와 세 개 노드의 식별 구조를 유지한다.

### Don't:

- **Don't** 공개 첫 화면을 중앙 정렬한 제네릭 SaaS 카드 히어로로 되돌리지 않는다.
- **Don't** 공고 탐색을 같은 크기의 둥근 카드 그리드로 바꾸지 않는다.
- **Don't** 격자, 경로, 노드를 정보와 무관한 장식으로 반복하지 않는다.
- **Don't** 관리자 화면에 대면적 시그널 블루나 라임을 장식적으로 사용하지 않는다.
- **Don't** 카드 안에 카드를 겹치거나 큰 radius, gradient text, 네온, 장식용 glass 효과를 사용하지 않는다.
- **Don't** 이모지 장식, 과장된 bounce, elastic easing, width 또는 height 애니메이션을 사용하지 않는다.
- **Don't** 모션 감소 설정에서 경로, 레이아웃, hover 이동을 남겨두지 않는다.
- **Don't** 컴포넌트에서 raw 색을 새로 만들지 않는다. 먼저 공유 토큰을 추가하고 의미에 맞게 사용한다.
