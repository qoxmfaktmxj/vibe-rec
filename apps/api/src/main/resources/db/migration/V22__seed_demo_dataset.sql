insert into platform.admin_account (
    username,
    display_name,
    password_hash,
    role,
    active,
    last_authenticated_at
)
select
    format('seed-admin-%s', lpad(gs::text, 3, '0')),
    format('Seed Admin %s', lpad(gs::text, 3, '0')),
    '$2a$10$vTeoCMn4wHCEQKhYNEKWXuMn4Q1OutEEZTENWmKXMPq2p6i7iD9uq',
    case when gs <= 12 then 'SUPER_ADMIN' else 'ADMIN' end,
    true,
    current_timestamp - ((gs % 14) * interval '1 day')
from generate_series(1, 60) as gs
where current_database() not like '%_test'
on conflict (username) do nothing;

insert into platform.admin_session (
    admin_account_id,
    token_hash,
    expires_at,
    last_seen_at,
    created_at,
    updated_at
)
select
    admin_account.id,
    encode(digest('seed-admin-session-' || lpad(gs::text, 3, '0'), 'sha256'), 'hex'),
    current_timestamp + interval '90 day',
    current_timestamp - ((gs % 6) * interval '1 hour'),
    current_timestamp - ((gs % 30) * interval '1 day'),
    current_timestamp
from generate_series(1, 60) as gs
join platform.admin_account
    on admin_account.username = format('seed-admin-%s', lpad(gs::text, 3, '0'))
where current_database() not like '%_test'
on conflict (token_hash) do nothing;

insert into platform.candidate_account (
    email,
    normalized_email,
    display_name,
    phone_number,
    password_hash,
    status,
    last_authenticated_at
)
select
    format('candidate%s@seed.hireflow.local', lpad(gs::text, 5, '0')),
    format('candidate%s@seed.hireflow.local', lpad(gs::text, 5, '0')),
    format('Candidate %s', lpad(gs::text, 5, '0')),
    format(
        '010-%s-%s',
        lpad(((gs - 1) % 10000)::text, 4, '0'),
        lpad(((gs * 37) % 10000)::text, 4, '0')
    ),
    '$2a$10$vTeoCMn4wHCEQKhYNEKWXuMn4Q1OutEEZTENWmKXMPq2p6i7iD9uq',
    'ACTIVE',
    current_timestamp - ((gs % 21) * interval '1 day')
from generate_series(1, 10000) as gs
where current_database() not like '%_test'
on conflict (normalized_email) do nothing;

create temporary table seed_candidate_map on commit drop as
select
    row_number() over (order by candidate_account.normalized_email) as seed_no,
    candidate_account.id as candidate_account_id
from platform.candidate_account
where current_database() not like '%_test'
  and candidate_account.normalized_email like 'candidate%@seed.hireflow.local'
order by candidate_account.normalized_email;

create temporary table seed_admin_map on commit drop as
select
    row_number() over (order by admin_account.username) as seed_no,
    admin_account.id as admin_account_id
from platform.admin_account
where current_database() not like '%_test'
  and admin_account.username like 'seed-admin-%'
order by admin_account.username;

insert into platform.candidate_session (
    candidate_account_id,
    token_hash,
    expires_at,
    last_seen_at,
    created_at,
    updated_at
)
select
    seed_candidate_map.candidate_account_id,
    encode(digest('seed-candidate-session-' || lpad(seed_candidate_map.seed_no::text, 5, '0'), 'sha256'), 'hex'),
    current_timestamp + interval '90 day',
    current_timestamp - ((seed_candidate_map.seed_no % 8) * interval '1 hour'),
    current_timestamp - ((seed_candidate_map.seed_no % 30) * interval '1 day'),
    current_timestamp
from seed_candidate_map
on conflict (token_hash) do nothing;

insert into platform.candidate_profile (
    candidate_account_id,
    introduction_template,
    core_strength_template,
    career_years,
    updated_at
)
select
    seed_candidate_map.candidate_account_id,
    format('Candidate %s focuses on predictable delivery, clear communication, and practical product execution.', lpad(seed_candidate_map.seed_no::text, 5, '0')),
    case seed_candidate_map.seed_no % 4
        when 0 then 'Back-end delivery'
        when 1 then 'Customer communication'
        when 2 then 'Operational rigor'
        else 'Cross-functional execution'
    end,
    1 + (seed_candidate_map.seed_no % 12),
    current_timestamp
from seed_candidate_map
on conflict (candidate_account_id) do nothing;

insert into platform.candidate_profile_education (
    candidate_account_id,
    institution,
    degree,
    field_of_study,
    start_date,
    end_date,
    description,
    sort_order
)
select
    seed_candidate_map.candidate_account_id,
    format('Seed University %s', 1 + (seed_candidate_map.seed_no % 18)),
    case seed_candidate_map.seed_no % 5
        when 0 then 'BACHELOR'
        when 1 then 'MASTER'
        when 2 then 'ASSOCIATE'
        when 3 then 'BACHELOR'
        else 'DOCTORATE'
    end,
    case seed_candidate_map.seed_no % 4
        when 0 then 'Computer Science'
        when 1 then 'Business Administration'
        when 2 then 'Design'
        else 'Industrial Engineering'
    end,
    make_date((2012 + (seed_candidate_map.seed_no % 8))::int, 3, 1),
    make_date((2016 + (seed_candidate_map.seed_no % 8))::int, 2, 28),
    'Seeded education history for local demo environments.',
    0
from seed_candidate_map;

insert into platform.candidate_profile_experience (
    candidate_account_id,
    company,
    position,
    start_date,
    end_date,
    description,
    sort_order
)
select
    seed_candidate_map.candidate_account_id,
    format('Seed Company %s', 1 + (seed_candidate_map.seed_no % 120)),
    case seed_candidate_map.seed_no % 5
        when 0 then 'Engineer'
        when 1 then 'Analyst'
        when 2 then 'Coordinator'
        when 3 then 'Designer'
        else 'Specialist'
    end,
    make_date((2018 + (seed_candidate_map.seed_no % 5))::int, 1, 1),
    case when seed_candidate_map.seed_no % 6 = 0 then null else make_date(2023, 12, 31) end,
    'Seeded professional history for realistic applicant profiles.',
    0
from seed_candidate_map;

insert into platform.candidate_profile_skill (
    candidate_account_id,
    skill_name,
    proficiency,
    years,
    sort_order
)
select
    seed_candidate_map.candidate_account_id,
    skill.skill_name,
    skill.proficiency,
    skill.years,
    skill.sort_order
from seed_candidate_map
cross join lateral (
    values
        (
            0,
            case when seed_candidate_map.seed_no % 2 = 0 then 'Java' else 'TypeScript' end,
            'ADVANCED',
            2 + (seed_candidate_map.seed_no % 6)
        ),
        (
            1,
            case when seed_candidate_map.seed_no % 3 = 0 then 'PostgreSQL' else 'React' end,
            'INTERMEDIATE',
            1 + (seed_candidate_map.seed_no % 4)
        )
) as skill(sort_order, skill_name, proficiency, years);

insert into platform.candidate_profile_certification (
    candidate_account_id,
    certification_name,
    issuer,
    issued_date,
    expiry_date,
    sort_order
)
select
    seed_candidate_map.candidate_account_id,
    case seed_candidate_map.seed_no % 4
        when 0 then 'SQL Professional'
        when 1 then 'Cloud Practitioner'
        when 2 then 'UX Fundamentals'
        else 'Project Coordination'
    end,
    'HireFlow Seed Authority',
    make_date((2021 + (seed_candidate_map.seed_no % 4))::int, 6, 15),
    null,
    0
from seed_candidate_map;

insert into platform.candidate_profile_language (
    candidate_account_id,
    language_name,
    proficiency,
    test_name,
    test_score,
    sort_order
)
select
    seed_candidate_map.candidate_account_id,
    case when seed_candidate_map.seed_no % 3 = 0 then 'English' else 'Korean' end,
    case seed_candidate_map.seed_no % 4
        when 0 then 'NATIVE'
        when 1 then 'ADVANCED'
        when 2 then 'INTERMEDIATE'
        else 'BUSINESS'
    end,
    case when seed_candidate_map.seed_no % 3 = 0 then 'TOEIC' else 'TOPIK' end,
    case when seed_candidate_map.seed_no % 3 = 0 then '915' else '6' end,
    0
from seed_candidate_map;

insert into recruit.job_posting (
    legacy_anno_id,
    public_key,
    title,
    headline,
    description,
    employment_type,
    recruitment_category,
    recruitment_mode,
    location,
    status,
    published,
    opens_at,
    closes_at
)
select
    930000 + gs,
    case
        when gs = 1 then 'seed-hotspot-platform-engineer'
        else format('seed-role-%s', lpad(gs::text, 3, '0'))
    end,
    case
        when gs = 1 then 'Platform Engineer Load Test Posting'
        else format('Seed Role %s', lpad(gs::text, 3, '0'))
    end,
    case
        when gs = 1 then 'Stress-test posting with a 5,000 applicant pool.'
        else format('Demo hiring lane %s for seeded QA flows.', lpad(gs::text, 3, '0'))
    end,
    case
        when gs = 1 then 'Use this posting for applicant-list, review, and detail-page load checks.'
        else 'Default seeded posting for admin dashboards, applicant flows, and search/filter verification.'
    end,
    case when gs % 5 = 0 then 'CONTRACT' else 'FULL_TIME' end,
    case when gs % 2 = 0 then 'NEW_GRAD' else 'EXPERIENCED' end,
    case when gs <= 30 and gs % 4 = 0 then 'ROLLING' else 'FIXED_TERM' end,
    case gs % 6
        when 0 then 'Seoul'
        when 1 then 'Busan'
        when 2 then 'Incheon'
        when 3 then 'Daejeon'
        when 4 then 'Daegu'
        else 'Suwon'
    end,
    case when gs <= 30 then 'OPEN' else 'CLOSED' end,
    true,
    timestamptz '2025-01-01 09:00:00+09' + ((((gs - 1) * 729) / 99) * interval '1 day'),
    case
        when gs <= 30 and gs % 4 = 0 then null
        else (timestamptz '2025-01-01 09:00:00+09' + ((((gs - 1) * 729) / 99) * interval '1 day'))
            + interval '45 day' + ((gs % 10) * interval '1 day')
    end
from generate_series(1, 100) as gs
where current_database() not like '%_test'
on conflict (public_key) do nothing;

insert into recruit.job_posting_step (
    job_posting_id,
    step_order,
    step_type,
    title,
    description,
    starts_at,
    ends_at
)
select
    job_posting.id,
    step.step_order,
    step.step_type,
    step.title,
    step.description,
    job_posting.opens_at + ((step.step_order - 1) * interval '7 day'),
    case
        when step.step_type = 'OFFER' and job_posting.recruitment_mode = 'ROLLING' then null
        else job_posting.opens_at + ((step.step_order - 1) * interval '7 day') + interval '5 day'
    end
from recruit.job_posting
cross join (
    values
        (1, 'DOCUMENT', 'Resume review', 'Review resume fit and profile alignment.'),
        (2, 'ASSIGNMENT', 'Practical exercise', 'Validate problem solving and written communication.'),
        (3, 'INTERVIEW', 'Panel interview', 'Assess role depth, collaboration, and ownership.'),
        (4, 'OFFER', 'Offer discussion', 'Align scope, timing, and compensation expectations.')
) as step(step_order, step_type, title, description)
where current_database() not like '%_test'
  and job_posting.public_key like 'seed-%'
on conflict (job_posting_id, step_order) do nothing;

insert into recruit.job_posting_question (
    job_posting_id,
    question_text,
    question_type,
    choices,
    required,
    sort_order
)
select
    job_posting.id,
    question.question_text,
    question.question_type,
    question.choices,
    question.required,
    question.sort_order
from recruit.job_posting
cross join (
    values
        (
            1,
            'Share one project or achievement most relevant to this role.',
            'TEXT',
            null::jsonb,
            true
        ),
        (
            2,
            'How closely does this role match your near-term career plan?',
            'CHOICE',
            '["Strong fit","Open to either","Exploring options"]'::jsonb,
            true
        ),
        (
            3,
            'Rate your confidence in handling the core responsibilities.',
            'SCALE',
            null::jsonb,
            true
        )
) as question(sort_order, question_text, question_type, choices, required)
where current_database() not like '%_test'
on conflict (job_posting_id, sort_order) do nothing;

create temporary table seed_hotspot_posting on commit drop as
select job_posting.id as job_posting_id
from recruit.job_posting
where current_database() not like '%_test'
  and job_posting.public_key = 'seed-hotspot-platform-engineer';

create temporary table seed_target_postings on commit drop as
select
    row_number() over (order by job_posting.id) as seed_no,
    job_posting.id as job_posting_id
from recruit.job_posting
where current_database() not like '%_test'
  and job_posting.public_key <> 'seed-hotspot-platform-engineer'
order by job_posting.id
limit 99;

create temporary table seed_application_source on commit drop as
select
    seed_candidate_map.seed_no,
    seed_candidate_map.candidate_account_id,
    candidate_account.display_name,
    candidate_account.email,
    candidate_account.phone_number,
    seed_hotspot_posting.job_posting_id,
    timestamptz '2025-01-15 09:00:00+09'
        + ((seed_candidate_map.seed_no % 680) * interval '1 day')
        + ((seed_candidate_map.seed_no % 8) * interval '1 hour') as draft_saved_at,
    case when seed_candidate_map.seed_no % 5 = 0 then 'DRAFT' else 'SUBMITTED' end as application_status
from seed_candidate_map
join platform.candidate_account
    on candidate_account.id = seed_candidate_map.candidate_account_id
cross join seed_hotspot_posting
where seed_candidate_map.seed_no <= 5000
union all
select
    seed_candidate_map.seed_no,
    seed_candidate_map.candidate_account_id,
    candidate_account.display_name,
    candidate_account.email,
    candidate_account.phone_number,
    seed_target_postings.job_posting_id,
    timestamptz '2025-01-15 09:00:00+09'
        + ((seed_candidate_map.seed_no % 680) * interval '1 day')
        + ((seed_candidate_map.seed_no % 8) * interval '1 hour') as draft_saved_at,
    case when seed_candidate_map.seed_no % 5 = 0 then 'DRAFT' else 'SUBMITTED' end as application_status
from seed_candidate_map
join platform.candidate_account
    on candidate_account.id = seed_candidate_map.candidate_account_id
join seed_target_postings
    on seed_target_postings.seed_no = (((seed_candidate_map.seed_no - 5001) % 99) + 1)
where seed_candidate_map.seed_no > 5000;

insert into recruit.application (
    job_posting_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    status,
    review_status,
    review_note,
    reviewed_at,
    final_status,
    final_decided_at,
    final_note,
    draft_saved_at,
    submitted_at,
    candidate_account_id,
    introduction,
    core_strength,
    career_years,
    current_step,
    motivation_fit
)
select
    seed_application_source.job_posting_id,
    seed_application_source.display_name,
    seed_application_source.email,
    seed_application_source.phone_number,
    seed_application_source.application_status,
    case
        when seed_application_source.application_status = 'DRAFT' then 'NEW'
        when seed_application_source.seed_no % 10 in (0, 1, 2) then 'NEW'
        when seed_application_source.seed_no % 10 in (3, 4, 5) then 'IN_REVIEW'
        when seed_application_source.seed_no % 10 in (6, 7) then 'PASSED'
        else 'REJECTED'
    end,
    case
        when seed_application_source.application_status = 'DRAFT' then null
        when seed_application_source.seed_no % 10 in (6, 7) then 'Cleared the document review and is ready for deeper evaluation.'
        when seed_application_source.seed_no % 10 in (8, 9) then 'Did not meet the target bar for this hiring lane.'
        when seed_application_source.seed_no % 10 in (3, 4, 5) then 'Currently under active review by the recruiting team.'
        else 'Queued for review.'
    end,
    case
        when seed_application_source.application_status = 'DRAFT' then null
        when seed_application_source.seed_no % 10 in (3, 4, 5, 6, 7, 8, 9)
            then seed_application_source.draft_saved_at + interval '2 day'
        else null
    end,
    case
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 0 then 'OFFER_MADE'
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 1 then 'ACCEPTED'
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 2 then 'DECLINED'
        else null
    end,
    case
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 in (0, 1, 2)
            then seed_application_source.draft_saved_at + interval '7 day'
        else null
    end,
    case
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 0 then 'Offer packet shared with the candidate.'
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 1 then 'Candidate accepted and onboarding prep can begin.'
        when seed_application_source.application_status = 'SUBMITTED'
             and seed_application_source.seed_no % 10 in (6, 7)
             and seed_application_source.seed_no % 12 = 2 then 'Candidate declined the offer after review.'
        else null
    end,
    seed_application_source.draft_saved_at,
    case
        when seed_application_source.application_status = 'SUBMITTED'
            then seed_application_source.draft_saved_at + interval '12 hour'
        else null
    end,
    seed_application_source.candidate_account_id,
    format('Candidate %s highlights measurable delivery, clear execution, and steady communication.', lpad(seed_application_source.seed_no::text, 5, '0')),
    case seed_application_source.seed_no % 4
        when 0 then 'Process improvement'
        when 1 then 'Technical ownership'
        when 2 then 'Stakeholder management'
        else 'Problem framing'
    end,
    1 + (seed_application_source.seed_no % 12),
    case when seed_application_source.application_status = 'DRAFT' then 3 else 6 end,
    case
        when seed_application_source.seed_no % 3 = 0 then 'Strong fit with the role and team expectations.'
        when seed_application_source.seed_no % 3 = 1 then 'Interested in the domain and ownership level of the role.'
        else 'Open to the opportunity because the scope matches recent work.'
    end
from seed_application_source
where current_database() not like '%_test'
on conflict (candidate_account_id, job_posting_id) where candidate_account_id is not null do nothing;

create temporary table seed_application_map on commit drop as
select
    seed_application_source.seed_no,
    application.id as application_id,
    application.candidate_account_id
from seed_application_source
join recruit.application
    on application.candidate_account_id = seed_application_source.candidate_account_id
   and application.job_posting_id = seed_application_source.job_posting_id;

insert into recruit.application_resume_raw (
    application_id,
    payload,
    updated_at
)
select
    application.id,
    jsonb_build_object(
        'currentStep', application.current_step,
        'motivationFit', application.motivation_fit,
        'introduction', application.introduction,
        'coreStrength', application.core_strength,
        'careerYears', application.career_years
    ),
    application.draft_saved_at
from recruit.application
join seed_application_map
    on seed_application_map.application_id = application.id
on conflict (application_id) do nothing;

insert into recruit.application_education (
    application_id,
    school_name,
    major,
    degree,
    graduated_at,
    sort_order
)
select
    seed_application_map.application_id,
    format('Seed University %s', 1 + (seed_application_map.seed_no % 18)),
    case seed_application_map.seed_no % 4
        when 0 then 'Computer Science'
        when 1 then 'Business Administration'
        when 2 then 'Design'
        else 'Industrial Engineering'
    end,
    case seed_application_map.seed_no % 5
        when 0 then 'BACHELOR'
        when 1 then 'MASTER'
        when 2 then 'ASSOCIATE'
        when 3 then 'BACHELOR'
        else 'DOCTORATE'
    end,
    make_date((2016 + (seed_application_map.seed_no % 6))::int, 2, 28),
    0
from seed_application_map;

insert into recruit.application_experience (
    application_id,
    company,
    position,
    start_date,
    end_date,
    description,
    sort_order
)
select
    seed_application_map.application_id,
    format('Seed Company %s', 1 + (seed_application_map.seed_no % 120)),
    case seed_application_map.seed_no % 5
        when 0 then 'Engineer'
        when 1 then 'Analyst'
        when 2 then 'Coordinator'
        when 3 then 'Designer'
        else 'Specialist'
    end,
    make_date((2018 + (seed_application_map.seed_no % 5))::int, 1, 1),
    case when seed_application_map.seed_no % 6 = 0 then null else make_date(2024, 1, 31) end,
    'Seeded experience record that mirrors the candidate profile history.',
    0
from seed_application_map;

insert into recruit.application_skill (
    application_id,
    skill_name,
    proficiency,
    years,
    sort_order
)
select
    seed_application_map.application_id,
    skill.skill_name,
    skill.proficiency,
    skill.years,
    skill.sort_order
from seed_application_map
cross join lateral (
    values
        (
            0,
            case when seed_application_map.seed_no % 2 = 0 then 'Java' else 'TypeScript' end,
            'ADVANCED',
            2 + (seed_application_map.seed_no % 6)
        ),
        (
            1,
            case when seed_application_map.seed_no % 3 = 0 then 'PostgreSQL' else 'React' end,
            'INTERMEDIATE',
            1 + (seed_application_map.seed_no % 4)
        )
) as skill(sort_order, skill_name, proficiency, years);

insert into recruit.application_certification (
    application_id,
    certification_name,
    issuer,
    issued_date,
    expiry_date,
    sort_order
)
select
    seed_application_map.application_id,
    case seed_application_map.seed_no % 4
        when 0 then 'SQL Professional'
        when 1 then 'Cloud Practitioner'
        when 2 then 'UX Fundamentals'
        else 'Project Coordination'
    end,
    'HireFlow Seed Authority',
    make_date((2021 + (seed_application_map.seed_no % 4))::int, 6, 15),
    null,
    0
from seed_application_map;

insert into recruit.application_language (
    application_id,
    language_name,
    proficiency,
    test_name,
    test_score,
    sort_order
)
select
    seed_application_map.application_id,
    case when seed_application_map.seed_no % 3 = 0 then 'English' else 'Korean' end,
    case seed_application_map.seed_no % 4
        when 0 then 'NATIVE'
        when 1 then 'ADVANCED'
        when 2 then 'INTERMEDIATE'
        else 'BUSINESS'
    end,
    case when seed_application_map.seed_no % 3 = 0 then 'TOEIC' else 'TOPIK' end,
    case when seed_application_map.seed_no % 3 = 0 then '915' else '6' end,
    0
from seed_application_map;

insert into recruit.application_answer (
    application_id,
    job_posting_question_id,
    answer_text,
    answer_choice,
    answer_scale,
    created_at,
    updated_at
)
select
    application.id,
    job_posting_question.id,
    case
        when job_posting_question.question_type = 'TEXT'
            then format('Candidate %s wrote a role-specific answer for question %s.', lpad(seed_application_map.seed_no::text, 5, '0'), job_posting_question.sort_order)
        else null
    end,
    case
        when job_posting_question.question_type = 'CHOICE' and seed_application_map.seed_no % 3 = 0 then 'Strong fit'
        when job_posting_question.question_type = 'CHOICE' and seed_application_map.seed_no % 3 = 1 then 'Open to either'
        when job_posting_question.question_type = 'CHOICE' then 'Exploring options'
        else null
    end,
    case
        when job_posting_question.question_type = 'SCALE'
            then 3 + (seed_application_map.seed_no % 3)
        else null
    end,
    application.draft_saved_at,
    application.draft_saved_at
from seed_application_map
join recruit.application
    on application.id = seed_application_map.application_id
join recruit.job_posting_question
    on recruit.job_posting_question.job_posting_id = application.job_posting_id
where application.status = 'SUBMITTED'
on conflict (application_id, job_posting_question_id) do nothing;

insert into recruit.interview (
    application_id,
    job_posting_step_id,
    scheduled_at,
    status,
    note,
    created_at,
    updated_at
)
select
    shortlisted.application_id,
    interview_step.id,
    shortlisted.submitted_at + interval '3 day',
    case when shortlisted.rank_no % 4 = 0 then 'SCHEDULED' else 'COMPLETED' end,
    'Seeded interview schedule for workflow verification.',
    shortlisted.submitted_at + interval '2 day',
    shortlisted.submitted_at + interval '2 day'
from (
    select
        application.id as application_id,
        application.job_posting_id,
        application.submitted_at,
        row_number() over (order by application.id) as rank_no
    from recruit.application
    join seed_application_map
        on seed_application_map.application_id = application.id
    where application.status = 'SUBMITTED'
      and application.review_status in ('IN_REVIEW', 'PASSED')
    order by application.id
    limit 300
) as shortlisted
join lateral (
    select job_posting_step.id
    from recruit.job_posting_step
    where job_posting_step.job_posting_id = shortlisted.job_posting_id
      and job_posting_step.step_type = 'INTERVIEW'
    order by job_posting_step.step_order
    limit 1
) as interview_step on true
on conflict (application_id, job_posting_step_id) do nothing;

insert into recruit.evaluation (
    interview_id,
    evaluator_id,
    score,
    comment,
    result,
    created_at,
    updated_at
)
select
    interview.id,
    seed_admin_map.admin_account_id,
    3 + (ranked.rank_no % 3),
    'Seeded evaluation record used for dashboard and detail-page testing.',
    case when ranked.rank_no % 5 = 0 then 'HOLD' else 'PASS' end,
    interview.created_at + interval '4 hour',
    interview.created_at + interval '4 hour'
from (
    select
        interview.id,
        row_number() over (order by interview.id) as rank_no
    from recruit.interview
    join seed_application_map
        on seed_application_map.application_id = interview.application_id
    order by interview.id
) as ranked
join recruit.interview
    on interview.id = ranked.id
join seed_admin_map
    on seed_admin_map.seed_no = ((ranked.rank_no - 1) % 60) + 1
on conflict (interview_id, evaluator_id) do nothing;

insert into recruit.notification_log (
    application_id,
    type,
    title,
    content,
    sent_by,
    created_at
)
select
    shortlisted.application_id,
    case
        when shortlisted.final_status = 'OFFER_MADE' then 'OFFER'
        when shortlisted.review_status = 'REJECTED' then 'REJECTION'
        else 'INTERVIEW_INVITE'
    end,
    case
        when shortlisted.final_status = 'OFFER_MADE' then 'Offer update'
        when shortlisted.review_status = 'REJECTED' then 'Application update'
        else 'Interview update'
    end,
    case
        when shortlisted.final_status = 'OFFER_MADE' then 'A seeded offer message has been recorded for this application.'
        when shortlisted.review_status = 'REJECTED' then 'A seeded rejection note has been recorded for this application.'
        else 'A seeded interview communication has been recorded for this application.'
    end,
    seed_admin_map.admin_account_id,
    coalesce(shortlisted.final_decided_at, shortlisted.reviewed_at, shortlisted.submitted_at, shortlisted.draft_saved_at)
from (
    select
        application.id as application_id,
        application.review_status,
        application.final_status,
        application.final_decided_at,
        application.reviewed_at,
        application.submitted_at,
        application.draft_saved_at,
        row_number() over (order by application.id) as rank_no
    from recruit.application
    join seed_application_map
        on seed_application_map.application_id = application.id
    where application.status = 'SUBMITTED'
    order by application.id
    limit 500
) as shortlisted
join seed_admin_map
    on seed_admin_map.seed_no = ((shortlisted.rank_no - 1) % 60) + 1;

analyze platform.admin_account;
analyze platform.admin_session;
analyze platform.candidate_account;
analyze platform.candidate_session;
analyze platform.candidate_profile;
analyze platform.candidate_profile_education;
analyze platform.candidate_profile_experience;
analyze platform.candidate_profile_skill;
analyze recruit.job_posting;
analyze recruit.job_posting_question;
analyze recruit.application;
analyze recruit.application_answer;
