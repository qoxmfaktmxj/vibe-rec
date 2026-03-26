create unique index if not exists job_posting_question_posting_sort_uidx
    on recruit.job_posting_question(job_posting_id, sort_order);

alter table recruit.application_answer
    add constraint application_answer_single_value_ck
        check (num_nonnulls(answer_text, answer_choice, answer_scale) = 1);

create index if not exists application_job_posting_activity_idx
    on recruit.application(job_posting_id, (coalesce(submitted_at, draft_saved_at)) desc, id desc);
