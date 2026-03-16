package com.viberec.api.recruitment.application.service;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationCertification;
import com.viberec.api.recruitment.application.domain.ApplicationEducation;
import com.viberec.api.recruitment.application.domain.ApplicationExperience;
import com.viberec.api.recruitment.application.domain.ApplicationLanguage;
import com.viberec.api.recruitment.application.domain.ApplicationSkill;
import com.viberec.api.recruitment.application.repository.ApplicationCertificationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationEducationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationExperienceRepository;
import com.viberec.api.recruitment.application.repository.ApplicationLanguageRepository;
import com.viberec.api.recruitment.application.repository.ApplicationSkillRepository;
import com.viberec.api.recruitment.application.web.ResumeCertificationDto;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.ResumeLanguageDto;
import com.viberec.api.recruitment.application.web.ResumeSkillDto;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResumeNormalizationService {

    private final ApplicationEducationRepository educationRepository;
    private final ApplicationExperienceRepository experienceRepository;
    private final ApplicationSkillRepository skillRepository;
    private final ApplicationCertificationRepository certificationRepository;
    private final ApplicationLanguageRepository languageRepository;

    public ResumeNormalizationService(
            ApplicationEducationRepository educationRepository,
            ApplicationExperienceRepository experienceRepository,
            ApplicationSkillRepository skillRepository,
            ApplicationCertificationRepository certificationRepository,
            ApplicationLanguageRepository languageRepository
    ) {
        this.educationRepository = educationRepository;
        this.experienceRepository = experienceRepository;
        this.skillRepository = skillRepository;
        this.certificationRepository = certificationRepository;
        this.languageRepository = languageRepository;
    }

    @Transactional
    public void saveNormalizedResume(
            Application application,
            List<ResumeEducationDto> educations,
            List<ResumeExperienceDto> experiences,
            List<ResumeSkillDto> skills,
            List<ResumeCertificationDto> certifications,
            List<ResumeLanguageDto> languages
    ) {
        Long applicationId = application.getId();

        if (educations != null) {
            educationRepository.deleteByApplicationId(applicationId);
            educationRepository.saveAll(educations.stream()
                    .map(dto -> new ApplicationEducation(
                            application, dto.institution(), dto.degree(), dto.fieldOfStudy(),
                            dto.startDate(), dto.endDate(), dto.description(), dto.sortOrder()))
                    .toList());
        }

        if (experiences != null) {
            experienceRepository.deleteByApplicationId(applicationId);
            experienceRepository.saveAll(experiences.stream()
                    .map(dto -> new ApplicationExperience(
                            application, dto.company(), dto.position(),
                            dto.startDate(), dto.endDate(), dto.description(), dto.sortOrder()))
                    .toList());
        }

        if (skills != null) {
            skillRepository.deleteByApplicationId(applicationId);
            skillRepository.saveAll(skills.stream()
                    .map(dto -> new ApplicationSkill(
                            application, dto.skillName(), dto.proficiency(), dto.years(), dto.sortOrder()))
                    .toList());
        }

        if (certifications != null) {
            certificationRepository.deleteByApplicationId(applicationId);
            certificationRepository.saveAll(certifications.stream()
                    .map(dto -> new ApplicationCertification(
                            application, dto.certificationName(), dto.issuer(),
                            dto.issuedDate(), dto.expiryDate(), dto.sortOrder()))
                    .toList());
        }

        if (languages != null) {
            languageRepository.deleteByApplicationId(applicationId);
            languageRepository.saveAll(languages.stream()
                    .map(dto -> new ApplicationLanguage(
                            application, dto.languageName(), dto.proficiency(),
                            dto.testName(), dto.testScore(), dto.sortOrder()))
                    .toList());
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeEducationDto> getEducations(Long applicationId) {
        return educationRepository.findByApplicationIdOrderBySortOrder(applicationId).stream()
                .map(e -> new ResumeEducationDto(e.getId(), e.getInstitution(), e.getDegree(),
                        e.getFieldOfStudy(), e.getStartDate(), e.getEndDate(),
                        e.getDescription(), e.getSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResumeExperienceDto> getExperiences(Long applicationId) {
        return experienceRepository.findByApplicationIdOrderBySortOrder(applicationId).stream()
                .map(e -> new ResumeExperienceDto(e.getId(), e.getCompany(), e.getPosition(),
                        e.getStartDate(), e.getEndDate(), e.getDescription(), e.getSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResumeSkillDto> getSkills(Long applicationId) {
        return skillRepository.findByApplicationIdOrderBySortOrder(applicationId).stream()
                .map(e -> new ResumeSkillDto(e.getId(), e.getSkillName(), e.getProficiency(),
                        e.getYears(), e.getSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResumeCertificationDto> getCertifications(Long applicationId) {
        return certificationRepository.findByApplicationIdOrderBySortOrder(applicationId).stream()
                .map(e -> new ResumeCertificationDto(e.getId(), e.getCertificationName(), e.getIssuer(),
                        e.getIssuedDate(), e.getExpiryDate(), e.getSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResumeLanguageDto> getLanguages(Long applicationId) {
        return languageRepository.findByApplicationIdOrderBySortOrder(applicationId).stream()
                .map(e -> new ResumeLanguageDto(e.getId(), e.getLanguageName(), e.getProficiency(),
                        e.getTestName(), e.getTestScore(), e.getSortOrder()))
                .toList();
    }
}
