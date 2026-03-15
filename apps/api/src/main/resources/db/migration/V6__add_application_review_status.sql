alter table recruit.application
    add column review_status varchar(20) not null default 'NEW',
    add column review_note text,
    add column reviewed_at timestamptz;

alter table recruit.application
    add constraint application_review_status_ck
        check (review_status in ('NEW', 'IN_REVIEW', 'PASSED', 'REJECTED'));

create index application_review_status_idx
    on recruit.application(review_status);

create index application_job_posting_status_idx
    on recruit.application(job_posting_id, status, review_status);
