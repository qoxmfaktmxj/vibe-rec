package com.viberec.api.recruitment.jobposting.web;

public record JobPostingQuestionResponse(
        Long id,
        String questionText,
        String questionType,
        String choices,
        boolean required,
        int sortOrder
) {}
