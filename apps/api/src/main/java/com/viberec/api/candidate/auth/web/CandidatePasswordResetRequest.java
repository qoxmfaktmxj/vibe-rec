package com.viberec.api.candidate.auth.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidatePasswordResetRequest(
        @NotBlank @Email @Size(max = 160) String email
) {
}
