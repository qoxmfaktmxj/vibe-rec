package com.viberec.api.recruitment.application.web;

import java.time.LocalDate;

public record ResumeCertificationDto(
        Long id,
        String certificationName,
        String issuer,
        LocalDate issuedDate,
        LocalDate expiryDate,
        int sortOrder
) {
}
