update recruit.job_posting
set headline = 'Build the next recruitment platform with a PostgreSQL-first architecture.',
    description = 'You will modernize job posting, application, evaluation, and offer workflows while keeping legacy parity under control.'
where id = 1001;

update recruit.job_posting
set headline = 'Design the hiring experience for applicants and recruiters.',
    description = 'You will shape the application, review, and feedback journey across the recruitment lifecycle.'
where id = 1002;

update recruit.job_posting_step
set title = 'Document Review',
    description = 'Review resumes and core fit for the role.'
where id = 2001;

update recruit.job_posting_step
set title = 'Technical Interview',
    description = 'Assess backend design, delivery ownership, and collaboration.'
where id = 2002;

update recruit.job_posting_step
set title = 'Leadership Interview',
    description = 'Validate cross-functional communication and operating style.'
where id = 2003;

update recruit.job_posting_step
set title = 'Offer Discussion',
    description = 'Align compensation, onboarding, and start date.'
where id = 2004;

update recruit.job_posting_step
set title = 'Portfolio Review',
    description = 'Review design decisions, craft, and problem framing.'
where id = 2005;

update recruit.job_posting_step
set title = 'Culture Interview',
    description = 'Discuss collaboration style and product thinking.'
where id = 2006;
