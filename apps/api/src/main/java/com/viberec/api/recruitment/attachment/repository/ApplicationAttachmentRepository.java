package com.viberec.api.recruitment.attachment.repository;

import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationAttachmentRepository extends JpaRepository<ApplicationAttachment, Long> {

    List<ApplicationAttachment> findByApplicationId(Long applicationId);

    List<ApplicationAttachment> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);

    long countByApplicationId(Long applicationId);
}
