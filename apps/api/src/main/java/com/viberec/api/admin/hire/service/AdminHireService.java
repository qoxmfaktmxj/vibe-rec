package com.viberec.api.admin.hire.service;

import com.viberec.api.admin.hire.web.CreateHireDecisionRequest;
import com.viberec.api.admin.hire.web.HireDecisionResponse;
import com.viberec.api.admin.hire.web.NotificationLogResponse;
import com.viberec.api.admin.hire.web.NotificationPreviewResponse;
import com.viberec.api.admin.hire.web.NotificationTemplateResponse;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.hire.domain.HireDecision;
import com.viberec.api.recruitment.hire.repository.HireDecisionRepository;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.domain.NotificationTemplate;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.recruitment.notification.repository.NotificationTemplateRepository;
import com.viberec.api.recruitment.notification.service.NotificationRenderer;
import com.viberec.api.recruitment.notification.service.NotificationSender;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminHireService {

    private final ApplicationRepository applicationRepository;
    private final HireDecisionRepository hireDecisionRepository;
    private final NotificationTemplateRepository notificationTemplateRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final NotificationRenderer notificationRenderer;
    private final NotificationSender notificationSender;

    public AdminHireService(
            ApplicationRepository applicationRepository,
            HireDecisionRepository hireDecisionRepository,
            NotificationTemplateRepository notificationTemplateRepository,
            NotificationLogRepository notificationLogRepository,
            NotificationRenderer notificationRenderer,
            NotificationSender notificationSender
    ) {
        this.applicationRepository = applicationRepository;
        this.hireDecisionRepository = hireDecisionRepository;
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.notificationRenderer = notificationRenderer;
        this.notificationSender = notificationSender;
    }

    // ---- Hire Decision ----

    @Transactional
    public HireDecisionResponse createDecision(Long applicationId, CreateHireDecisionRequest request) {
        Application application = loadApplication(applicationId);

        if (hireDecisionRepository.existsByApplicationId(applicationId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A hire decision has already been made for this application.");
        }

        HireDecision decision = new HireDecision(
                application,
                request.decision(),
                request.salaryInfo(),
                request.startDate(),
                request.note()
        );
        hireDecisionRepository.save(decision);
        return toDecisionResponse(decision);
    }

    public Optional<HireDecisionResponse> getDecision(Long applicationId) {
        return hireDecisionRepository.findByApplicationId(applicationId)
                .map(this::toDecisionResponse);
    }

    // ---- Notification Templates ----

    public List<NotificationTemplateResponse> getTemplates() {
        return notificationTemplateRepository.findAll().stream()
                .map(this::toTemplateResponse)
                .toList();
    }

    // ---- Notification Preview ----

    public NotificationPreviewResponse previewNotification(Long applicationId, Long templateId) {
        Application application = loadApplication(applicationId);
        NotificationTemplate template = loadTemplate(templateId);

        Map<String, String> variables = buildVariables(application);
        String renderedSubject = notificationRenderer.render(template.getTitle(), variables);
        String renderedBody = notificationRenderer.render(template.getBodyTemplate(), variables);

        return new NotificationPreviewResponse(
                template.getId(),
                template.getTemplateKey(),
                template.getChannel(),
                application.getApplicantEmail(),
                renderedSubject,
                renderedBody
        );
    }

    // ---- Send Notification ----

    @Transactional
    public NotificationLogResponse sendNotification(Long applicationId, Long templateId) {
        Application application = loadApplication(applicationId);
        NotificationTemplate template = loadTemplate(templateId);

        Map<String, String> variables = buildVariables(application);
        String renderedSubject = notificationRenderer.render(template.getTitle(), variables);
        String renderedBody = notificationRenderer.render(template.getBodyTemplate(), variables);

        NotificationLog logEntry = new NotificationLog(
                application,
                template,
                template.getChannel(),
                application.getApplicantEmail(),
                renderedSubject,
                renderedBody
        );
        notificationLogRepository.save(logEntry);

        try {
            notificationSender.send(logEntry);
        } catch (Exception e) {
            logEntry.markFailed();
        }

        return toLogResponse(logEntry);
    }

    // ---- Notification History ----

    public List<NotificationLogResponse> getNotificationHistory(Long applicationId) {
        return notificationLogRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).stream()
                .map(this::toLogResponse)
                .toList();
    }

    // ---- Private helpers ----

    private Application loadApplication(Long applicationId) {
        return applicationRepository.findWithJobPostingById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant not found."));
    }

    private NotificationTemplate loadTemplate(Long templateId) {
        return notificationTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification template not found."));
    }

    private Map<String, String> buildVariables(Application application) {
        Map<String, String> vars = new HashMap<>();
        vars.put("applicantName", application.getApplicantName());
        vars.put("applicantEmail", application.getApplicantEmail());
        vars.put("jobPostingTitle", application.getJobPosting().getTitle());

        HireDecision decision = hireDecisionRepository.findByApplicationId(application.getId()).orElse(null);
        if (decision != null) {
            vars.put("salaryInfo", decision.getSalaryInfo());
            vars.put("startDate", decision.getStartDate() != null
                    ? decision.getStartDate().format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일"))
                    : null);
        }
        return vars;
    }

    private HireDecisionResponse toDecisionResponse(HireDecision d) {
        return new HireDecisionResponse(
                d.getId(),
                d.getApplication().getId(),
                d.getDecision(),
                d.getSalaryInfo(),
                d.getStartDate(),
                d.getNote(),
                d.getDecidedAt()
        );
    }

    private NotificationTemplateResponse toTemplateResponse(NotificationTemplate t) {
        return new NotificationTemplateResponse(
                t.getId(),
                t.getTemplateKey(),
                t.getTitle(),
                t.getBodyTemplate(),
                t.getChannel()
        );
    }

    private NotificationLogResponse toLogResponse(NotificationLog l) {
        return new NotificationLogResponse(
                l.getId(),
                l.getApplication().getId(),
                l.getTemplate() != null ? l.getTemplate().getTemplateKey() : null,
                l.getChannel(),
                l.getRecipient(),
                l.getSubject(),
                l.getBody(),
                l.getStatus(),
                l.getSentAt(),
                l.getCreatedAt()
        );
    }
}
