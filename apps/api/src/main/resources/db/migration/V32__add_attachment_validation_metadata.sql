alter table recruit.application_attachment
    add column sha256 char(64) not null default repeat('0', 64),
    add column validation_status varchar(30) not null default 'LEGACY_UNVERIFIED';

alter table recruit.application_attachment
    add constraint application_attachment_validation_status_ck
        check (validation_status in ('LEGACY_UNVERIFIED', 'SIGNATURE_VALIDATED'));

create index application_attachment_sha256_idx
    on recruit.application_attachment(sha256);
