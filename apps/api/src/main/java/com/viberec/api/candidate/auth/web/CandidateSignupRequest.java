package com.viberec.api.candidate.auth.web;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CandidateSignupRequest(
        @JsonProperty("name")
        @JsonAlias("displayName")
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 160) String email,
        @JsonProperty("phone")
        @JsonAlias("phoneNumber")
        @NotBlank @Pattern(regexp = "^[0-9+\\-() ]{8,40}$") String phone,
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
