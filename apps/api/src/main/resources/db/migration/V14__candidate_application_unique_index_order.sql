drop index if exists recruit.application_job_posting_candidate_uidx;

create unique index application_job_posting_candidate_uidx
    on recruit.application(job_posting_id, candidate_account_id)
    where candidate_account_id is not null;
