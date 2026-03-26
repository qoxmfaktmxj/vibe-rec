alter table recruit.application
    add column current_step   smallint not null default 1,
    add column motivation_fit text;
