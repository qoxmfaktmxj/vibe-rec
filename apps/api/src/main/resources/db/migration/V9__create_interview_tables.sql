-- V9: 면접 일정 및 평가자 테이블

create type recruit.interview_type as enum ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL');
create type recruit.interview_status as enum ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
create type recruit.interview_result as enum ('PASS', 'FAIL', 'PENDING');

create table recruit.interview (
    id               bigint generated always as identity primary key,
    application_id   bigint not null references recruit.application(id) on delete cascade,
    interview_type   recruit.interview_type not null default 'ONSITE',
    scheduled_at     timestamptz not null,
    duration_minutes int not null default 60 check (duration_minutes > 0),
    location         varchar(300),
    online_link      varchar(500),
    status           recruit.interview_status not null default 'SCHEDULED',
    note             text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create index interview_application_id_idx on recruit.interview(application_id);
create index interview_scheduled_at_idx   on recruit.interview(scheduled_at);

create table recruit.interview_evaluator (
    id            bigint generated always as identity primary key,
    interview_id  bigint not null references recruit.interview(id) on delete cascade,
    evaluator_name varchar(120) not null,
    score         smallint check (score is null or (score >= 1 and score <= 5)),
    comment       text,
    result        recruit.interview_result not null default 'PENDING',
    evaluated_at  timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index interview_evaluator_interview_id_idx on recruit.interview_evaluator(interview_id);
