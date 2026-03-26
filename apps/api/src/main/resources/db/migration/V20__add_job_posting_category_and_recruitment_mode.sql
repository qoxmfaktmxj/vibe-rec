alter table recruit.job_posting
    add column recruitment_category varchar(20) not null default 'EXPERIENCED',
    add column recruitment_mode varchar(20) not null default 'FIXED_TERM';

alter table recruit.job_posting
    alter column closes_at drop not null;

update recruit.job_posting
set recruitment_category = 'NEW_GRAD'
where id in (1004, 1005, 1010, 1012, 1013, 1018);

update recruit.job_posting
set recruitment_mode = 'ROLLING',
    closes_at = null
where id in (1003, 1014, 1015);

update recruit.job_posting_step
set starts_at = null,
    ends_at = null
where job_posting_id in (1003, 1014, 1015);

alter table recruit.job_posting
    add constraint job_posting_recruitment_category_ck
        check (recruitment_category in ('NEW_GRAD', 'EXPERIENCED'));

alter table recruit.job_posting
    add constraint job_posting_recruitment_mode_ck
        check (recruitment_mode in ('FIXED_TERM', 'ROLLING'));

alter table recruit.job_posting
    add constraint job_posting_closes_at_ck
        check (
            (recruitment_mode = 'FIXED_TERM' and closes_at is not null)
            or recruitment_mode = 'ROLLING'
        );
