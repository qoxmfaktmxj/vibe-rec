package com.viberec.api.recruitment.jobposting.web;

public record SaveJobPostingQuestionRequest(
        String questionText,
        String questionType,
        String choices,
        boolean required,
        int sortOrder
) {}
