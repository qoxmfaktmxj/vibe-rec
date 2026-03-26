package com.viberec.api.recruitment.application.web;

public record ApplicationAnswerDto(
        Long questionId,
        String answerText,
        String answerChoice,
        Short answerScale
) {}
