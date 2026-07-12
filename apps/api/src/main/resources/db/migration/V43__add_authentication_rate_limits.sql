create table platform.authentication_rate_limit (
    scope varchar(40) not null,
    subject_hash char(64) not null,
    window_started_at timestamptz not null,
    attempt_count integer not null,
    blocked_until timestamptz,
    updated_at timestamptz not null default current_timestamp,
    primary key (scope, subject_hash),
    constraint authentication_rate_limit_scope_ck check (scope in (
        'ADMIN_LOGIN',
        'CANDIDATE_LOGIN',
        'CANDIDATE_PASSWORD_RESET',
        'CANDIDATE_EMAIL_VERIFICATION'
    )),
    constraint authentication_rate_limit_attempt_count_ck check (attempt_count > 0)
);

create index authentication_rate_limit_blocked_idx
    on platform.authentication_rate_limit(blocked_until)
    where blocked_until is not null;
