package com.viberec.api.admin.applicant.service;

import tools.jackson.databind.ObjectMapper;
import com.viberec.api.admin.applicant.domain.AdminApplicantSavedSearch;
import com.viberec.api.admin.applicant.repository.AdminApplicantSavedSearchRepository;
import com.viberec.api.admin.applicant.web.AdminApplicantSavedSearchResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantSortField;
import com.viberec.api.admin.applicant.web.AdminSortDirection;
import com.viberec.api.admin.applicant.web.CreateAdminApplicantSavedSearchRequest;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminApplicantSavedSearchService {

    private static final Set<String> ALLOWED_FILTERS = Set.of(
            "jobPostingId", "applicationStatus", "reviewStatus", "assignedAdminId", "tagId",
            "applicantName", "applicantEmail", "applicantPhone", "query", "sort", "direction"
    );
    private final AdminApplicantSavedSearchRepository repository;
    private final ObjectMapper objectMapper;

    public AdminApplicantSavedSearchService(
            AdminApplicantSavedSearchRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public List<AdminApplicantSavedSearchResponse> getSavedSearches(Long adminAccountId) {
        return repository.findAllByAdminAccountIdOrderByCreatedAtDesc(adminAccountId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminApplicantSavedSearchResponse create(
            Long adminAccountId,
            CreateAdminApplicantSavedSearchRequest request
    ) {
        String name = normalizeName(request.name());
        String normalizedName = name.toLowerCase(Locale.ROOT);
        Map<String, String> filters = validateFilters(request.filters());
        int created = repository.createIfAbsent(
                adminAccountId,
                name,
                normalizedName,
                serialize(filters)
        );
        if (created == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A saved search with this name already exists.");
        }
        return repository.findAllByAdminAccountIdOrderByCreatedAtDesc(adminAccountId).stream()
                .filter(savedSearch -> savedSearch.getName().equals(name))
                .findFirst()
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalStateException("Saved search was not created."));
    }

    @Transactional
    public void delete(Long adminAccountId, Long savedSearchId) {
        if (repository.deleteOwned(savedSearchId, adminAccountId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found.");
        }
    }

    private Map<String, String> validateFilters(Map<String, String> supplied) {
        Map<String, String> filters = new LinkedHashMap<>();
        supplied.forEach((key, rawValue) -> {
            if (!ALLOWED_FILTERS.contains(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported saved-search filter: " + key);
            }
            String value = rawValue == null ? "" : rawValue.trim();
            if (value.isEmpty()) return;
            switch (key) {
                case "jobPostingId", "assignedAdminId", "tagId" -> validatePositiveLong(value, key);
                case "applicationStatus" -> parseEnum(ApplicationStatus.class, value, key);
                case "reviewStatus" -> parseEnum(ApplicationReviewStatus.class, value, key);
                case "sort" -> parseEnum(AdminApplicantSortField.class, value, key);
                case "direction" -> parseEnum(AdminSortDirection.class, value, key);
                default -> {
                    if (value.length() > 200) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saved-search filter is too long: " + key);
                    }
                }
            }
            filters.put(key, value);
        });
        return Map.copyOf(filters);
    }

    private void validatePositiveLong(String value, String key) {
        try {
            if (Long.parseLong(value) <= 0) throw new NumberFormatException();
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid saved-search filter: " + key);
        }
    }

    private <T extends Enum<T>> void parseEnum(Class<T> type, String value, String key) {
        try {
            Enum.valueOf(type, value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid saved-search filter: " + key);
        }
    }

    private String normalizeName(String value) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saved-search name is required.");
        }
        return normalized;
    }

    private String serialize(Map<String, String> filters) {
        try {
            return objectMapper.writeValueAsString(filters);
        } catch (tools.jackson.core.JacksonException exception) {
            throw new IllegalStateException("Saved-search filters could not be serialized.", exception);
        }
    }

    private AdminApplicantSavedSearchResponse toResponse(AdminApplicantSavedSearch savedSearch) {
        return new AdminApplicantSavedSearchResponse(
                savedSearch.getId(),
                savedSearch.getName(),
                savedSearch.getFilters(),
                savedSearch.getCreatedAt()
        );
    }
}
