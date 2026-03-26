package com.viberec.api.admin.jobposting.service;

import com.viberec.api.admin.jobposting.web.AdminJobPostingResponse;
import com.viberec.api.admin.jobposting.web.AdminJobPostingUpsertRequest;
import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import java.time.OffsetDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminJobPostingService {

    private final JobPostingRepository jobPostingRepository;

    public AdminJobPostingService(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    public AdminJobPostingResponse getJobPosting(Long id) {
        return jobPostingRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
    }

    public java.util.List<AdminJobPostingResponse> getJobPostings() {
        return jobPostingRepository.findAllByOrderByOpensAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminJobPostingResponse createJobPosting(AdminJobPostingUpsertRequest request) {
        validateRequest(request, null);

        JobPosting jobPosting = new JobPosting(
                request.legacyAnnoId(),
                request.publicKey().trim(),
                request.title().trim(),
                request.headline().trim(),
                request.description().trim(),
                request.employmentType().trim(),
                request.recruitmentCategory(),
                request.recruitmentMode(),
                request.location().trim(),
                request.status(),
                request.published(),
                request.opensAt(),
                normalizeClosesAt(request)
        );

        return toResponse(jobPostingRepository.save(jobPosting));
    }

    @Transactional
    public AdminJobPostingResponse updateJobPosting(Long id, AdminJobPostingUpsertRequest request) {
        validateRequest(request, id);

        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        jobPosting.updatePosting(
                request.legacyAnnoId(),
                request.publicKey().trim(),
                request.title().trim(),
                request.headline().trim(),
                request.description().trim(),
                request.employmentType().trim(),
                request.recruitmentCategory(),
                request.recruitmentMode(),
                request.location().trim(),
                request.status(),
                request.published(),
                request.opensAt(),
                normalizeClosesAt(request)
        );

        return toResponse(jobPosting);
    }

    private void validateRequest(AdminJobPostingUpsertRequest request, Long existingId) {
        String publicKey = trimRequired(request.publicKey(), "Public key is required.");
        trimRequired(request.title(), "Title is required.");
        trimRequired(request.headline(), "Headline is required.");
        trimRequired(request.description(), "Description is required.");
        trimRequired(request.employmentType(), "Employment type is required.");
        trimRequired(request.location(), "Location is required.");

        if (request.opensAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open date is required.");
        }
        if (request.recruitmentCategory() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recruitment category is required.");
        }
        if (request.recruitmentMode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recruitment mode is required.");
        }
        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }

        if (existingId == null) {
            if (jobPostingRepository.existsByPublicKey(publicKey)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Public key already exists.");
            }
        } else if (jobPostingRepository.existsByPublicKeyAndIdNot(publicKey, existingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Public key already exists.");
        }

        OffsetDateTime closesAt = request.closesAt();
        if (request.recruitmentMode() == RecruitmentMode.ROLLING) {
            if (closesAt != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rolling recruitment must not have closesAt.");
            }
            return;
        }

        if (closesAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fixed-term recruitment requires closesAt.");
        }

        if (!closesAt.isAfter(request.opensAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closesAt must be after opensAt.");
        }
    }

    private String trimRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private OffsetDateTime normalizeClosesAt(AdminJobPostingUpsertRequest request) {
        return request.recruitmentMode() == RecruitmentMode.ROLLING ? null : request.closesAt();
    }

    private AdminJobPostingResponse toResponse(JobPosting jobPosting) {
        return new AdminJobPostingResponse(
                jobPosting.getId(),
                jobPosting.getLegacyAnnoId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getDescription(),
                jobPosting.getEmploymentType(),
                jobPosting.getRecruitmentCategory(),
                jobPosting.getRecruitmentMode(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.isPublished(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt()
        );
    }
}
