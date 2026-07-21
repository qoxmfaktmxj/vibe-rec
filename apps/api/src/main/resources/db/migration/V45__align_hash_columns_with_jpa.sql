alter table recruit.application_attachment
    alter column sha256 type varchar(64);

alter table recruit.application_submission_request
    alter column request_hash type varchar(64);

alter table platform.candidate_auth_token
    alter column token_hash type varchar(64);

alter table platform.authentication_rate_limit
    alter column subject_hash type varchar(64);
