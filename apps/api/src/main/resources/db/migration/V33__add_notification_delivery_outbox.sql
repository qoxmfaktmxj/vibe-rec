alter table recruit.notification_log
    add column channel varchar(20) not null default 'IN_APP',
    add column delivery_status varchar(20) not null default 'DELIVERED',
    add column delivery_attempts integer not null default 1,
    add column next_attempt_at timestamptz,
    add column delivered_at timestamptz,
    add column read_at timestamptz,
    add column last_error text,
    add column updated_at timestamptz not null default current_timestamp;

update recruit.notification_log
set delivered_at = created_at
where delivered_at is null;

alter table recruit.notification_log
    add constraint notification_log_channel_ck
        check (channel in ('IN_APP')),
    add constraint notification_log_delivery_status_ck
        check (delivery_status in ('PENDING', 'DELIVERED', 'FAILED')),
    add constraint notification_log_delivery_attempts_ck
        check (delivery_attempts >= 0);

create index notification_log_dispatch_idx
    on recruit.notification_log(delivery_status, next_attempt_at, created_at)
    where delivery_status in ('PENDING', 'FAILED');

create index notification_log_candidate_inbox_idx
    on recruit.notification_log(application_id, delivered_at desc, id desc)
    where delivery_status = 'DELIVERED';
