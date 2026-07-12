package com.viberec.api.candidate.auth.web;

import jakarta.validation.constraints.NotBlank;

public record CandidateEmailVerificationConfirmRequest(@NotBlank String token) {
}
