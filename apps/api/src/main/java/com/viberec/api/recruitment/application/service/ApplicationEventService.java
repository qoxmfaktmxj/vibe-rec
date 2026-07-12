package com.viberec.api.recruitment.application.service;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationEvent;
import com.viberec.api.recruitment.application.repository.ApplicationEventRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.web.ApplicationEventResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ApplicationEventService {

    private final ApplicationEventRepository eventRepository;
    private final ApplicationRepository applicationRepository;

    public ApplicationEventService(
            ApplicationEventRepository eventRepository,
            ApplicationRepository applicationRepository
    ) {
        this.eventRepository = eventRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional
    public void record(
            Application application,
            String eventType,
            String fromState,
            String toState,
            String actorType,
            Long actorId,
            String reason,
            String metadata
    ) {
        eventRepository.save(new ApplicationEvent(
                application,
                eventType,
                fromState,
                toState,
                actorType,
                actorId,
                reason,
                metadata
        ));
    }

    public List<ApplicationEventResponse> getEvents(Long applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found.");
        }
        return eventRepository.findByApplicationIdOrderByCreatedAtDescIdDesc(applicationId).stream()
                .map(event -> new ApplicationEventResponse(
                        event.getId(),
                        event.getApplication().getId(),
                        event.getEventType(),
                        event.getFromState(),
                        event.getToState(),
                        event.getActorType(),
                        event.getActorId(),
                        event.getReason(),
                        event.getMetadata(),
                        event.getCreatedAt()
                ))
                .toList();
    }
}
