update platform.permission
set name = case code
    when 'APPLICANT_VIEW' then 'Applicant View'
    when 'APPLICANT_REVIEW' then 'Applicant Review'
    when 'INTERVIEW_MANAGE' then 'Interview Manage'
    when 'EVALUATION_WRITE' then 'Evaluation Write'
    when 'FINAL_DECIDE' then 'Final Decision'
    when 'NOTIFICATION_SEND' then 'Notification Send'
    when 'ADMIN_MANAGE' then 'Admin Manage'
    else name
end;

insert into platform.permission (code, name)
select
    format('SEED_PERMISSION_%s', lpad(gs::text, 3, '0')),
    format('Seed Permission %s', lpad(gs::text, 3, '0'))
from generate_series(1, 53) as gs
on conflict (code) do nothing;

insert into platform.role_permission (role, permission_id)
select role_map.role, permission.id
from platform.permission permission
join (
    values
        ('SUPER_ADMIN'),
        ('ADMIN')
) as role_map(role) on true
where permission.code like 'SEED_PERMISSION_%'
on conflict (role, permission_id) do nothing;

analyze platform.permission;
analyze platform.role_permission;
