alter table platform.candidate_profile
    add column version bigint not null default 0;
