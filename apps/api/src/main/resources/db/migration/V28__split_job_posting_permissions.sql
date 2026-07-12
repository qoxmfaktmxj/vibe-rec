insert into platform.permission (code, name)
values
    ('JOB_POSTING_VIEW', 'Job Posting View'),
    ('JOB_POSTING_MANAGE', 'Job Posting Manage')
on conflict (code) do nothing;

insert into platform.role_permission (role, permission_id)
select 'SUPER_ADMIN', id
from platform.permission
where code in ('JOB_POSTING_VIEW', 'JOB_POSTING_MANAGE')
on conflict (role, permission_id) do nothing;

insert into platform.role_permission (role, permission_id)
select 'ADMIN', id
from platform.permission
where code = 'JOB_POSTING_VIEW'
on conflict (role, permission_id) do nothing;
