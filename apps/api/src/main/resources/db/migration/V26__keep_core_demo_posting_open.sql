update recruit.job_posting
set status = 'OPEN',
    published = true,
    recruitment_mode = 'FIXED_TERM',
    opens_at = current_timestamp - interval '7 day',
    closes_at = current_timestamp + interval '30 day'
where id in (1001, 1011);

update recruit.job_posting_step as step
set starts_at = posting.opens_at + ((step.step_order - 1) * interval '7 day'),
    ends_at = posting.opens_at + ((step.step_order - 1) * interval '7 day') + interval '5 day'
from recruit.job_posting as posting
where step.job_posting_id = posting.id
  and posting.id in (1001, 1011);
