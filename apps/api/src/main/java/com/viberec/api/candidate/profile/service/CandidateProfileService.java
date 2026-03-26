package com.viberec.api.candidate.profile.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.profile.domain.CandidateProfile;
import com.viberec.api.candidate.profile.domain.CandidateProfileCertification;
import com.viberec.api.candidate.profile.domain.CandidateProfileEducation;
import com.viberec.api.candidate.profile.domain.CandidateProfileExperience;
import com.viberec.api.candidate.profile.domain.CandidateProfileLanguage;
import com.viberec.api.candidate.profile.domain.CandidateProfileSkill;
import com.viberec.api.candidate.profile.repository.CandidateProfileCertificationRepository;
import com.viberec.api.candidate.profile.repository.CandidateProfileEducationRepository;
import com.viberec.api.candidate.profile.repository.CandidateProfileExperienceRepository;
import com.viberec.api.candidate.profile.repository.CandidateProfileLanguageRepository;
import com.viberec.api.candidate.profile.repository.CandidateProfileRepository;
import com.viberec.api.candidate.profile.repository.CandidateProfileSkillRepository;
import com.viberec.api.candidate.profile.web.CandidateProfileResponse;
import com.viberec.api.candidate.profile.web.ProfileCertificationDto;
import com.viberec.api.candidate.profile.web.ProfileEducationDto;
import com.viberec.api.candidate.profile.web.ProfileExperienceDto;
import com.viberec.api.candidate.profile.web.ProfileLanguageDto;
import com.viberec.api.candidate.profile.web.ProfileSkillDto;
import com.viberec.api.candidate.profile.web.SaveCandidateProfileRequest;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CandidateProfileService {

    private final CandidateProfileRepository profileRepository;
    private final CandidateProfileEducationRepository educationRepository;
    private final CandidateProfileExperienceRepository experienceRepository;
    private final CandidateProfileSkillRepository skillRepository;
    private final CandidateProfileCertificationRepository certificationRepository;
    private final CandidateProfileLanguageRepository languageRepository;

    public CandidateProfileService(
            CandidateProfileRepository profileRepository,
            CandidateProfileEducationRepository educationRepository,
            CandidateProfileExperienceRepository experienceRepository,
            CandidateProfileSkillRepository skillRepository,
            CandidateProfileCertificationRepository certificationRepository,
            CandidateProfileLanguageRepository languageRepository
    ) {
        this.profileRepository = profileRepository;
        this.educationRepository = educationRepository;
        this.experienceRepository = experienceRepository;
        this.skillRepository = skillRepository;
        this.certificationRepository = certificationRepository;
        this.languageRepository = languageRepository;
    }

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(CandidateAccount account) {
        CandidateProfile profile = profileRepository.findByCandidateAccountId(account.getId()).orElse(null);
        Long accountId = account.getId();

        List<ProfileEducationDto> educations = educationRepository
                .findByCandidateAccountIdOrderBySortOrder(accountId).stream()
                .map(e -> new ProfileEducationDto(e.getId(), e.getInstitution(), e.getDegree(),
                        e.getFieldOfStudy(), e.getStartDate(), e.getEndDate(), e.getDescription(), e.getSortOrder()))
                .toList();

        List<ProfileExperienceDto> experiences = experienceRepository
                .findByCandidateAccountIdOrderBySortOrder(accountId).stream()
                .map(e -> new ProfileExperienceDto(e.getId(), e.getCompany(), e.getPosition(),
                        e.getStartDate(), e.getEndDate(), e.getDescription(), e.getSortOrder()))
                .toList();

        List<ProfileSkillDto> skills = skillRepository
                .findByCandidateAccountIdOrderBySortOrder(accountId).stream()
                .map(e -> new ProfileSkillDto(e.getId(), e.getSkillName(), e.getProficiency(),
                        e.getYears(), e.getSortOrder()))
                .toList();

        List<ProfileCertificationDto> certifications = certificationRepository
                .findByCandidateAccountIdOrderBySortOrder(accountId).stream()
                .map(e -> new ProfileCertificationDto(e.getId(), e.getCertificationName(), e.getIssuer(),
                        e.getIssuedDate(), e.getExpiryDate(), e.getSortOrder()))
                .toList();

        List<ProfileLanguageDto> languages = languageRepository
                .findByCandidateAccountIdOrderBySortOrder(accountId).stream()
                .map(e -> new ProfileLanguageDto(e.getId(), e.getLanguageName(), e.getProficiency(),
                        e.getTestName(), e.getTestScore(), e.getSortOrder()))
                .toList();

        return new CandidateProfileResponse(
                profile != null ? profile.getIntroductionTemplate() : null,
                profile != null ? profile.getCoreStrengthTemplate() : null,
                profile != null ? profile.getCareerYears() : null,
                educations,
                experiences,
                skills,
                certifications,
                languages
        );
    }

    @Transactional
    public void saveProfile(CandidateAccount account, SaveCandidateProfileRequest request) {
        Long accountId = account.getId();

        CandidateProfile profile = profileRepository.findByCandidateAccountId(accountId)
                .orElseGet(() -> new CandidateProfile(account));
        profile.update(request.introductionTemplate(), request.coreStrengthTemplate(), request.careerYears());
        profileRepository.save(profile);

        if (request.educations() != null) {
            educationRepository.deleteByCandidateAccountId(accountId);
            educationRepository.saveAll(request.educations().stream()
                    .map(dto -> new CandidateProfileEducation(accountId, dto.institution(), dto.degree(),
                            dto.fieldOfStudy(), dto.startDate(), dto.endDate(), dto.description(), dto.sortOrder()))
                    .toList());
        }

        if (request.experiences() != null) {
            experienceRepository.deleteByCandidateAccountId(accountId);
            experienceRepository.saveAll(request.experiences().stream()
                    .map(dto -> new CandidateProfileExperience(accountId, dto.company(), dto.position(),
                            dto.startDate(), dto.endDate(), dto.description(), dto.sortOrder()))
                    .toList());
        }

        if (request.skills() != null) {
            skillRepository.deleteByCandidateAccountId(accountId);
            skillRepository.saveAll(request.skills().stream()
                    .map(dto -> new CandidateProfileSkill(accountId, dto.skillName(), dto.proficiency(),
                            dto.years(), dto.sortOrder()))
                    .toList());
        }

        if (request.certifications() != null) {
            certificationRepository.deleteByCandidateAccountId(accountId);
            certificationRepository.saveAll(request.certifications().stream()
                    .map(dto -> new CandidateProfileCertification(accountId, dto.certificationName(),
                            dto.issuer(), dto.issuedDate(), dto.expiryDate(), dto.sortOrder()))
                    .toList());
        }

        if (request.languages() != null) {
            languageRepository.deleteByCandidateAccountId(accountId);
            languageRepository.saveAll(request.languages().stream()
                    .map(dto -> new CandidateProfileLanguage(accountId, dto.languageName(),
                            dto.proficiency(), dto.testName(), dto.testScore(), dto.sortOrder()))
                    .toList());
        }
    }
}
