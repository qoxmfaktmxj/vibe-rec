-- V8: 지원서 정규화 테이블 (학력, 경력, 스킬, 자격증, 어학)
-- 기존 application_resume_raw (JSONB) 는 원본 보존용으로 유지

-- 학력
CREATE TABLE recruit.application_education (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  bigint NOT NULL REFERENCES recruit.application(id) ON DELETE CASCADE,
    institution     varchar(200) NOT NULL,
    degree          varchar(100),           -- 학사, 석사, 박사, 고졸 등
    field_of_study  varchar(200),           -- 전공
    start_date      date,
    end_date        date,                   -- NULL = 재학 중
    description     text,
    sort_order      int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_education_app_id ON recruit.application_education(application_id);

-- 경력
CREATE TABLE recruit.application_experience (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  bigint NOT NULL REFERENCES recruit.application(id) ON DELETE CASCADE,
    company         varchar(200) NOT NULL,
    position        varchar(200),           -- 직책/직급
    start_date      date,
    end_date        date,                   -- NULL = 재직 중
    description     text,
    sort_order      int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_experience_app_id ON recruit.application_experience(application_id);

-- 스킬
CREATE TABLE recruit.application_skill (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  bigint NOT NULL REFERENCES recruit.application(id) ON DELETE CASCADE,
    skill_name      varchar(100) NOT NULL,
    proficiency     varchar(30),            -- BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    years           int,
    sort_order      int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_skill_app_id ON recruit.application_skill(application_id);

-- 자격증
CREATE TABLE recruit.application_certification (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id      bigint NOT NULL REFERENCES recruit.application(id) ON DELETE CASCADE,
    certification_name  varchar(200) NOT NULL,
    issuer              varchar(200),       -- 발급 기관
    issued_date         date,
    expiry_date         date,               -- NULL = 무기한
    sort_order          int NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_cert_app_id ON recruit.application_certification(application_id);

-- 어학
CREATE TABLE recruit.application_language (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  bigint NOT NULL REFERENCES recruit.application(id) ON DELETE CASCADE,
    language_name   varchar(60) NOT NULL,   -- 영어, 일본어, 중국어 등
    proficiency     varchar(30),            -- BASIC, CONVERSATIONAL, FLUENT, NATIVE
    test_name       varchar(100),           -- TOEIC, TOEFL, JLPT 등
    test_score      varchar(40),            -- 점수/등급
    sort_order      int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_lang_app_id ON recruit.application_language(application_id);
