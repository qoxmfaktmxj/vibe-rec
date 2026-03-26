package com.viberec.api.candidate.profile.web;

import java.time.LocalDate;

public record ProfileCertificationDto(
        Long id,
        String certificationName,
        String issuer,
        LocalDate issuedDate,
        LocalDate expiryDate,
        int sortOrder
) {}
