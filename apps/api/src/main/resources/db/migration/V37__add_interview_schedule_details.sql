alter table recruit.interview
    add column interview_type varchar(20) not null default 'VIDEO',
    add column duration_minutes integer not null default 60,
    add column location varchar(300),
    add column online_link varchar(1000),
    add constraint interview_type_ck check (interview_type in ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL')),
    add constraint interview_duration_ck check (duration_minutes between 15 and 480);
