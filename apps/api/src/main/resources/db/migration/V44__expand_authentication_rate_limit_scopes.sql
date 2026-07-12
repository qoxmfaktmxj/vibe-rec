alter table platform.authentication_rate_limit
    drop constraint authentication_rate_limit_scope_ck;

alter table platform.authentication_rate_limit
    add constraint authentication_rate_limit_scope_ck check (scope in (
        'ADMIN_LOGIN',
        'CANDIDATE_LOGIN',
        'AUTH_LOGIN_NETWORK',
        'CANDIDATE_SIGNUP_NETWORK',
        'CANDIDATE_PASSWORD_RESET',
        'CANDIDATE_PASSWORD_RESET_NETWORK',
        'CANDIDATE_EMAIL_VERIFICATION'
    ));
