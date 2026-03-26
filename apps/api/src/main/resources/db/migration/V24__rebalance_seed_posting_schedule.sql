with seed_postings as (
    select
        job_posting.id as job_posting_id,
        job_posting.public_key,
        row_number() over (
            order by
                case when job_posting.public_key = 'seed-hotspot-platform-engineer' then 0 else 1 end,
                job_posting.public_key
        ) - 1 as seed_index
    from recruit.job_posting
    where job_posting.public_key like 'seed-%'
),
seed_schedule as (
    select
        seed_postings.job_posting_id,
        timestamptz '2025-01-01 09:00:00+09' + (seed_postings.seed_index * interval '7 day 8 hour') as opens_at,
        case
            when seed_postings.seed_index % 6 = 0 then null
            else timestamptz '2025-01-01 09:00:00+09'
                    + (seed_postings.seed_index * interval '7 day 8 hour')
                    + interval '46 day'
        end as closes_at,
        case
            when seed_postings.seed_index >= 70 then 'OPEN'
            when seed_postings.seed_index % 5 = 0 then 'CLOSED'
            else 'OPEN'
        end as status,
        case
            when seed_postings.seed_index % 6 = 0 then 'ROLLING'
            else 'FIXED_TERM'
        end as recruitment_mode
    from seed_postings
)
update recruit.job_posting as job_posting
set opens_at = seed_schedule.opens_at,
    closes_at = seed_schedule.closes_at,
    status = seed_schedule.status,
    recruitment_mode = seed_schedule.recruitment_mode
from seed_schedule
where job_posting.id = seed_schedule.job_posting_id;

update recruit.job_posting_step as job_posting_step
set starts_at = job_posting.opens_at + ((job_posting_step.step_order - 1) * interval '7 day'),
    ends_at = case
        when job_posting_step.step_type = 'OFFER' and job_posting.recruitment_mode = 'ROLLING' then null
        else job_posting.opens_at + ((job_posting_step.step_order - 1) * interval '7 day') + interval '5 day'
    end
from recruit.job_posting as job_posting
where job_posting_step.job_posting_id = job_posting.id
  and job_posting.public_key like 'seed-%';

analyze recruit.job_posting;
analyze recruit.job_posting_step;
