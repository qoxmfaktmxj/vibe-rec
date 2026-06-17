create temporary table monthly_job_posting_month (
    month_no smallint primary key,
    opens_at timestamptz not null,
    closes_at timestamptz not null
) on commit drop;

insert into monthly_job_posting_month (month_no, opens_at, closes_at)
values
    (6, timestamptz '2026-06-01 09:00:00+09', timestamptz '2026-06-30 18:00:00+09'),
    (7, timestamptz '2026-07-01 09:00:00+09', timestamptz '2026-07-30 18:00:00+09'),
    (8, timestamptz '2026-08-01 09:00:00+09', timestamptz '2026-08-30 18:00:00+09'),
    (9, timestamptz '2026-09-01 09:00:00+09', timestamptz '2026-09-30 18:00:00+09'),
    (10, timestamptz '2026-10-01 09:00:00+09', timestamptz '2026-10-30 18:00:00+09'),
    (11, timestamptz '2026-11-01 09:00:00+09', timestamptz '2026-11-30 18:00:00+09'),
    (12, timestamptz '2026-12-01 09:00:00+09', timestamptz '2026-12-30 18:00:00+09');

create temporary table monthly_job_posting_base on commit drop as
select
    job_posting.id as original_job_posting_id,
    job_posting.legacy_anno_id,
    job_posting.public_key,
    job_posting.title,
    job_posting.headline,
    job_posting.description,
    job_posting.employment_type,
    job_posting.location,
    job_posting.recruitment_category,
    job_posting.recruitment_mode
from recruit.job_posting
where job_posting.id between 1001 and 1020
  and job_posting.recruitment_mode = 'FIXED_TERM'
order by job_posting.id;

insert into recruit.job_posting (
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
    monthly_job_posting_base.legacy_anno_id,
    monthly_job_posting_base.public_key || '-2026-' || lpad(monthly_job_posting_month.month_no::text, 2, '0'),
    monthly_job_posting_base.title,
    monthly_job_posting_base.headline,
    monthly_job_posting_base.description,
    monthly_job_posting_base.employment_type,
    monthly_job_posting_base.location,
    'OPEN',
    true,
    monthly_job_posting_month.opens_at,
    monthly_job_posting_month.closes_at,
    monthly_job_posting_base.recruitment_category,
    'FIXED_TERM'
from monthly_job_posting_base
cross join monthly_job_posting_month
on conflict (public_key) do update
set title = excluded.title,
    headline = excluded.headline,
    description = excluded.description,
    employment_type = excluded.employment_type,
    location = excluded.location,
    status = excluded.status,
    published = excluded.published,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    recruitment_category = excluded.recruitment_category,
    recruitment_mode = excluded.recruitment_mode,
    updated_at = current_timestamp;

create temporary table monthly_job_posting_map on commit drop as
select
    monthly_job_posting_base.original_job_posting_id,
    job_posting.id as job_posting_id,
    monthly_job_posting_month.month_no,
    monthly_job_posting_month.opens_at
from monthly_job_posting_base
cross join monthly_job_posting_month
join recruit.job_posting
    on job_posting.public_key = monthly_job_posting_base.public_key || '-2026-' || lpad(monthly_job_posting_month.month_no::text, 2, '0');

delete from recruit.job_posting_question
where job_posting_id in (
    select monthly_job_posting_map.job_posting_id
    from monthly_job_posting_map
);

delete from recruit.job_posting_step
where job_posting_id in (
    select monthly_job_posting_map.job_posting_id
    from monthly_job_posting_map
);

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
    monthly_job_posting_map.job_posting_id,
    job_posting_step.step_order,
    job_posting_step.step_type,
    job_posting_step.title,
    job_posting_step.description,
    monthly_job_posting_map.opens_at + ((job_posting_step.step_order - 1) * interval '7 day'),
    monthly_job_posting_map.opens_at + ((job_posting_step.step_order - 1) * interval '7 day') + interval '5 day'
from monthly_job_posting_map
join recruit.job_posting_step
    on job_posting_step.job_posting_id = monthly_job_posting_map.original_job_posting_id
order by monthly_job_posting_map.job_posting_id, job_posting_step.step_order;

insert into recruit.job_posting_question (
    job_posting_id,
    question_text,
    question_type,
    choices,
    required,
    sort_order
)
select
    monthly_job_posting_map.job_posting_id,
    job_posting_question.question_text,
    job_posting_question.question_type,
    job_posting_question.choices,
    job_posting_question.required,
    job_posting_question.sort_order
from monthly_job_posting_map
join recruit.job_posting_question
    on job_posting_question.job_posting_id = monthly_job_posting_map.original_job_posting_id
order by monthly_job_posting_map.job_posting_id, job_posting_question.sort_order;

select setval('recruit.job_posting_id_seq', (select max(id) from recruit.job_posting), true);
select setval('recruit.job_posting_step_id_seq', (select max(id) from recruit.job_posting_step), true);
select setval('recruit.job_posting_question_id_seq', (select max(id) from recruit.job_posting_question), true);

analyze recruit.job_posting;
analyze recruit.job_posting_step;
analyze recruit.job_posting_question;
