alter table recruit.application
    drop constraint application_status_ck;

alter table recruit.application
    add constraint application_status_ck
        check (status in ('DRAFT', 'SUBMITTED', 'WITHDRAWN')),
    add column withdrawn_at timestamptz,
    add column withdrawal_reason text;

alter table recruit.application
    add constraint application_withdrawal_fields_ck
        check (
            (status = 'WITHDRAWN' and withdrawn_at is not null and withdrawal_reason is not null)
            or status <> 'WITHDRAWN'
        );
