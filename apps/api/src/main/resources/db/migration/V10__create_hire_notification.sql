-- V10: 최종 합격 결정 및 통지 테이블

create type recruit.hire_decision_type as enum ('HIRED', 'REJECTED', 'WITHDRAWN');
create type recruit.notification_channel as enum ('EMAIL', 'SMS');
create type recruit.notification_status as enum ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

create table recruit.hire_decision (
    id               bigint generated always as identity primary key,
    application_id   bigint not null unique references recruit.application(id) on delete cascade,
    decision         recruit.hire_decision_type not null,
    salary_info      varchar(200),
    start_date       date,
    note             text,
    decided_at       timestamptz not null default now(),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create index hire_decision_application_id_idx on recruit.hire_decision(application_id);

create table recruit.notification_template (
    id             bigint generated always as identity primary key,
    template_key   varchar(80) not null unique,
    title          varchar(200) not null,
    body_template  text not null,
    channel        recruit.notification_channel not null default 'EMAIL',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create table recruit.notification_log (
    id              bigint generated always as identity primary key,
    application_id  bigint not null references recruit.application(id) on delete cascade,
    template_id     bigint references recruit.notification_template(id) on delete set null,
    channel         recruit.notification_channel not null,
    recipient       varchar(300) not null,
    subject         varchar(300) not null,
    body            text not null,
    status          recruit.notification_status not null default 'PENDING',
    sent_at         timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index notification_log_application_id_idx on recruit.notification_log(application_id);

-- 기본 통지 템플릿 시드
insert into recruit.notification_template (template_key, title, body_template, channel) values
(
    'HIRED',
    '[{{jobPostingTitle}}] 최종 합격 안내',
    '안녕하세요, {{applicantName}}님.

{{jobPostingTitle}} 포지션에 지원해 주셔서 진심으로 감사드립니다.

신중한 검토 끝에, {{applicantName}}님을 최종 합격자로 선정하게 되었음을 기쁘게 알려드립니다.

{{#salaryInfo}}제안 연봉: {{salaryInfo}}{{/salaryInfo}}
{{#startDate}}입사 예정일: {{startDate}}{{/startDate}}

추가 안내 사항은 별도로 연락드릴 예정입니다.
감사합니다.',
    'EMAIL'
),
(
    'REJECTED',
    '[{{jobPostingTitle}}] 지원 결과 안내',
    '안녕하세요, {{applicantName}}님.

{{jobPostingTitle}} 포지션에 지원해 주셔서 감사드립니다.

신중한 검토 끝에, 이번에는 함께하지 못하게 되었음을 알려드립니다.
귀하의 역량과 노력에 깊은 감사를 드리며, 앞으로의 활동에 좋은 결과가 있으시길 바랍니다.

감사합니다.',
    'EMAIL'
);
