-- Manual demo seed for vibe-rec.
-- Purpose: refresh the demo dataset after deployment without registering a new Flyway migration.
-- Usage example:
--   docker exec -i vibe-rec-postgres psql -v ON_ERROR_STOP=1 -U vibe_rec -d vibe_rec < apps/api/src/main/resources/db/seed/demo-seed.sql
-- Warning: this script truncates recruit/platform demo data and rebuilds it from scratch.

BEGIN;

truncate table
    recruit.notification_log,
    recruit.evaluation,
    recruit.interview,
    recruit.application_attachment,
    recruit.application_answer,
    recruit.application_language,
    recruit.application_certification,
    recruit.application_skill,
    recruit.application_experience,
    recruit.application_education,
    recruit.application_resume_raw,
    recruit.application,
    recruit.job_posting_question,
    recruit.job_posting_step,
    recruit.job_posting,
    platform.candidate_profile_language,
    platform.candidate_profile_certification,
    platform.candidate_profile_skill,
    platform.candidate_profile_experience,
    platform.candidate_profile_education,
    platform.candidate_profile,
    platform.candidate_session,
    platform.candidate_account,
    platform.admin_session,
    platform.admin_account
restart identity cascade;

create temporary table demo_admin_seed (
    username                varchar(80) primary key,
    display_name            varchar(120) not null,
    role                    varchar(40) not null,
    last_authenticated_at   timestamptz
) on commit drop;

insert into demo_admin_seed (username, display_name, role, last_authenticated_at)
values
    ('ops.lead', '오현주', 'SUPER_ADMIN', timestamptz '2026-03-28 09:12:00+09'),
    ('recruiter.minji', '김민지', 'ADMIN', timestamptz '2026-03-27 18:40:00+09'),
    ('interview.sora', '박소라', 'ADMIN', timestamptz '2026-03-28 08:55:00+09'),
    ('manager.jaehyun', '이재현', 'SUPER_ADMIN', timestamptz '2026-03-26 20:15:00+09'),
    ('ta.sungho', '정성호', 'ADMIN', timestamptz '2026-03-25 11:20:00+09');

insert into platform.admin_account (
    username,
    display_name,
    password_hash,
    role,
    active,
    last_authenticated_at,
    created_at,
    updated_at
)
select
    demo_admin_seed.username,
    demo_admin_seed.display_name,
    crypt('demo1234!'::text, gen_salt('bf')),
    demo_admin_seed.role,
    true,
    demo_admin_seed.last_authenticated_at,
    current_timestamp,
    current_timestamp
from demo_admin_seed
order by demo_admin_seed.username;

insert into platform.admin_session (
    admin_account_id,
    token_hash,
    expires_at,
    last_seen_at,
    created_at,
    updated_at
)
select
    admin_account.id,
    encode(digest('demo-admin-session-' || demo_admin_seed.username, 'sha256'), 'hex'),
    timestamptz '2026-06-30 23:59:00+09',
    demo_admin_seed.last_authenticated_at,
    demo_admin_seed.last_authenticated_at - interval '2 day',
    demo_admin_seed.last_authenticated_at
from demo_admin_seed
join platform.admin_account admin_account
    on admin_account.username = demo_admin_seed.username;

create temporary table demo_job_posting_seed (
    id                      bigint primary key,
    legacy_anno_id          bigint not null,
    public_key              varchar(80) not null,
    family_code             varchar(20) not null,
    title                   varchar(200) not null,
    headline                varchar(200) not null,
    description             text not null,
    employment_type         varchar(40) not null,
    recruitment_category    varchar(20) not null,
    recruitment_mode        varchar(20) not null,
    location                varchar(120) not null,
    status                  varchar(20) not null,
    published               boolean not null,
    opens_at                timestamptz not null,
    closes_at               timestamptz
) on commit drop;

insert into demo_job_posting_seed (
    id,
    legacy_anno_id,
    public_key,
    family_code,
    title,
    headline,
    description,
    employment_type,
    recruitment_category,
    recruitment_mode,
    location,
    status,
    published,
    opens_at,
    closes_at
)
values
    (
        1001, 94001, 'platform-backend-engineer', 'BE',
        '백엔드 플랫폼 엔지니어',
        '지원자 5,000명 규모 유입에도 흔들리지 않는 채용 운영 플랫폼 백엔드를 함께 만듭니다.',
        'Spring Boot, PostgreSQL, 비동기 이벤트 흐름을 기반으로 공고, 지원서, 면접, 최종결정 데이터를 안정적으로 다룹니다. 운영 지표와 응답 성능을 함께 챙길 수 있는 4년 이상 경력자를 찾습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 성수(주 2회 출근)', 'OPEN', true,
        timestamptz '2026-03-03 09:00:00+09', timestamptz '2026-04-12 18:00:00+09'
    ),
    (
        1002, 94002, 'product-designer', 'DESIGN',
        '프로덕트 디자이너',
        '지원자 여정과 운영자 화면을 한 번에 설계할 수 있는 시니어 디자이너를 찾습니다.',
        '공고 탐색, 지원 작성, 관리자 검토 화면의 정보 구조를 정리하고 디자인 시스템을 안정적으로 운영할 수 있어야 합니다. 마감된 포지션이라 결과 안내와 최종결정 흐름 검증에도 쓰기 좋습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 을지로(하이브리드)', 'CLOSED', true,
        timestamptz '2026-01-27 09:00:00+09', timestamptz '2026-03-01 18:00:00+09'
    ),
    (
        1003, 94003, 'site-reliability-engineer', 'DEVOPS',
        'Site Reliability Engineer',
        '상시채용으로 운영 자동화와 장애 대응 체계를 함께 만드는 SRE를 모집합니다.',
        '채용 운영 플랫폼의 배포 파이프라인, 관측 지표, 장애 대응 매뉴얼을 다듬습니다. 국내 원격 기반으로 협업하되 분기별 오프라인 워크숍에 참여할 수 있으면 좋습니다.',
        'FULL_TIME', 'EXPERIENCED', 'ROLLING', '국내 원격(분기별 오프라인 모임)', 'OPEN', true,
        timestamptz '2026-02-10 09:00:00+09', null
    ),
    (
        1004, 94004, 'people-operations-intern', 'HR',
        'People Ops 인턴',
        '면접 일정 조율과 입사 서류 운영을 꼼꼼하게 챙길 인턴을 찾습니다.',
        '채용 운영팀과 함께 지원자 안내, 면접 일정 관리, 입사 전 서류 체크리스트를 운영합니다. 신입과 인턴 전형에 맞는 빠른 응대와 문서 정리 습관이 중요합니다.',
        'INTERN', 'NEW_GRAD', 'FIXED_TERM', '서울 중구(상주)', 'OPEN', true,
        timestamptz '2026-03-10 09:00:00+09', timestamptz '2026-04-05 18:00:00+09'
    ),
    (
        1005, 94005, 'frontend-engineer-react', 'FE',
        '프론트엔드 엔지니어 (React/Next.js)',
        '지원서 작성 경험을 빠르고 명확하게 만드는 주니어 프론트엔드 엔지니어를 찾습니다.',
        'Next.js App Router, TypeScript, 접근성 중심 UI 구현 경험이 있으면 좋습니다. 제품 요구를 빠르게 화면으로 풀어내면서도 유지보수 가능한 구조를 선호하는 신입과 주니어를 환영합니다.',
        'FULL_TIME', 'NEW_GRAD', 'FIXED_TERM', '판교(주 3회 출근)', 'OPEN', true,
        timestamptz '2026-03-06 09:00:00+09', timestamptz '2026-04-20 18:00:00+09'
    ),
    (
        1006, 94006, 'fullstack-product-engineer', 'FS',
        '풀스택 프로덕트 엔지니어',
        '관리자 화면과 지원자 화면을 함께 다루며 제품 완성도를 끌어올릴 풀스택 엔지니어를 모집합니다.',
        '프론트엔드와 백엔드를 모두 건드리며 공고 운영, 질문 설계, 지원서 저장 플로우를 개선합니다. 스펙보다 배포 속도와 운영 안정성을 같이 챙긴 경험을 봅니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 강남(하이브리드)', 'OPEN', true,
        timestamptz '2026-02-24 09:00:00+09', timestamptz '2026-04-10 18:00:00+09'
    ),
    (
        1007, 94007, 'product-designer-design-system', 'DESIGN',
        '프로덕트 디자이너 (Design System)',
        '디자인 시스템과 운영 지표를 함께 보는 디자이너를 찾습니다.',
        '반복되는 채용 운영 화면을 컴포넌트로 정리하고, 관리자와 지원자 경험의 용어 체계를 통일합니다. 정성 피드백과 정량 로그를 함께 보는 분을 선호합니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 성수(하이브리드)', 'OPEN', true,
        timestamptz '2026-03-12 09:00:00+09', timestamptz '2026-04-18 18:00:00+09'
    ),
    (
        1008, 94008, 'mobile-engineer-flutter', 'MOBILE',
        '모바일 엔지니어 (Flutter)',
        '모바일 지원 경험과 알림 플로우를 책임질 Flutter 엔지니어를 찾습니다.',
        '지원 현황 확인, 일정 알림, 면접 안내 화면을 모바일 기준으로 다듬습니다. 앱 릴리즈 주기와 크래시 대응 경험이 있으면 좋습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '부산 센텀(주 2회 출근)', 'OPEN', true,
        timestamptz '2026-03-01 09:00:00+09', timestamptz '2026-04-14 18:00:00+09'
    ),
    (
        1009, 94009, 'data-analyst-growth', 'DATA',
        '데이터 분석가 (그로스/운영)',
        '채용 퍼널과 전환 지표를 운영팀이 바로 쓰도록 정리할 분석가를 찾습니다.',
        'SQL과 Python으로 지원 전환율, 일정 소요시간, 포지션별 병목을 분석합니다. 운영 현장을 이해하고 실무자가 바로 쓸 수 있는 대시보드를 만드는 분이면 좋습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 여의도(하이브리드)', 'OPEN', true,
        timestamptz '2026-02-18 09:00:00+09', timestamptz '2026-04-02 18:00:00+09'
    ),
    (
        1010, 94010, 'ml-engineer-recommendation', 'ML',
        'ML 엔지니어 (추천/매칭)',
        '공고와 지원자 매칭 품질을 높일 추천 모델 파이프라인을 함께 만듭니다.',
        '모델 서빙, 피처 파이프라인, 실험 설계를 기반으로 추천 정확도와 운영 편의성을 같이 개선합니다. 제품팀과 함께 모델 성능을 설명할 수 있는 커뮤니케이션이 중요합니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 강남(주 2회 출근)', 'OPEN', true,
        timestamptz '2026-03-08 09:00:00+09', timestamptz '2026-04-16 18:00:00+09'
    ),
    (
        1011, 94011, 'data-analyst-ops', 'DATA',
        '데이터 분석가 (채용 운영)',
        '채용 운영팀이 매주 보는 리포트를 손에 잡히게 만드는 운영 분석가를 찾습니다.',
        '채용 매니저, 면접 코디네이터, People Ops가 함께 쓰는 운영 지표를 정리합니다. Tableau나 Metabase 경험이 있으면 빠르게 적응할 수 있습니다.',
        'CONTRACT', 'EXPERIENCED', 'FIXED_TERM', '서울 종로(주 2회 출근)', 'OPEN', true,
        timestamptz '2026-02-20 09:00:00+09', timestamptz '2026-04-08 18:00:00+09'
    ),
    (
        1012, 94012, 'devops-platform-engineer', 'DEVOPS',
        'DevOps 엔지니어',
        '인프라 비용과 배포 안정성을 같이 관리할 DevOps 엔지니어를 모집합니다.',
        '쿠버네티스, IaC, 운영 관측 체계를 기반으로 개발팀 배포 리드타임을 줄입니다. 운영 효율과 장애 대응 루틴을 같이 설계해 본 분이면 좋습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '판교(하이브리드)', 'OPEN', true,
        timestamptz '2026-03-05 09:00:00+09', timestamptz '2026-04-22 18:00:00+09'
    ),
    (
        1013, 94013, 'qa-automation-engineer', 'QA',
        'QA 자동화 엔지니어',
        '릴리즈 직전 수동 확인을 줄이고 회귀 검증을 자동화할 QA 엔지니어를 찾습니다.',
        'Playwright, API 테스트, 운영 시나리오 기반 검증 경험이 있으면 좋습니다. 제품팀과 협업하며 배포 게이트를 설계한 경험을 높게 봅니다.',
        'CONTRACT', 'EXPERIENCED', 'FIXED_TERM', '서울 문정(주 2회 출근)', 'OPEN', true,
        timestamptz '2026-03-09 09:00:00+09', timestamptz '2026-04-19 18:00:00+09'
    ),
    (
        1014, 94014, 'talent-acquisition-manager', 'HR',
        '채용 매니저',
        '주요 채용 포지션의 우선순위를 조정하고 채용팀 실행 리듬을 만드는 채용 매니저를 찾습니다.',
        '채용 담당자와 면접 코디네이터를 조율하며 서류 기준, 인터뷰 운영, 최종 결정 커뮤니케이션을 정리합니다. 이해관계자 정렬과 운영 문서화가 강한 분을 선호합니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 시청(하이브리드)', 'OPEN', true,
        timestamptz '2026-02-28 09:00:00+09', timestamptz '2026-04-11 18:00:00+09'
    ),
    (
        1015, 94015, 'recruiting-coordinator', 'HR',
        '면접 코디네이터',
        '여러 인터뷰어와 지원자 일정을 동시에 맞추는 면접 코디네이터를 찾습니다.',
        '면접 일정 조율, 회의실 확보, 화상 링크 안내, 평가 리마인드까지 운영 디테일을 꼼꼼하게 챙기는 역할입니다. 계약직이지만 실무 밀도는 높습니다.',
        'CONTRACT', 'EXPERIENCED', 'FIXED_TERM', '서울 을지로(상주)', 'OPEN', true,
        timestamptz '2026-03-11 09:00:00+09', timestamptz '2026-04-06 18:00:00+09'
    ),
    (
        1016, 94016, 'hr-operations-manager', 'HR',
        'HR 운영 매니저',
        '입사 전후 행정과 운영 프로세스를 안정적으로 정리할 HR 운영 매니저를 찾았습니다.',
        '마감된 포지션이며, 채용팀과 People Ops가 함께 쓰는 운영 문서와 최종 결과 통보 흐름 검증에 적합한 데이터가 연결됩니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 종각(주 3회 출근)', 'CLOSED', true,
        timestamptz '2026-01-20 09:00:00+09', timestamptz '2026-02-26 18:00:00+09'
    ),
    (
        1017, 94017, 'backend-engineer-core-api', 'BE',
        '백엔드 엔지니어 (Core API)',
        '복잡한 채용 도메인 규칙을 API 설계로 정리할 시니어 백엔드 엔지니어를 찾았습니다.',
        '마감된 시니어 포지션으로 장애 대응, 데이터 모델링, 인터뷰 평가 데이터 정합성까지 요구하는 역할입니다. 상세 화면과 최종결정 검증에 활용할 수 있는 이력이 붙어 있습니다.',
        'FULL_TIME', 'EXPERIENCED', 'FIXED_TERM', '서울 강남(하이브리드)', 'CLOSED', true,
        timestamptz '2026-01-15 09:00:00+09', timestamptz '2026-03-12 18:00:00+09'
    ),
    (
        1018, 94018, 'machine-learning-intern', 'ML',
        'ML 엔지니어 인턴',
        '추천 실험과 데이터 정리를 함께 경험할 ML 엔지니어 인턴 포지션입니다.',
        '마감된 인턴 포지션으로 과제 전형, 인터뷰, 최종 결과 안내 데이터가 골고루 연결됩니다. 대학원생과 졸업예정자 지원 흐름을 확인하기 좋습니다.',
        'INTERN', 'NEW_GRAD', 'FIXED_TERM', '서울 강남(주 3회 출근)', 'CLOSED', true,
        timestamptz '2026-02-01 09:00:00+09', timestamptz '2026-03-15 18:00:00+09'
    ),
    (
        1019, 94019, 'mobile-qa-engineer', 'QA',
        '모바일 QA 엔지니어',
        '모바일 지원 경험과 알림 시나리오를 검증할 QA 엔지니어 포지션입니다.',
        '마감된 계약직 포지션이며 Android와 iOS 공통 시나리오, 푸시 알림, 일정 변경 대응 품질을 함께 봅니다. 지원자 상세와 면접 기록 검증에 쓰기 좋습니다.',
        'CONTRACT', 'EXPERIENCED', 'FIXED_TERM', '부산 센텀(주 2회 출근)', 'CLOSED', true,
        timestamptz '2026-02-05 09:00:00+09', timestamptz '2026-03-18 18:00:00+09'
    ),
    (
        1020, 94020, 'talent-acquisition-partner', 'HR',
        'Talent Acquisition Partner',
        '상시채용 파이프라인을 관리하며 핵심 포지션 채용 경험을 끌어올릴 TA Partner를 찾습니다.',
        '채용 브리프 정리, 서치 파이프라인 운영, 최종결정 커뮤니케이션까지 넓게 다룹니다. 상시채용 포지션이라 일부 후보자는 장기 보류와 재접촉 이력도 포함됩니다.',
        'FULL_TIME', 'EXPERIENCED', 'ROLLING', '서울 강남(주 1회 출근)', 'OPEN', true,
        timestamptz '2026-02-17 09:00:00+09', null
    );

insert into recruit.job_posting (
    id,
    legacy_anno_id,
    public_key,
    title,
    headline,
    description,
    employment_type,
    location,
    status,
    published,
    opens_at,
    closes_at,
    recruitment_category,
    recruitment_mode
)
select
    demo_job_posting_seed.id,
    demo_job_posting_seed.legacy_anno_id,
    demo_job_posting_seed.public_key,
    demo_job_posting_seed.title,
    demo_job_posting_seed.headline,
    demo_job_posting_seed.description,
    demo_job_posting_seed.employment_type,
    demo_job_posting_seed.location,
    demo_job_posting_seed.status,
    demo_job_posting_seed.published,
    demo_job_posting_seed.opens_at,
    demo_job_posting_seed.closes_at,
    demo_job_posting_seed.recruitment_category,
    demo_job_posting_seed.recruitment_mode
from demo_job_posting_seed
order by demo_job_posting_seed.id;

select setval('recruit.job_posting_id_seq', (select max(id) from recruit.job_posting), true);

insert into recruit.job_posting_step (
    job_posting_id,
    step_order,
    step_type,
    title,
    description,
    starts_at,
    ends_at
)
select
    demo_job_posting_seed.id,
    step_seed.step_order,
    step_seed.step_type,
    step_seed.title,
    step_seed.description,
    demo_job_posting_seed.opens_at + ((step_seed.step_order - 1) * interval '7 day'),
    case
        when demo_job_posting_seed.recruitment_mode = 'ROLLING' and step_seed.step_type = 'OFFER' then null
        else demo_job_posting_seed.opens_at + ((step_seed.step_order - 1) * interval '7 day') + interval '5 day'
    end
from demo_job_posting_seed
cross join lateral (
    values
        (
            1,
            'DOCUMENT',
            case
                when demo_job_posting_seed.family_code = 'DESIGN' then '포트폴리오 검토'
                else '서류 검토'
            end,
            case
                when demo_job_posting_seed.family_code = 'DESIGN' then '문제 정의 방식, 화면 구조화, 결과 설명의 밀도를 먼저 확인합니다.'
                when demo_job_posting_seed.family_code = 'HR' then '지원 동기, 채용 운영 경험, 지원자 커뮤니케이션 문서화를 먼저 확인합니다.'
                when demo_job_posting_seed.family_code in ('DATA', 'ML') then '분석과 모델링 경험이 현재 포지션의 문제 구조와 맞는지 검토합니다.'
                else '기술 깊이, 협업 방식, 최근 수행 범위가 포지션과 맞는지 검토합니다.'
            end
        ),
        (
            2,
            case
                when demo_job_posting_seed.id = 1001 then 'INTERVIEW'
                when demo_job_posting_seed.family_code in ('FE', 'DESIGN') then 'ASSIGNMENT'
                else 'INTERVIEW'
            end,
            case
                when demo_job_posting_seed.id = 1001 then '1차 기술 인터뷰'
                when demo_job_posting_seed.family_code = 'FE' then '과제 전형'
                when demo_job_posting_seed.family_code = 'DESIGN' then '과제 리뷰'
                when demo_job_posting_seed.family_code = 'HR' then '운영 인터뷰'
                when demo_job_posting_seed.family_code = 'DATA' then '분석 인터뷰'
                when demo_job_posting_seed.family_code = 'ML' then '모델링 인터뷰'
                when demo_job_posting_seed.family_code = 'QA' then '테스트 전략 인터뷰'
                else '1차 기술 인터뷰'
            end,
            case
                when demo_job_posting_seed.id = 1001 then '대용량 지원 흐름에서의 API 설계, 데이터 정합성, 장애 대응 경험을 중심으로 확인합니다.'
                when demo_job_posting_seed.family_code = 'FE' then '지원서 플로우 구현, 상태 관리, 접근성 판단을 과제 결과물로 확인합니다.'
                when demo_job_posting_seed.family_code = 'DESIGN' then '문제 재정의, 플로우 설계, 디자인 시스템 적용 방식을 결과물로 확인합니다.'
                when demo_job_posting_seed.family_code = 'HR' then '면접 일정 조율, 이해관계자 커뮤니케이션, 운영 우선순위 판단을 확인합니다.'
                when demo_job_posting_seed.family_code = 'DATA' then '지표 정의, SQL 작성 습관, 리포트 전달 방식을 확인합니다.'
                when demo_job_posting_seed.family_code = 'ML' then '모델 품질 검증, 피처 파이프라인, 실험 설계 경험을 확인합니다.'
                when demo_job_posting_seed.family_code = 'QA' then '회귀 범위 설계, 릴리즈 게이트, 결함 재현 문서화를 확인합니다.'
                else '최근 프로젝트에서 맡은 기술적 의사결정과 운영 안정화 경험을 확인합니다.'
            end
        ),
        (
            3,
            'INTERVIEW',
            case
                when demo_job_posting_seed.family_code = 'DESIGN' then '직무 인터뷰'
                when demo_job_posting_seed.family_code = 'HR' then '협업 인터뷰'
                when demo_job_posting_seed.family_code in ('DATA', 'ML') then '심층 인터뷰'
                else '협업 인터뷰'
            end,
            case
                when demo_job_posting_seed.family_code = 'DESIGN' then '리서치 해석, 우선순위 판단, 제품팀 협업 방식을 확인합니다.'
                when demo_job_posting_seed.family_code = 'HR' then '채용 매니저와 인터뷰어를 조율하는 커뮤니케이션 스타일을 확인합니다.'
                when demo_job_posting_seed.family_code in ('DATA', 'ML') then '분석 결과를 제품과 운영팀이 이해할 수 있게 설명하는 방식을 확인합니다.'
                else '실무 협업 방식, 피드백 수용, 일정 리스크 공유 습관을 확인합니다.'
            end
        ),
        (
            4,
            'OFFER',
            '처우 및 입사 조율',
            '최종 합격 시점의 처우, 입사 일정, 근무 형태를 조율합니다.'
        )
) as step_seed(step_order, step_type, title, description);

insert into recruit.job_posting_question (
    job_posting_id,
    question_text,
    question_type,
    choices,
    required,
    sort_order
)
select
    demo_job_posting_seed.id,
    question_seed.question_text,
    question_seed.question_type,
    question_seed.choices,
    true,
    question_seed.sort_order
from demo_job_posting_seed
cross join lateral (
    values
        (
            1,
            case
                when demo_job_posting_seed.family_code = 'FE' then '사용자 경험이나 렌더링 성능을 개선했던 사례를 구체적으로 적어 주세요.'
                when demo_job_posting_seed.family_code = 'DESIGN' then '디자인 시스템이나 핵심 플로우를 개선해 결과를 만든 사례를 적어 주세요.'
                when demo_job_posting_seed.family_code = 'BE' then '트래픽 증가나 장애 상황에서 시스템을 안정화했던 경험을 적어 주세요.'
                when demo_job_posting_seed.family_code = 'FS' then '프론트와 백엔드를 함께 다뤄 문제를 해결한 사례를 적어 주세요.'
                when demo_job_posting_seed.family_code = 'MOBILE' then '앱 성능이나 릴리즈 품질을 개선한 경험을 적어 주세요.'
                when demo_job_posting_seed.family_code = 'DATA' then '데이터를 근거로 운영 또는 제품 의사결정을 바꾼 사례를 적어 주세요.'
                when demo_job_posting_seed.family_code = 'ML' then '모델 성능이나 추천 품질을 개선한 실험 사례를 적어 주세요.'
                when demo_job_posting_seed.family_code = 'DEVOPS' then '장애 대응이나 배포 자동화를 개선한 경험을 적어 주세요.'
                when demo_job_posting_seed.family_code = 'QA' then '회귀 테스트 범위를 설계하거나 품질 게이트를 만든 경험을 적어 주세요.'
                else '지원 동기와 함께 채용 운영에서 복잡한 일정이나 이해관계자를 조율했던 경험을 적어 주세요.'
            end,
            'TEXT',
            null::jsonb
        ),
        (
            2,
            case
                when demo_job_posting_seed.family_code = 'FE' then '최근 1년간 가장 자주 사용한 프론트엔드 스택을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'DESIGN' then '가장 자신 있는 디자인 문제 유형을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'BE' then '최근 주력으로 다룬 백엔드 기술 조합을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'FS' then '가장 자신 있는 구현 범위를 골라 주세요.'
                when demo_job_posting_seed.family_code = 'MOBILE' then '주로 개발한 모바일 플랫폼을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'DATA' then '주요 분석 도구 조합을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'ML' then '최근 가장 많이 사용한 ML 스택을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'DEVOPS' then '주로 운영한 인프라 환경을 골라 주세요.'
                when demo_job_posting_seed.family_code = 'QA' then '가장 익숙한 자동화 도구를 골라 주세요.'
                else '가장 자신 있는 채용 운영 영역을 골라 주세요.'
            end,
            'CHOICE',
            case
                when demo_job_posting_seed.family_code = 'FE' then '["React/Next.js","TypeScript SPA","React Native"]'::jsonb
                when demo_job_posting_seed.family_code = 'DESIGN' then '["운영 도구 UX","디자인 시스템","모바일 앱 UX"]'::jsonb
                when demo_job_posting_seed.family_code = 'BE' then '["Java/Spring/PostgreSQL","Kotlin/Spring","Node.js/PostgreSQL"]'::jsonb
                when demo_job_posting_seed.family_code = 'FS' then '["React + Spring","Next.js + Node.js","React + Kotlin"]'::jsonb
                when demo_job_posting_seed.family_code = 'MOBILE' then '["Flutter","Android Native","iOS Native"]'::jsonb
                when demo_job_posting_seed.family_code = 'DATA' then '["SQL + Python","SQL + Tableau","Python + BI"]'::jsonb
                when demo_job_posting_seed.family_code = 'ML' then '["Python + PyTorch","Python + scikit-learn","Python + Spark"]'::jsonb
                when demo_job_posting_seed.family_code = 'DEVOPS' then '["AWS + Kubernetes","AWS + Terraform","GCP + Kubernetes"]'::jsonb
                when demo_job_posting_seed.family_code = 'QA' then '["Playwright","Cypress","Postman/Newman"]'::jsonb
                else '["채용 운영","인터뷰 코디네이션","오퍼 및 입사 조율"]'::jsonb
            end
        ),
        (
            3,
            case
                when demo_job_posting_seed.family_code = 'FE' then '디자인 시스템과 협업하며 속도와 품질을 함께 맞출 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'DESIGN' then '정성 피드백과 사용 로그를 함께 해석해 우선순위를 정할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'BE' then '운영 이슈가 있는 시스템의 병목을 구조적으로 설명할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'FS' then '문제 정의부터 배포까지 한 번에 끌고 갈 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'MOBILE' then '앱 릴리즈 이슈와 크래시 대응을 리드할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'DATA' then 'SQL과 리포트로 운영팀 의사결정을 지원할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'ML' then '실험 설계와 모델 성능 해석을 함께 설명할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'DEVOPS' then '배포 자동화와 장애 대응 루틴을 동시에 개선할 자신감을 1점부터 5점으로 표시해 주세요.'
                when demo_job_posting_seed.family_code = 'QA' then '릴리즈 게이트와 회귀 범위를 설계할 자신감을 1점부터 5점으로 표시해 주세요.'
                else '여러 인터뷰어와 지원자 일정을 동시에 조율할 자신감을 1점부터 5점으로 표시해 주세요.'
            end,
            'SCALE',
            null::jsonb
        )
) as question_seed(sort_order, question_text, question_type, choices);

create temporary table demo_candidate_seed on commit drop as
with base as (
    select
        gs as seed_no,
        case when gs <= 140 then 'CORE' else 'HOTSPOT' end as seed_track,
        (array['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황'])[((gs - 1) % 16) + 1] as surname_ko,
        (array['kim','lee','park','choi','jung','kang','jo','yoon','jang','lim','han','oh','seo','shin','kwon','hwang'])[((gs - 1) % 16) + 1] as surname_en,
        (array[
            '민서','지훈','서연','현우','수빈','도윤','예린','태현','지민','하린',
            '준호','소연','민준','유진','승현','나연','도현','가은','준서','채원',
            '연우','세진','지우','선우','유나','정우','보민','하준','아린','재윤'
        ])[((floor((gs - 1) / 16)::int % 30) + 1)] as given_ko,
        (array[
            'minseo','jihoon','seoyeon','hyunwoo','subin','doyoon','yerin','taehyun','jimin','harin',
            'junho','soyeon','minjun','yujin','seunghyun','nayeon','dohyun','gaeun','junseo','chaewon',
            'yeonwoo','sejin','jiwoo','sunwoo','yuna','jungwoo','bomin','hajun','arin','jaeyoon'
        ])[((floor((gs - 1) / 16)::int % 30) + 1)] as given_en,
        (array['gmail.com','naver.com','kakao.com','outlook.com','icloud.com'])[((gs - 1) % 5) + 1] as email_domain
    from generate_series(1, 5140) as gs
),
assigned as (
    select
        base.seed_no,
        base.seed_track,
        case
            when base.seed_no between 1 and 16 then 'FE'
            when base.seed_no between 17 and 28 then 'BE'
            when base.seed_no between 29 and 44 then 'DESIGN'
            when base.seed_no between 45 and 56 then 'MOBILE'
            when base.seed_no between 57 and 70 then 'DATA'
            when base.seed_no between 71 and 82 then 'ML'
            when base.seed_no between 83 and 94 then 'DEVOPS'
            when base.seed_no between 95 and 106 then 'QA'
            when base.seed_no between 107 and 140 then 'HR'
            else case base.seed_no % 5
                when 0 then 'QA'
                when 1 then 'BE'
                when 2 then 'DEVOPS'
                when 3 then 'DATA'
                else 'FS'
            end
        end as family_code,
        case
            when base.seed_no between 1 and 10 then 1005
            when base.seed_no between 11 and 16 then 1006
            when base.seed_no between 17 and 24 then 1017
            when base.seed_no between 25 and 28 then 1006
            when base.seed_no between 29 and 38 then 1007
            when base.seed_no between 39 and 44 then 1002
            when base.seed_no between 45 and 52 then 1008
            when base.seed_no between 53 and 56 then 1019
            when base.seed_no between 57 and 64 then 1009
            when base.seed_no between 65 and 70 then 1011
            when base.seed_no between 71 and 78 then 1010
            when base.seed_no between 79 and 82 then 1018
            when base.seed_no between 83 and 89 then 1012
            when base.seed_no between 90 and 94 then 1003
            when base.seed_no between 95 and 102 then 1013
            when base.seed_no between 103 and 106 then 1019
            when base.seed_no between 107 and 111 then 1004
            when base.seed_no between 112 and 120 then 1014
            when base.seed_no between 121 and 128 then 1015
            when base.seed_no between 129 and 133 then 1016
            when base.seed_no between 134 and 140 then 1020
            else 1001
        end as target_posting_id,
        base.surname_ko,
        base.surname_en,
        base.given_ko,
        base.given_en,
        base.email_domain
    from base
)
select
    assigned.seed_no,
    assigned.seed_track,
    assigned.family_code,
    assigned.target_posting_id,
    assigned.surname_ko || assigned.given_ko as display_name,
    lower(format('%s.%s.%s@%s', assigned.given_en, assigned.surname_en, lpad(assigned.seed_no::text, 4, '0'), assigned.email_domain)) as email,
    format(
        '010-%s-%s',
        lpad((1000 + ((assigned.seed_no * 37) % 9000))::text, 4, '0'),
        lpad((1000 + ((assigned.seed_no * 83) % 9000))::text, 4, '0')
    ) as phone_number,
    case
        when assigned.target_posting_id in (1004, 1018) then assigned.seed_no % 2
        when assigned.target_posting_id = 1005 then 1 + (assigned.seed_no % 3)
        when assigned.seed_track = 'HOTSPOT' then 1 + ((assigned.seed_no - 141) % 8)
        else 2 + (assigned.seed_no % 8)
    end as career_years
from assigned;

insert into platform.candidate_account (
    email,
    normalized_email,
    display_name,
    phone_number,
    password_hash,
    status,
    last_authenticated_at,
    created_at,
    updated_at
)
select
    demo_candidate_seed.email,
    demo_candidate_seed.email,
    demo_candidate_seed.display_name,
    demo_candidate_seed.phone_number,
    crypt('candidate123!'::text, gen_salt('bf')),
    'ACTIVE',
    case
        when demo_candidate_seed.seed_no <= 80 or demo_candidate_seed.seed_no % 97 = 0
            then timestamptz '2026-03-28 07:30:00+09' - ((demo_candidate_seed.seed_no % 14) * interval '1 day')
        else null
    end,
    current_timestamp,
    current_timestamp
from demo_candidate_seed
order by demo_candidate_seed.seed_no;

create temporary table demo_candidate_map on commit drop as
select
    demo_candidate_seed.seed_no,
    candidate_account.id as candidate_account_id
from demo_candidate_seed
join platform.candidate_account candidate_account
    on candidate_account.normalized_email = demo_candidate_seed.email;

insert into platform.candidate_session (
    candidate_account_id,
    token_hash,
    expires_at,
    last_seen_at,
    created_at,
    updated_at
)
select
    demo_candidate_map.candidate_account_id,
    encode(digest('demo-candidate-session-' || lpad(demo_candidate_map.seed_no::text, 5, '0'), 'sha256'), 'hex'),
    timestamptz '2026-06-30 23:59:00+09',
    timestamptz '2026-03-28 09:00:00+09' - ((demo_candidate_map.seed_no % 9) * interval '3 hour'),
    timestamptz '2026-03-20 10:00:00+09' - ((demo_candidate_map.seed_no % 12) * interval '1 day'),
    timestamptz '2026-03-28 09:00:00+09' - ((demo_candidate_map.seed_no % 9) * interval '3 hour')
from demo_candidate_map
where demo_candidate_map.seed_no <= 60
   or demo_candidate_map.seed_no in (141, 377, 582, 990, 1404, 2188, 3055, 4099);

insert into platform.candidate_profile (
    candidate_account_id,
    introduction_template,
    core_strength_template,
    career_years,
    updated_at
)
select
    demo_candidate_map.candidate_account_id,
    case demo_candidate_seed.family_code
        when 'FE' then case demo_candidate_seed.seed_no % 3
            when 0 then '지원서 작성 흐름과 관리자 검토 화면을 함께 보며, 사용성이 떨어지는 지점을 빠르게 컴포넌트로 정리하는 편입니다.'
            when 1 then '복잡한 입력 플로우를 단계별로 나누고, 상태를 안전하게 유지하는 UI를 만드는 데 강점이 있습니다.'
            else '서비스 화면에서 생기는 작은 마찰을 줄이는 작업을 좋아하고, 디자인 의도를 구현 가능한 구조로 바꾸는 경험이 많습니다.'
        end
        when 'DESIGN' then case demo_candidate_seed.seed_no % 3
            when 0 then '운영 화면과 지원자 화면의 정보 구조를 한 번에 보며, 반복 요소를 디자인 시스템으로 정리하는 작업을 좋아합니다.'
            when 1 then '정성 피드백과 사용 로그를 함께 읽고, 화면 구조와 문구를 조정해 완료율을 높여 왔습니다.'
            else '디자인 시스템과 실제 운영 흐름 사이의 간격을 줄이는 역할을 주로 맡아 왔습니다.'
        end
        when 'BE' then case demo_candidate_seed.seed_no % 3
            when 0 then '대용량 신청 데이터와 운영 규칙이 얽힌 백엔드 도메인을 다루며, 데이터 정합성과 API 안정성을 함께 챙겨 왔습니다.'
            when 1 then '장애 대응 이후 재발 방지까지 문서화하는 습관이 있고, 복잡한 정책을 읽기 쉬운 API로 정리하는 편입니다.'
            else '운영팀이 바로 체감할 수 있는 성능 개선과 데이터 구조 정리를 반복해 왔습니다.'
        end
        when 'FS' then case demo_candidate_seed.seed_no % 3
            when 0 then '프론트엔드와 백엔드를 모두 다루며, 제품 흐름 전체에서 병목이 생기는 지점을 먼저 찾는 편입니다.'
            when 1 then '요구사항이 완전히 정리되지 않은 상태에서도 화면과 API를 함께 설계해 빠르게 검증하는 데 익숙합니다.'
            else '운영 화면 개선과 백엔드 정책 정리를 한 번에 끌고 가는 역할을 자주 맡았습니다.'
        end
        when 'MOBILE' then case demo_candidate_seed.seed_no % 3
            when 0 then '모바일 지원 플로우에서 생기는 이탈 구간을 줄이고, 알림과 상태 동기화를 안정적으로 유지하는 일에 강점이 있습니다.'
            when 1 then '릴리즈 품질과 크래시 대응 루틴을 같이 보며, 앱 운영 지표를 개선해 온 경험이 많습니다.'
            else '사용자 관점의 작은 불편을 줄이는 모바일 화면 개선과 운영 안정화를 함께 해 왔습니다.'
        end
        when 'DATA' then case demo_candidate_seed.seed_no % 3
            when 0 then '운영팀이 바로 쓸 수 있는 대시보드와 SQL 리포트를 만들며, 병목을 설명 가능한 숫자로 바꾸는 일을 해 왔습니다.'
            when 1 then '퍼널 데이터와 현장 피드백을 같이 보며, 리포트가 실제 의사결정으로 이어지게 만드는 편입니다.'
            else '정리되지 않은 운영 이벤트를 분석 가능한 구조로 바꾸고, 이해하기 쉬운 지표 체계를 만드는 데 익숙합니다.'
        end
        when 'ML' then case demo_candidate_seed.seed_no % 3
            when 0 then '추천과 매칭 모델을 서비스 운영 흐름 안에 넣는 과정에서, 성능보다 운영 가능성을 먼저 보는 습관이 있습니다.'
            when 1 then '실험 설계와 모델 설명 가능성을 함께 챙기며, 모델 결과가 제품팀 의사결정으로 이어지게 해 왔습니다.'
            else '모델링과 서빙, 피처 관리까지 한 흐름으로 설계하고 성능 저하 원인을 빠르게 좁히는 편입니다.'
        end
        when 'DEVOPS' then case demo_candidate_seed.seed_no % 3
            when 0 then '배포 자동화와 관측 지표를 함께 다루며, 장애가 생겨도 원인을 빠르게 좁힐 수 있는 운영 환경을 만드는 데 익숙합니다.'
            when 1 then '인프라 비용과 운영 안정성을 같이 보며, 반복 작업을 코드로 줄이는 역할을 주로 맡았습니다.'
            else '서비스 운영 중 마주치는 작은 불안을 줄이기 위해 배포 루틴과 권한 체계를 정리해 왔습니다.'
        end
        when 'QA' then case demo_candidate_seed.seed_no % 3
            when 0 then '회귀 테스트 범위를 명확히 정하고, 릴리즈 직전 수동 확인 시간을 줄이는 자동화 작업을 주로 해 왔습니다.'
            when 1 then '운영 이슈 재현과 테스트 시나리오 문서화를 함께 하며, 제품팀과 QA팀 사이의 언어 차이를 줄이는 역할을 해 왔습니다.'
            else '배포 빈도가 높아도 핵심 흐름이 흔들리지 않게 테스트 전략을 설계하는 데 강점이 있습니다.'
        end
        else case demo_candidate_seed.seed_no % 3
            when 0 then '여러 인터뷰어와 지원자 일정이 한 번에 몰려도 우선순위를 정리하고, 안내 문구를 안정적으로 관리하는 데 익숙합니다.'
            when 1 then '채용 운영에서 생기는 잔업무를 문서와 체크리스트로 줄여 팀이 중요한 의사결정에 집중하도록 돕는 편입니다.'
            else '지원자 경험을 해치지 않으면서 내부 운영 속도를 유지할 수 있도록 커뮤니케이션 기준을 정리해 왔습니다.'
        end
    end,
    case demo_candidate_seed.family_code
        when 'FE' then 'UI 구조화, 접근성, 제품 협업'
        when 'DESIGN' then '정보 구조, 디자인 시스템, UX 문구'
        when 'BE' then '도메인 모델링, 데이터 정합성, 장애 대응'
        when 'FS' then '문제 정의, 빠른 프로토타이핑, 배포 리듬'
        when 'MOBILE' then '릴리즈 운영, 알림 경험, 성능 개선'
        when 'DATA' then 'SQL 분석, 대시보드 설계, 운영 지표 해석'
        when 'ML' then '추천 실험, 모델 서빙, 피처 파이프라인'
        when 'DEVOPS' then '배포 자동화, 관측 체계, 운영 표준화'
        when 'QA' then '회귀 전략, 테스트 자동화, 릴리즈 게이트'
        else '채용 운영, 일정 조율, 지원자 커뮤니케이션'
    end,
    demo_candidate_seed.career_years,
    current_timestamp
from demo_candidate_seed
join demo_candidate_map
    on demo_candidate_map.seed_no = demo_candidate_seed.seed_no;

insert into platform.candidate_profile_experience (
    candidate_account_id,
    company,
    position,
    start_date,
    end_date,
    description,
    sort_order
)
select
    demo_candidate_map.candidate_account_id,
    (array[
        '웨이브노트','링크브릿지','큐브워크','미르포인트','하이라인',
        '블루토크','그리드팩토리','모먼트베이스','오로라시스템','라이트트랙'
    ])[((demo_candidate_seed.seed_no - 1) % 10) + 1],
    case demo_candidate_seed.family_code
        when 'FE' then '웹 퍼블리셔'
        when 'DESIGN' then '시각 디자이너'
        when 'BE' then '백엔드 개발자'
        when 'FS' then '웹 개발자'
        when 'MOBILE' then '앱 개발자'
        when 'DATA' then '주니어 데이터 분석가'
        when 'ML' then '데이터 엔지니어'
        when 'DEVOPS' then '시스템 엔지니어'
        when 'QA' then 'QA 엔지니어'
        else '채용 운영 어시스턴트'
    end,
    make_date(2018 + (demo_candidate_seed.seed_no % 3), ((demo_candidate_seed.seed_no + 3) % 12) + 1, 1),
    make_date(2021 + (demo_candidate_seed.seed_no % 3), ((demo_candidate_seed.seed_no + 6) % 12) + 1, 28),
    case
        when demo_candidate_seed.family_code in ('BE', 'DEVOPS', 'QA') then '운영성 있는 기본기와 문서화 습관을 익히며 실무 전환을 준비했습니다.'
        when demo_candidate_seed.family_code in ('FE', 'DESIGN', 'MOBILE') then '사용자 화면 완성도와 협업 프로세스 이해를 넓혔습니다.'
        when demo_candidate_seed.family_code in ('DATA', 'ML') then '기초 분석과 데이터 정리 자동화를 맡으며 문제 구조를 익혔습니다.'
        else '운영 지원과 커뮤니케이션 실무를 경험하며 일정 관리 기준을 익혔습니다.'
    end,
    1
from demo_candidate_seed
join demo_candidate_map
    on demo_candidate_map.seed_no = demo_candidate_seed.seed_no
where demo_candidate_seed.career_years >= 5
   or demo_candidate_seed.seed_no % 11 = 0;

insert into platform.candidate_profile_skill (
    candidate_account_id,
    skill_name,
    proficiency,
    years,
    sort_order
)
select
    demo_candidate_map.candidate_account_id,
    skill_seed.skill_name,
    skill_seed.proficiency,
    skill_seed.years,
    skill_seed.sort_order
from demo_candidate_seed
join demo_candidate_map
    on demo_candidate_map.seed_no = demo_candidate_seed.seed_no
cross join lateral (
    values
        (
            0,
            case demo_candidate_seed.family_code
                when 'FE' then 'React'
                when 'DESIGN' then 'Figma'
                when 'BE' then 'Java'
                when 'FS' then 'TypeScript'
                when 'MOBILE' then 'Flutter'
                when 'DATA' then 'SQL'
                when 'ML' then 'Python'
                when 'DEVOPS' then 'AWS'
                when 'QA' then 'Playwright'
                else 'Interview Scheduling'
            end,
            'ADVANCED',
            greatest(1, demo_candidate_seed.career_years)
        ),
        (
            1,
            case demo_candidate_seed.family_code
                when 'FE' then 'Next.js'
                when 'DESIGN' then 'Design System'
                when 'BE' then 'Spring Boot'
                when 'FS' then 'React'
                when 'MOBILE' then 'Dart'
                when 'DATA' then 'Python'
                when 'ML' then 'PyTorch'
                when 'DEVOPS' then 'Kubernetes'
                when 'QA' then 'API Testing'
                else 'Candidate Experience'
            end,
            'ADVANCED',
            greatest(1, demo_candidate_seed.career_years - 1)
        ),
        (
            2,
            case demo_candidate_seed.family_code
                when 'FE' then 'TypeScript'
                when 'DESIGN' then 'User Flow Mapping'
                when 'BE' then 'PostgreSQL'
                when 'FS' then 'Spring Boot'
                when 'MOBILE' then 'Firebase'
                when 'DATA' then 'Tableau'
                when 'ML' then 'MLflow'
                when 'DEVOPS' then 'Terraform'
                when 'QA' then 'Test Design'
                else 'Stakeholder Communication'
            end,
            'INTERMEDIATE',
            greatest(1, demo_candidate_seed.career_years - 1)
        ),
        (
            3,
            case demo_candidate_seed.family_code
                when 'FE' then 'Accessibility'
                when 'DESIGN' then 'Prototype Testing'
                when 'BE' then 'Kafka'
                when 'FS' then 'PostgreSQL'
                when 'MOBILE' then 'Mobile CI'
                when 'DATA' then 'Amplitude'
                when 'ML' then 'Feature Engineering'
                when 'DEVOPS' then 'Monitoring'
                when 'QA' then 'Regression Planning'
                else 'Offer Coordination'
            end,
            'INTERMEDIATE',
            greatest(1, demo_candidate_seed.career_years - 2)
        )
) as skill_seed(sort_order, skill_name, proficiency, years);

insert into platform.candidate_profile_certification (
    candidate_account_id,
    certification_name,
    issuer,
    issued_date,
    expiry_date,
    sort_order
)
select
    demo_candidate_map.candidate_account_id,
    case demo_candidate_seed.family_code
        when 'BE' then '정보처리기사'
        when 'DEVOPS' then 'AWS Certified Cloud Practitioner'
        when 'DATA' then 'SQLD'
        when 'ML' then 'ADsP'
        when 'QA' then 'ISTQB Foundation Level'
        when 'HR' then '채용브랜딩 실무과정 수료'
        when 'DESIGN' then 'Google UX Design Certificate'
        else '프로덕트 협업 과정 수료'
    end,
    case
        when demo_candidate_seed.family_code = 'HR' then '바이브아카데미'
        else 'Synthetic Certification Board'
    end,
    make_date(2022 + (demo_candidate_seed.seed_no % 3), ((demo_candidate_seed.seed_no - 1) % 12) + 1, 15),
    null,
    0
from demo_candidate_seed
join demo_candidate_map
    on demo_candidate_map.seed_no = demo_candidate_seed.seed_no
where demo_candidate_seed.seed_no % 3 = 0
   or demo_candidate_seed.target_posting_id in (1004, 1014, 1015);

insert into platform.candidate_profile_language (
    candidate_account_id,
    language_name,
    proficiency,
    test_name,
    test_score,
    sort_order
)
select
    demo_candidate_map.candidate_account_id,
    case
        when demo_candidate_seed.seed_no % 29 = 0 then 'Japanese'
        else 'English'
    end,
    case
        when demo_candidate_seed.career_years >= 6 then 'BUSINESS'
        when demo_candidate_seed.career_years >= 3 then 'INTERMEDIATE'
        else 'ADVANCED'
    end,
    case
        when demo_candidate_seed.seed_no % 29 = 0 then 'JLPT'
        else 'TOEIC'
    end,
    case
        when demo_candidate_seed.seed_no % 29 = 0 then 'N2'
        when demo_candidate_seed.career_years >= 6 then '915'
        when demo_candidate_seed.career_years >= 3 then '860'
        else '795'
    end,
    0
from demo_candidate_seed
join demo_candidate_map
    on demo_candidate_map.seed_no = demo_candidate_seed.seed_no;

create temporary table demo_application_seed on commit drop as
with ranked as (
    select
        demo_candidate_seed.seed_no,
        demo_candidate_seed.seed_track,
        demo_candidate_seed.family_code,
        demo_candidate_seed.target_posting_id,
        demo_candidate_seed.display_name,
        demo_candidate_seed.email,
        demo_candidate_seed.phone_number,
        demo_candidate_seed.career_years,
        demo_candidate_map.candidate_account_id,
        job_posting.status as posting_status,
        job_posting.opens_at,
        job_posting.closes_at,
        row_number() over (partition by demo_candidate_seed.target_posting_id order by demo_candidate_seed.seed_no) as posting_rank
    from demo_candidate_seed
    join demo_candidate_map
        on demo_candidate_map.seed_no = demo_candidate_seed.seed_no
    join recruit.job_posting job_posting
        on job_posting.id = demo_candidate_seed.target_posting_id
),
with_status as (
    select
        ranked.*,
        case
            when ranked.target_posting_id = 1001 then 'SUBMITTED'
            when ranked.posting_status = 'OPEN' and ranked.posting_rank % 9 = 0 then 'DRAFT'
            else 'SUBMITTED'
        end as application_status
    from ranked
),
with_review as (
    select
        with_status.*,
        case
            when with_status.application_status = 'DRAFT' then 'NEW'
            when with_status.target_posting_id = 1001 then
                case
                    when with_status.posting_rank <= 420 then 'NEW'
                    when with_status.posting_rank <= 2670 then 'IN_REVIEW'
                    when with_status.posting_rank <= 4190 then 'REJECTED'
                    else 'PASSED'
                end
            when with_status.posting_status = 'CLOSED' then
                case
                    when with_status.posting_rank % 5 in (0, 1) then 'REJECTED'
                    when with_status.posting_rank % 5 = 2 then 'IN_REVIEW'
                    else 'PASSED'
                end
            else
                case
                    when with_status.posting_rank % 7 in (0, 1) then 'NEW'
                    when with_status.posting_rank % 7 in (2, 3, 4) then 'IN_REVIEW'
                    when with_status.posting_rank % 7 = 5 then 'REJECTED'
                    else 'PASSED'
                end
        end as review_status
    from with_status
),
with_final as (
    select
        with_review.*,
        case
            when with_review.application_status = 'DRAFT' then null
            when with_review.target_posting_id = 1001 and with_review.posting_rank between 4911 and 4940 then 'OFFER_MADE'
            when with_review.target_posting_id = 1001 and with_review.posting_rank between 4941 and 4965 then 'ACCEPTED'
            when with_review.target_posting_id = 1001 and with_review.posting_rank between 4966 and 4980 then 'DECLINED'
            when with_review.target_posting_id = 1001 and with_review.posting_rank between 4981 and 4990 then 'WITHDRAWN'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'CLOSED' and with_review.posting_rank % 6 = 0 then 'ACCEPTED'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'CLOSED' and with_review.posting_rank % 6 = 1 then 'DECLINED'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'CLOSED' and with_review.posting_rank % 6 = 2 then 'OFFER_MADE'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'OPEN' and with_review.posting_rank % 12 = 0 then 'OFFER_MADE'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'OPEN' and with_review.posting_rank % 12 = 1 then 'ACCEPTED'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'OPEN' and with_review.posting_rank % 12 = 2 then 'DECLINED'
            when with_review.review_status = 'PASSED' and with_review.posting_status = 'OPEN' and with_review.posting_rank % 12 = 3 then 'WITHDRAWN'
            else null
        end as final_status
    from with_review
)
select
    with_final.*,
    case
        when with_final.target_posting_id = 1001
            then with_final.opens_at + ((with_final.posting_rank - 1) * interval '11 minute') + ((with_final.seed_no % 5) * interval '2 minute')
        else with_final.opens_at + ((with_final.posting_rank - 1) * interval '1 day') + ((with_final.seed_no % 6) * interval '1 hour')
    end as draft_saved_at,
    case with_final.family_code
        when 'FE' then '지원자 입장에서 막힘 없이 끝까지 작성할 수 있는 플로우를 만드는 팀이라 지원했습니다.'
        when 'DESIGN' then '운영 화면과 지원자 화면을 함께 정리하는 역할이어서 제 경험을 가장 잘 활용할 수 있다고 판단했습니다.'
        when 'BE' then '채용 도메인처럼 규칙이 많은 백엔드를 안정적으로 다루는 일이 제 강점과 잘 맞습니다.'
        when 'FS' then '화면과 API를 같이 다루며 제품 흐름 전체를 개선할 수 있다는 점이 매력적이었습니다.'
        when 'MOBILE' then '모바일 지원 경험을 제품 핵심 플로우로 다루는 팀을 찾고 있었습니다.'
        when 'DATA' then '운영팀이 바로 활용할 수 있는 분석 결과를 만드는 업무 비중이 높아 지원했습니다.'
        when 'ML' then '추천과 매칭 품질을 실제 제품 운영에 연결하는 문제를 풀고 싶어 지원했습니다.'
        when 'DEVOPS' then '배포 자동화와 장애 대응 루틴을 함께 설계할 수 있는 환경이어서 지원했습니다.'
        when 'QA' then '운영 시나리오 중심의 자동화 범위를 넓힐 수 있는 역할이라 지원했습니다.'
        else '지원자 경험과 운영 속도를 동시에 챙기는 채용 운영 역할이어서 지원했습니다.'
    end as motivation_fit,
    case with_final.family_code
        when 'FE' then '지원서 플로우와 관리자 검토 화면을 다듬는 프론트엔드 작업을 주로 맡아 왔습니다. 입력 흐름을 단계별로 정리하고 성능 이슈를 줄이는 일에 익숙합니다.'
        when 'DESIGN' then '운영 도구와 사용자 흐름을 함께 설계하며 정보 구조를 정리하는 일을 오래 해 왔습니다. 반복되는 화면을 시스템화하고 용어를 통일하는 작업을 선호합니다.'
        when 'BE' then '백엔드 API와 데이터 모델을 설계하며 운영 정책을 안전하게 구현하는 역할을 맡아 왔습니다. 지원자 상태 전이와 알림 흐름처럼 규칙이 많은 도메인에 익숙합니다.'
        when 'FS' then '프론트엔드와 백엔드를 함께 다루며 제품 흐름 전체의 병목을 줄이는 일을 해 왔습니다. 요구사항이 모호할 때 빠르게 검증 가능한 형태로 정리하는 편입니다.'
        when 'MOBILE' then '모바일 앱에서 지원 현황 확인과 일정 안내 경험을 개선하는 역할을 맡아 왔습니다. 릴리즈 이후 품질 안정화까지 챙긴 경험이 있습니다.'
        when 'DATA' then '운영 로그를 정리하고 SQL과 파이썬으로 병목을 설명하는 분석 업무를 해 왔습니다. 현장 운영팀이 바로 행동할 수 있는 리포트를 만드는 편입니다.'
        when 'ML' then '추천과 매칭 모델을 제품 운영 흐름에 연결하는 경험이 있습니다. 모델 성능과 운영 가능성을 동시에 보는 방식을 선호합니다.'
        when 'DEVOPS' then '배포 자동화, 관측 지표, 권한 관리 체계를 정리하며 운영 안정성을 높이는 역할을 맡아 왔습니다. 반복 작업을 코드로 줄이는 데 익숙합니다.'
        when 'QA' then '회귀 테스트 범위를 설계하고 릴리즈 게이트를 만드는 품질 업무를 맡아 왔습니다. 운영 이슈 재현과 테스트 시나리오 문서화를 함께 챙깁니다.'
        else '채용 운영과 지원자 커뮤니케이션, 일정 조율을 동시에 맡아 본 경험이 있습니다. 안내 문구와 운영 체크리스트를 정리해 팀 실행 속도를 높이는 편입니다.'
    end as introduction_text,
    case with_final.family_code
        when 'FE' then '복잡한 입력 흐름을 읽기 쉬운 UI로 바꾸는 힘'
        when 'DESIGN' then '운영 화면 구조화와 디자인 시스템 정리'
        when 'BE' then '데이터 정합성과 운영 안정성을 함께 보는 백엔드 설계'
        when 'FS' then '프론트와 백엔드를 함께 묶는 실행력'
        when 'MOBILE' then '모바일 릴리즈 품질과 사용자 흐름 개선'
        when 'DATA' then '운영팀이 바로 쓰는 지표 설계와 분석'
        when 'ML' then '실험 설계와 모델 서빙을 연결하는 시야'
        when 'DEVOPS' then '배포 자동화와 장애 대응 루틴 구축'
        when 'QA' then '핵심 회귀 범위를 빠르게 고정하는 품질 전략'
        else '여러 이해관계자를 동시에 맞추는 채용 운영 커뮤니케이션'
    end as core_strength_text
from with_final;

insert into recruit.application (
    job_posting_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    status,
    review_status,
    review_note,
    reviewed_at,
    final_status,
    final_decided_at,
    final_note,
    draft_saved_at,
    submitted_at,
    candidate_account_id,
    introduction,
    core_strength,
    career_years,
    current_step,
    motivation_fit
)
select
    demo_application_seed.target_posting_id,
    demo_application_seed.display_name,
    demo_application_seed.email,
    demo_application_seed.phone_number,
    demo_application_seed.application_status,
    demo_application_seed.review_status,
    case
        when demo_application_seed.application_status = 'DRAFT' then null
        when demo_application_seed.review_status = 'NEW' then '접수 완료 후 순차 검토 예정입니다.'
        when demo_application_seed.review_status = 'IN_REVIEW' then '직무 적합성과 최근 수행 범위를 운영팀이 검토 중입니다.'
        when demo_application_seed.review_status = 'PASSED' then '서류 기준을 충족해 다음 단계 안내가 가능한 상태입니다.'
        else case
            when demo_application_seed.family_code in ('BE', 'DEVOPS', 'QA') then '핵심 스택과 최근 운영 범위가 이번 포지션 기대치와 일부 달랐습니다.'
            when demo_application_seed.family_code in ('FE', 'DESIGN', 'MOBILE') then '포지션에서 요구한 화면 운영 범위와 최근 경험이 일부 달랐습니다.'
            when demo_application_seed.family_code in ('DATA', 'ML') then '최근 분석 및 모델링 범위가 이번 포지션의 우선순위와 다소 달랐습니다.'
            else '채용 운영 범위와 현재 포지션의 우선순위가 일부 달랐습니다.'
        end
    end,
    case
        when demo_application_seed.application_status = 'DRAFT' or demo_application_seed.review_status = 'NEW' then null
        else demo_application_seed.draft_saved_at
            + interval '3 day'
            + ((demo_application_seed.posting_rank % 5) * interval '4 hour')
    end,
    demo_application_seed.final_status,
    case
        when demo_application_seed.final_status is null then null
        else demo_application_seed.draft_saved_at
            + interval '8 day'
            + ((demo_application_seed.posting_rank % 4) * interval '1 day')
    end,
    case demo_application_seed.final_status
        when 'OFFER_MADE' then '최종 합격 기준을 충족해 처우 협의를 진행 중입니다.'
        when 'ACCEPTED' then '오퍼 수락 완료로 온보딩 준비 단계로 이동했습니다.'
        when 'DECLINED' then '오퍼는 진행했지만 지원자가 다른 기회를 선택했습니다.'
        when 'WITHDRAWN' then '면접 이후 지원자 요청으로 전형이 종료되었습니다.'
        else null
    end,
    demo_application_seed.draft_saved_at,
    case
        when demo_application_seed.application_status = 'SUBMITTED'
            then demo_application_seed.draft_saved_at + interval '45 minute' + ((demo_application_seed.seed_no % 6) * interval '7 minute')
        else null
    end,
    demo_application_seed.candidate_account_id,
    demo_application_seed.introduction_text,
    demo_application_seed.core_strength_text,
    demo_application_seed.career_years,
    case
        when demo_application_seed.application_status = 'DRAFT' then 3 + (demo_application_seed.posting_rank % 3)
        else 6
    end,
    demo_application_seed.motivation_fit
from demo_application_seed
order by demo_application_seed.seed_no;

create temporary table demo_application_map on commit drop as
select
    demo_application_seed.seed_no,
    demo_application_seed.family_code,
    demo_application_seed.seed_track,
    demo_application_seed.target_posting_id,
    demo_application_seed.posting_rank,
    demo_application_seed.application_status,
    demo_application_seed.review_status,
    demo_application_seed.final_status,
    application.id as application_id
from demo_application_seed
join recruit.application application
    on application.candidate_account_id = demo_application_seed.candidate_account_id
   and application.job_posting_id = demo_application_seed.target_posting_id;

insert into recruit.application_resume_raw (
    application_id,
    payload,
    updated_at
)
select
    application.id,
    jsonb_build_object(
        'currentStep', application.current_step,
        'motivationFit', application.motivation_fit,
        'introduction', application.introduction,
        'coreStrength', application.core_strength,
        'careerYears', application.career_years
    ),
    coalesce(application.submitted_at, application.draft_saved_at)
from recruit.application application;

insert into recruit.application_education (
    application_id,
    school_name,
    major,
    degree,
    graduated_at,
    sort_order
)
select
    demo_application_map.application_id,
    (array[
        '가온미래대학교','누리공과대학교','다온디자인대학','새봄데이터대학원','하람테크대학교',
        '온유비즈니스스쿨','모아융합대학교','솔빛국제대학','청운미디어대학','해든과학기술대학'
    ])[((demo_application_map.seed_no - 1) % 10) + 1],
    case demo_candidate_seed.family_code
        when 'FE' then '디지털미디어공학'
        when 'DESIGN' then '서비스디자인'
        when 'BE' then '소프트웨어공학'
        when 'FS' then '컴퓨터공학'
        when 'MOBILE' then '모바일소프트웨어'
        when 'DATA' then '데이터사이언스'
        when 'ML' then '인공지능공학'
        when 'DEVOPS' then '클라우드컴퓨팅'
        when 'QA' then '정보시스템공학'
        else '경영정보학'
    end,
    case
        when demo_candidate_seed.target_posting_id in (1004, 1018) then case when demo_application_map.seed_no % 2 = 0 then 'BACHELOR' else 'ASSOCIATE' end
        when demo_candidate_seed.family_code in ('DATA', 'ML') and demo_application_map.seed_no % 4 = 0 then 'MASTER'
        else 'BACHELOR'
    end,
    make_date(
        case
            when demo_candidate_seed.career_years <= 1 then 2026
            when demo_candidate_seed.career_years between 2 and 3 then 2022
            when demo_candidate_seed.career_years between 4 and 6 then 2019
            else 2016
        end,
        2,
        28
    ),
    0
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no;

insert into recruit.application_experience (
    application_id,
    company,
    position,
    start_date,
    end_date,
    description,
    sort_order
)
select
    demo_application_map.application_id,
    (array[
        '모노웨이브','브릿지큐브','오션바이트','하이브릭스','비비드메트릭',
        '클라우드앵커','넥스트포지','코어링크랩','파인루프','라운드포지',
        '스텝모션','데이터스프링'
    ])[((demo_application_map.seed_no - 1) % 12) + 1],
    case demo_candidate_seed.family_code
        when 'FE' then case when demo_candidate_seed.career_years <= 2 then '주니어 프론트엔드 개발자' else '프론트엔드 엔지니어' end
        when 'DESIGN' then case when demo_candidate_seed.career_years <= 2 then '주니어 프로덕트 디자이너' else '프로덕트 디자이너' end
        when 'BE' then case when demo_candidate_seed.career_years >= 7 then '시니어 백엔드 엔지니어' else '백엔드 엔지니어' end
        when 'FS' then '풀스택 엔지니어'
        when 'MOBILE' then '모바일 엔지니어'
        when 'DATA' then '데이터 분석가'
        when 'ML' then case when demo_candidate_seed.career_years <= 1 then 'ML 인턴' else 'ML 엔지니어' end
        when 'DEVOPS' then '플랫폼 엔지니어'
        when 'QA' then 'QA 자동화 엔지니어'
        else case
            when demo_candidate_seed.target_posting_id = 1004 then 'People Ops 인턴'
            when demo_candidate_seed.target_posting_id = 1015 then '면접 코디네이터'
            when demo_candidate_seed.target_posting_id = 1014 then '채용 담당자'
            else 'HR 운영 담당자'
        end
    end,
    case
        when demo_candidate_seed.career_years = 0 then date '2025-07-01'
        else make_date(2026 - demo_candidate_seed.career_years, ((demo_application_map.seed_no - 1) % 12) + 1, 1)
    end,
    case
        when demo_candidate_seed.career_years = 0 then date '2025-08-31'
        when demo_application_map.seed_no % 4 = 0 then null
        else make_date(2026, ((demo_application_map.seed_no + 2) % 12) + 1, 28)
    end,
    case demo_candidate_seed.family_code
        when 'FE' then '지원서 플로우와 관리자 목록 화면을 구현하며 입력 오류와 렌더링 병목을 개선했습니다.'
        when 'DESIGN' then '운영 화면과 지원자 플로우의 정보 구조를 정리하고 디자인 시스템 컴포넌트를 운영했습니다.'
        when 'BE' then '상태 전이와 알림 적재 흐름을 안정적으로 구현하고 운영 장애를 줄였습니다.'
        when 'FS' then '프론트와 API를 함께 다루며 기능 배포 속도와 유지보수성을 개선했습니다.'
        when 'MOBILE' then '모바일 지원 현황과 알림 경험을 개선하고 릴리즈 이후 이슈를 안정화했습니다.'
        when 'DATA' then '채용 전환율과 운영 리드타임을 분석해 주간 리포트를 만들었습니다.'
        when 'ML' then '추천 실험과 피처 정리를 맡고 모델 결과를 해석 가능한 형태로 공유했습니다.'
        when 'DEVOPS' then '배포 자동화와 모니터링 구성을 정리하고 장애 대응 시간을 줄였습니다.'
        when 'QA' then '회귀 자동화와 릴리즈 체크리스트를 만들고 운영 이슈 재현 속도를 높였습니다.'
        else '면접 일정 조율과 지원자 안내를 맡으며 운영 문서와 커뮤니케이션 기준을 정리했습니다.'
    end,
    0
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no;

insert into recruit.application_experience (
    application_id,
    company,
    position,
    start_date,
    end_date,
    description,
    sort_order
)
select
    demo_application_map.application_id,
    (array[
        '웨이브노트','링크브릿지','큐브워크','미르포인트','하이라인',
        '블루토크','그리드팩토리','모먼트베이스','오로라시스템','라이트트랙'
    ])[((demo_application_map.seed_no - 1) % 10) + 1],
    case demo_candidate_seed.family_code
        when 'FE' then '웹 퍼블리셔'
        when 'DESIGN' then '시각 디자이너'
        when 'BE' then '백엔드 개발자'
        when 'FS' then '웹 개발자'
        when 'MOBILE' then '앱 개발자'
        when 'DATA' then '주니어 데이터 분석가'
        when 'ML' then '데이터 엔지니어'
        when 'DEVOPS' then '시스템 엔지니어'
        when 'QA' then 'QA 엔지니어'
        else '채용 운영 어시스턴트'
    end,
    make_date(2018 + (demo_application_map.seed_no % 3), ((demo_application_map.seed_no + 3) % 12) + 1, 1),
    make_date(2021 + (demo_application_map.seed_no % 3), ((demo_application_map.seed_no + 6) % 12) + 1, 28),
    case
        when demo_candidate_seed.family_code in ('BE', 'DEVOPS', 'QA') then '기초 운영성과 문서화 습관을 익히며 실무 전환을 준비했습니다.'
        when demo_candidate_seed.family_code in ('FE', 'DESIGN', 'MOBILE') then '사용자 화면 완성도와 협업 프로세스 이해를 넓혔습니다.'
        when demo_candidate_seed.family_code in ('DATA', 'ML') then '기초 분석과 데이터 정리 자동화를 맡았습니다.'
        else '운영 지원과 커뮤니케이션 실무를 경험했습니다.'
    end,
    1
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no
where demo_candidate_seed.career_years >= 5
   or demo_application_map.seed_no % 11 = 0;

insert into recruit.application_skill (
    application_id,
    skill_name,
    proficiency,
    years,
    sort_order
)
select
    demo_application_map.application_id,
    skill_seed.skill_name,
    skill_seed.proficiency,
    skill_seed.years,
    skill_seed.sort_order
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no
cross join lateral (
    values
        (
            0,
            case demo_candidate_seed.family_code
                when 'FE' then 'React'
                when 'DESIGN' then 'Figma'
                when 'BE' then 'Java'
                when 'FS' then 'TypeScript'
                when 'MOBILE' then 'Flutter'
                when 'DATA' then 'SQL'
                when 'ML' then 'Python'
                when 'DEVOPS' then 'AWS'
                when 'QA' then 'Playwright'
                else 'Interview Scheduling'
            end,
            'ADVANCED',
            greatest(1, demo_candidate_seed.career_years)
        ),
        (
            1,
            case demo_candidate_seed.family_code
                when 'FE' then 'Next.js'
                when 'DESIGN' then 'Design System'
                when 'BE' then 'Spring Boot'
                when 'FS' then 'React'
                when 'MOBILE' then 'Dart'
                when 'DATA' then 'Python'
                when 'ML' then 'PyTorch'
                when 'DEVOPS' then 'Kubernetes'
                when 'QA' then 'API Testing'
                else 'Candidate Experience'
            end,
            'ADVANCED',
            greatest(1, demo_candidate_seed.career_years - 1)
        ),
        (
            2,
            case demo_candidate_seed.family_code
                when 'FE' then 'TypeScript'
                when 'DESIGN' then 'User Flow Mapping'
                when 'BE' then 'PostgreSQL'
                when 'FS' then 'Spring Boot'
                when 'MOBILE' then 'Firebase'
                when 'DATA' then 'Tableau'
                when 'ML' then 'MLflow'
                when 'DEVOPS' then 'Terraform'
                when 'QA' then 'Test Design'
                else 'Stakeholder Communication'
            end,
            'INTERMEDIATE',
            greatest(1, demo_candidate_seed.career_years - 1)
        ),
        (
            3,
            case demo_candidate_seed.family_code
                when 'FE' then 'Accessibility'
                when 'DESIGN' then 'Prototype Testing'
                when 'BE' then 'Kafka'
                when 'FS' then 'PostgreSQL'
                when 'MOBILE' then 'Mobile CI'
                when 'DATA' then 'Amplitude'
                when 'ML' then 'Feature Engineering'
                when 'DEVOPS' then 'Monitoring'
                when 'QA' then 'Regression Planning'
                else 'Offer Coordination'
            end,
            'INTERMEDIATE',
            greatest(1, demo_candidate_seed.career_years - 2)
        )
) as skill_seed(sort_order, skill_name, proficiency, years);

insert into recruit.application_certification (
    application_id,
    certification_name,
    issuer,
    issued_date,
    expiry_date,
    sort_order
)
select
    demo_application_map.application_id,
    case demo_candidate_seed.family_code
        when 'BE' then '정보처리기사'
        when 'DEVOPS' then 'AWS Certified Cloud Practitioner'
        when 'DATA' then 'SQLD'
        when 'ML' then 'ADsP'
        when 'QA' then 'ISTQB Foundation Level'
        when 'HR' then '채용브랜딩 실무과정 수료'
        when 'DESIGN' then 'Google UX Design Certificate'
        else '프로덕트 협업 과정 수료'
    end,
    case
        when demo_candidate_seed.family_code = 'HR' then '바이브아카데미'
        else 'Synthetic Certification Board'
    end,
    make_date(2022 + (demo_application_map.seed_no % 3), ((demo_application_map.seed_no - 1) % 12) + 1, 15),
    null,
    0
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no
where demo_application_map.seed_no % 3 = 0
   or demo_candidate_seed.target_posting_id in (1004, 1014, 1015);

insert into recruit.application_language (
    application_id,
    language_name,
    proficiency,
    test_name,
    test_score,
    sort_order
)
select
    demo_application_map.application_id,
    case
        when demo_application_map.seed_no % 29 = 0 then 'Japanese'
        else 'English'
    end,
    case
        when demo_candidate_seed.career_years >= 6 then 'BUSINESS'
        when demo_candidate_seed.career_years >= 3 then 'INTERMEDIATE'
        else 'ADVANCED'
    end,
    case
        when demo_application_map.seed_no % 29 = 0 then 'JLPT'
        else 'TOEIC'
    end,
    case
        when demo_application_map.seed_no % 29 = 0 then 'N2'
        when demo_candidate_seed.career_years >= 6 then '915'
        when demo_candidate_seed.career_years >= 3 then '860'
        else '795'
    end,
    0
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no;

insert into recruit.application_answer (
    application_id,
    job_posting_question_id,
    answer_text,
    answer_choice,
    answer_scale,
    created_at,
    updated_at
)
select
    demo_application_map.application_id,
    job_posting_question.id,
    case
        when job_posting_question.question_type = 'TEXT' then case demo_candidate_seed.family_code
            when 'FE' then case demo_application_map.seed_no % 3
                when 0 then '지원서 작성 단계에서 입력 중 이탈이 높았던 화면을 개선하며 렌더링 지연과 검증 오류를 함께 줄였습니다.'
                when 1 then '복잡한 폼 입력을 단계별로 나누고 자동 저장 흐름을 넣어 완주율을 높인 경험이 있습니다.'
                else '운영팀이 자주 수정하는 화면을 컴포넌트로 정리해 배포 속도를 높인 적이 있습니다.'
            end
            when 'DESIGN' then case demo_application_map.seed_no % 3
                when 0 then '지원자 플로우에서 용어와 정보 배치를 정리해 완료율을 끌어올린 경험이 있습니다.'
                when 1 then '관리자 화면의 복잡한 상태를 카드와 배지 체계로 재구성해 검토 시간을 줄였습니다.'
                else '디자인 시스템 토큰을 정리해 운영 화면과 모바일 화면의 일관성을 맞춘 경험이 있습니다.'
            end
            when 'BE' then case demo_application_map.seed_no % 3
                when 0 then '지원 상태 전이와 알림 적재가 엇갈리던 구간을 트랜잭션 기준으로 정리해 장애를 줄였습니다.'
                when 1 then '대량 신청 배치에서 잠금 경합이 발생하던 구간을 재구성해 처리 시간을 줄였습니다.'
                else '운영팀 요청으로 자주 바뀌는 정책을 코드와 데이터 구조 양쪽에서 정리한 경험이 있습니다.'
            end
            when 'FS' then case demo_application_map.seed_no % 3
                when 0 then '화면과 API를 함께 수정해 지원서 저장 실패 원인을 줄인 경험이 있습니다.'
                when 1 then '운영자가 원하는 필드를 바로 추가할 수 있도록 폼 구조와 API 계약을 동시에 개선했습니다.'
                else '배포 이후 발생한 화면 오류를 API 응답 구조 정리로 함께 해결한 경험이 있습니다.'
            end
            when 'MOBILE' then case demo_application_map.seed_no % 3
                when 0 then '모바일에서 지원 현황 확인 흐름을 단순화해 알림 클릭 후 이탈을 줄였습니다.'
                when 1 then '릴리즈 직전 크래시 재현 환경을 정리해 원인 파악 시간을 줄인 경험이 있습니다.'
                else '푸시 알림과 상태 동기화 타이밍을 조정해 사용자 문의를 줄인 적이 있습니다.'
            end
            when 'DATA' then case demo_application_map.seed_no % 3
                when 0 then '지원자 유입 대비 서류 통과율이 급격히 낮아진 원인을 찾아 공고 운영 방식을 조정한 경험이 있습니다.'
                when 1 then '면접 조율 리드타임을 분석해 병목 구간을 운영팀과 함께 개선했습니다.'
                else '주간 리포트 구조를 바꿔 채용 매니저가 바로 액션할 수 있게 만든 경험이 있습니다.'
            end
            when 'ML' then case demo_application_map.seed_no % 3
                when 0 then '추천 결과의 편향을 줄이기 위해 피처 구성과 후처리 규칙을 함께 조정한 경험이 있습니다.'
                when 1 then '모델 성능 저하 원인을 데이터 분포 변화에서 찾아 실험 설계를 다시 한 경험이 있습니다.'
                else '서빙 지연이 길어지던 구간을 캐시와 피처 조회 구조 개선으로 줄인 경험이 있습니다.'
            end
            when 'DEVOPS' then case demo_application_map.seed_no % 3
                when 0 then '배포 단계별 검증을 자동화해 장애 복구 시간을 줄인 경험이 있습니다.'
                when 1 then '관측 지표와 알림 기준을 손봐 야간 장애 대응 빈도를 낮춘 적이 있습니다.'
                else '권한과 비밀정보 관리 기준을 정리해 운영 리스크를 줄인 경험이 있습니다.'
            end
            when 'QA' then case demo_application_map.seed_no % 3
                when 0 then '핵심 회귀 시나리오를 자동화해 릴리즈 전 수동 확인 시간을 줄였습니다.'
                when 1 then '운영 이슈 재현 단계를 테스트 케이스로 정리해 개발팀과 소통 속도를 높였습니다.'
                else '배포 게이트 기준을 명확히 해 긴급 수정 배포 빈도를 낮춘 경험이 있습니다.'
            end
            else case demo_application_map.seed_no % 3
                when 0 then '여러 인터뷰어와 지원자 일정이 겹칠 때 우선순위를 정리하고 공지 템플릿을 만들어 혼선을 줄였습니다.'
                when 1 then '지원자 안내 문구를 표준화해 문의량을 줄이고 응답 시간을 단축한 경험이 있습니다.'
                else '채용 운영 체크리스트를 정리해 오퍼와 입사 전 행정 누락을 줄인 경험이 있습니다.'
            end
        end
        else null
    end,
    case
        when job_posting_question.question_type = 'CHOICE' then case demo_candidate_seed.family_code
            when 'FE' then (array['React/Next.js','TypeScript SPA','React Native'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'DESIGN' then (array['운영 도구 UX','디자인 시스템','모바일 앱 UX'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'BE' then (array['Java/Spring/PostgreSQL','Kotlin/Spring','Node.js/PostgreSQL'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'FS' then (array['React + Spring','Next.js + Node.js','React + Kotlin'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'MOBILE' then (array['Flutter','Android Native','iOS Native'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'DATA' then (array['SQL + Python','SQL + Tableau','Python + BI'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'ML' then (array['Python + PyTorch','Python + scikit-learn','Python + Spark'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'DEVOPS' then (array['AWS + Kubernetes','AWS + Terraform','GCP + Kubernetes'])[((demo_application_map.seed_no - 1) % 3) + 1]
            when 'QA' then (array['Playwright','Cypress','Postman/Newman'])[((demo_application_map.seed_no - 1) % 3) + 1]
            else (array['채용 운영','인터뷰 코디네이션','오퍼 및 입사 조율'])[((demo_application_map.seed_no - 1) % 3) + 1]
        end
        else null
    end,
    case
        when job_posting_question.question_type = 'SCALE' then 3 + (demo_application_map.seed_no % 3)
        else null
    end,
    coalesce(application.submitted_at, application.draft_saved_at),
    coalesce(application.submitted_at, application.draft_saved_at)
from demo_application_map
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no
join recruit.application application
    on application.id = demo_application_map.application_id
join recruit.job_posting_question job_posting_question
    on job_posting_question.job_posting_id = application.job_posting_id
where demo_application_map.application_status = 'SUBMITTED'
   or application.current_step >= 5;

create temporary table demo_attachment_file_seed (
    slot            int primary key,
    file_name       varchar(255) not null,
    storage_path    text not null
) on commit drop;

insert into demo_attachment_file_seed (slot, file_name, storage_path)
values
    (1, '3a81a1cf-dc02-431d-ac3a-6281c7d8bfad.pdf', '2026/03/3a81a1cf-dc02-431d-ac3a-6281c7d8bfad.pdf'),
    (2, '9062f10f-cf0c-4ff8-a831-f53c377a2f78.pdf', '2026/03/9062f10f-cf0c-4ff8-a831-f53c377a2f78.pdf'),
    (3, '786faa8e-6b3c-4205-85c7-b1c0f78202cc.pdf', '2026/03/786faa8e-6b3c-4205-85c7-b1c0f78202cc.pdf'),
    (4, 'ab7d752f-c76b-4b3a-92ae-07746d9c383a.pdf', '2026/03/ab7d752f-c76b-4b3a-92ae-07746d9c383a.pdf');

insert into recruit.application_attachment (
    application_id,
    file_name,
    original_name,
    content_type,
    file_size,
    storage_path,
    created_at
)
select
    application.application_id,
    demo_attachment_file_seed.file_name,
    case
        when application.attachment_rank % 5 = 0 then application.applicant_name || '_포트폴리오.pdf'
        when application.attachment_rank % 7 = 0 then application.applicant_name || '_resume.pdf'
        else application.applicant_name || '_이력서.pdf'
    end,
    'application/pdf',
    33,
    demo_attachment_file_seed.storage_path,
    application.created_at
from (
    select
        recruit.application.id as application_id,
        recruit.application.applicant_name,
        coalesce(recruit.application.submitted_at, recruit.application.draft_saved_at) + interval '15 minute' as created_at,
        row_number() over (order by recruit.application.id) as attachment_rank
    from recruit.application
    where recruit.application.job_posting_id <> 1001
      and recruit.application.status = 'SUBMITTED'
    order by recruit.application.id
    limit 28
) as application
join demo_attachment_file_seed
    on demo_attachment_file_seed.slot = ((application.attachment_rank - 1) % 4) + 1;

create temporary table demo_interview_admin_rank on commit drop as
select
    row_number() over (order by admin_account.id) as admin_rank,
    admin_account.id as admin_account_id
from platform.admin_account admin_account
order by admin_account.id;

insert into recruit.interview (
    application_id,
    job_posting_step_id,
    scheduled_at,
    status,
    note,
    created_at,
    updated_at
)
select
    interview_seed.application_id,
    step.id,
    interview_seed.scheduled_at,
    interview_seed.status,
    interview_seed.note,
    interview_seed.created_at,
    interview_seed.updated_at
from (
    select
        demo_application_map.application_id,
        demo_application_map.target_posting_id,
        demo_application_map.posting_rank,
        case
            when demo_application_map.target_posting_id = 1001 and demo_application_map.posting_rank between 4191 and 4250 then 'SCHEDULED'
            else 'COMPLETED'
        end as status,
        case
            when demo_application_map.target_posting_id = 1001 then '1차 인터뷰 일정이 확정되어 평가 대기 중입니다.'
            else '서류 통과 후 1차 인터뷰를 진행했습니다.'
        end as note,
        coalesce(application.reviewed_at, application.submitted_at, application.draft_saved_at) + interval '3 day' as scheduled_at,
        coalesce(application.reviewed_at, application.submitted_at, application.draft_saved_at) + interval '2 day' as created_at,
        coalesce(application.reviewed_at, application.submitted_at, application.draft_saved_at) + interval '2 day' as updated_at
    from demo_application_map
    join recruit.application application
        on application.id = demo_application_map.application_id
    where demo_application_map.review_status = 'PASSED'
      and (
            (demo_application_map.target_posting_id = 1001 and demo_application_map.posting_rank between 4191 and 4270)
            or (demo_application_map.target_posting_id <> 1001 and demo_application_map.posting_rank <= 4)
      )
) as interview_seed
join lateral (
    select job_posting_step.id
    from recruit.job_posting_step job_posting_step
    where job_posting_step.job_posting_id = interview_seed.target_posting_id
      and job_posting_step.step_type = 'INTERVIEW'
    order by job_posting_step.step_order
    limit 1
) as step on true;

insert into recruit.interview (
    application_id,
    job_posting_step_id,
    scheduled_at,
    status,
    note,
    created_at,
    updated_at
)
select
    second_round.application_id,
    step.id,
    second_round.scheduled_at,
    'COMPLETED',
    '최종 인터뷰까지 완료되어 의사결정 대기 중입니다.',
    second_round.scheduled_at - interval '1 day',
    second_round.scheduled_at - interval '1 day'
from (
    select
        demo_application_map.application_id,
        demo_application_map.target_posting_id,
        coalesce(application.final_decided_at, application.reviewed_at, application.submitted_at) - interval '2 day' as scheduled_at
    from demo_application_map
    join recruit.application application
        on application.id = demo_application_map.application_id
    where demo_application_map.final_status is not null
) as second_round
join lateral (
    select job_posting_step.id
    from recruit.job_posting_step job_posting_step
    where job_posting_step.job_posting_id = second_round.target_posting_id
      and job_posting_step.step_type = 'INTERVIEW'
    order by job_posting_step.step_order
    offset 1
    limit 1
) as step on true;

insert into recruit.evaluation (
    interview_id,
    evaluator_id,
    score,
    comment,
    result,
    created_at,
    updated_at
)
select
    interview.id,
    admin_rank_map.admin_account_id,
    case
        when evaluator_seed.slot = 1 then least(5, 3 + (demo_application_map.seed_no % 3))
        else least(5, 3 + ((demo_application_map.seed_no + 1) % 3))
    end::smallint,
    case demo_candidate_seed.family_code
        when 'BE' then '도메인 모델링과 장애 대응 경험을 구조적으로 설명했습니다.'
        when 'FE' then '입력 흐름 설계와 상태 관리 판단이 명확했습니다.'
        when 'DESIGN' then '문제 정의와 디자인 시스템 연결 방식이 안정적이었습니다.'
        when 'DATA' then '지표 해석과 설명력이 좋았고 현업 활용 포인트가 분명했습니다.'
        when 'ML' then '실험 설계와 모델 운영 관점의 설명이 균형 있었습니다.'
        when 'DEVOPS' then '배포 안정성과 운영 표준화에 대한 시야가 좋았습니다.'
        when 'QA' then '회귀 범위와 릴리즈 게이트 설계 경험이 설득력 있었습니다.'
        when 'HR' then '지원자 경험과 내부 운영 리듬을 함께 고려하는 답변이 좋았습니다.'
        else '역할 이해도와 협업 방식이 안정적으로 느껴졌습니다.'
    end,
    case
        when demo_application_map.final_status = 'WITHDRAWN' then 'HOLD'
        when interview.status = 'COMPLETED' and demo_application_map.seed_no % 9 = 0 then 'HOLD'
        when interview.status = 'COMPLETED' and demo_application_map.seed_no % 13 = 0 then 'FAIL'
        else 'PASS'
    end,
    interview.updated_at + (evaluator_seed.slot * interval '2 hour'),
    interview.updated_at + (evaluator_seed.slot * interval '2 hour')
from recruit.interview interview
join demo_application_map
    on demo_application_map.application_id = interview.application_id
join demo_candidate_seed
    on demo_candidate_seed.seed_no = demo_application_map.seed_no
join lateral (
    values
        (1, ((demo_application_map.seed_no - 1) % 5) + 1),
        (2, ((demo_application_map.seed_no + 1) % 5) + 1)
) as evaluator_seed(slot, admin_rank)
    on interview.status = 'COMPLETED'
join demo_interview_admin_rank admin_rank_map
    on admin_rank_map.admin_rank = evaluator_seed.admin_rank;

insert into recruit.notification_log (
    application_id,
    type,
    title,
    content,
    sent_by,
    created_at
)
select
    application.id,
    'INTERVIEW_INVITE',
    case
        when job_posting_step.step_order = 2 then '1차 인터뷰 일정 안내'
        else '최종 인터뷰 일정 안내'
    end,
    case
        when job_posting_step.step_order = 2 then '안녕하세요. 인터뷰 일정과 준비 사항을 메일로 안내드렸습니다.'
        else '최종 인터뷰 일정이 확정되어 준비 사항을 함께 안내드렸습니다.'
    end,
    coordinator.admin_account_id,
    interview.created_at
from recruit.interview interview
join recruit.application application
    on application.id = interview.application_id
join recruit.job_posting_step job_posting_step
    on job_posting_step.id = interview.job_posting_step_id
join demo_interview_admin_rank coordinator
    on coordinator.admin_rank = 3;

insert into recruit.notification_log (
    application_id,
    type,
    title,
    content,
    sent_by,
    created_at
)
select
    application.id,
    'REJECTION',
    '전형 결과 안내',
    case
        when application.job_posting_id = 1001 then '지원해 주신 내용은 잘 확인했습니다. 이번 백엔드 플랫폼 엔지니어 포지션에서는 다른 후보자와 우선 검토를 이어가게 되었습니다.'
        else '전형 검토 결과 이번 포지션과의 우선순위가 맞지 않아 다음 기회에 다시 연락드리고 싶습니다.'
    end,
    recruiter.admin_account_id,
    coalesce(application.reviewed_at, application.submitted_at, application.draft_saved_at)
from recruit.application application
join demo_interview_admin_rank recruiter
    on recruiter.admin_rank = 2
where application.review_status = 'REJECTED'
  and (
        application.job_posting_id <> 1001
        or application.id in (
            select inner_application.id
            from recruit.application inner_application
            where inner_application.job_posting_id = 1001
              and inner_application.review_status = 'REJECTED'
            order by inner_application.id
            limit 240
        )
  );

insert into recruit.notification_log (
    application_id,
    type,
    title,
    content,
    sent_by,
    created_at
)
select
    application.id,
    case application.final_status
        when 'OFFER_MADE' then 'OFFER'
        when 'ACCEPTED' then 'OFFER_ACCEPTED'
        when 'DECLINED' then 'OFFER_DECLINED'
        else 'WITHDRAWN'
    end,
    case application.final_status
        when 'OFFER_MADE' then '처우 협의 안내'
        when 'ACCEPTED' then '입사 확정 안내'
        when 'DECLINED' then '오퍼 회신 확인'
        else '전형 종료 안내'
    end,
    case application.final_status
        when 'OFFER_MADE' then '최종 합격 기준을 충족하여 처우 협의를 시작했습니다.'
        when 'ACCEPTED' then '오퍼 수락이 확인되어 온보딩 준비를 진행합니다.'
        when 'DECLINED' then '오퍼 검토 결과 다른 기회를 선택하셨음을 확인했습니다.'
        else '지원자 요청으로 전형을 종료하고 관련 이력을 정리했습니다.'
    end,
    manager.admin_account_id,
    application.final_decided_at
from recruit.application application
join demo_interview_admin_rank manager
    on manager.admin_rank = 4
where application.final_status is not null;

analyze platform.admin_account;
analyze platform.admin_session;
analyze platform.candidate_account;
analyze platform.candidate_session;
analyze platform.candidate_profile;
analyze platform.candidate_profile_education;
analyze platform.candidate_profile_experience;
analyze platform.candidate_profile_skill;
analyze platform.candidate_profile_certification;
analyze platform.candidate_profile_language;
analyze recruit.job_posting;
analyze recruit.job_posting_step;
analyze recruit.job_posting_question;
analyze recruit.application;
analyze recruit.application_answer;
analyze recruit.interview;
analyze recruit.evaluation;
analyze recruit.notification_log;

COMMIT;
