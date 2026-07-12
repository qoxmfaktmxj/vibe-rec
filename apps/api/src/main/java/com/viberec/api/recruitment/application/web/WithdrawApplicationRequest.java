package com.viberec.api.recruitment.application.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WithdrawApplicationRequest(
        @NotBlank @Size(max = 1000) String reason
) {
}
