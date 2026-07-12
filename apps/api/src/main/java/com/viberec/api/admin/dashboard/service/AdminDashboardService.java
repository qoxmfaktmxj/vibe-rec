package com.viberec.api.admin.dashboard.service;

import com.viberec.api.admin.dashboard.web.AdminDashboardResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final int reviewSlaHours;
    private final ZoneId businessZone;

    public AdminDashboardService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.recruitment.review-sla-hours:72}") int reviewSlaHours,
            @Value("${app.time-zone:Asia/Seoul}") String businessTimeZone
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.reviewSlaHours = reviewSlaHours;
        this.businessZone = ZoneId.of(businessTimeZone);
    }

    public AdminDashboardResponse getDashboard() {
        OffsetDateTime now = OffsetDateTime.now(businessZone);
        OffsetDateTime todayStart = now.toLocalDate().atStartOfDay(businessZone).toOffsetDateTime();
        OffsetDateTime tomorrowStart = todayStart.plusDays(1);
        OffsetDateTime sevenDaysAgo = todayStart.minusDays(6);
        OffsetDateTime upcomingEnd = now.plusDays(7);
        OffsetDateTime reviewSlaCutoff = now.minusHours(reviewSlaHours);

        return jdbcTemplate.queryForObject(
                """
                select
                    (select count(*) from recruit.application) as application_total,
                    (select count(*) from recruit.application where status = 'DRAFT') as application_drafts,
                    (select count(*) from recruit.application where status = 'SUBMITTED') as application_submitted,
                    (select count(*) from recruit.application where status = 'WITHDRAWN') as application_withdrawn,
                    (select count(*) from recruit.application where submitted_at >= ? and submitted_at < ?) as submitted_today,
                    (select count(*) from recruit.application where submitted_at >= ? and submitted_at < ?) as submitted_last_seven_days,
                    (select count(*) from recruit.application where status = 'SUBMITTED' and review_status = 'NEW') as review_new,
                    (select count(*) from recruit.application where status = 'SUBMITTED' and review_status = 'IN_REVIEW') as review_in_progress,
                    (select count(*) from recruit.application where status = 'SUBMITTED' and review_status = 'PASSED') as review_passed,
                    (select count(*) from recruit.application where status = 'SUBMITTED' and review_status = 'REJECTED') as review_rejected,
                    (select count(*) from recruit.application where status = 'SUBMITTED' and assigned_admin_id is null) as review_unassigned,
                    (select count(*) from recruit.application
                     where status = 'SUBMITTED'
                       and review_status in ('NEW', 'IN_REVIEW')
                       and coalesce(reviewed_at, submitted_at) < ?) as review_overdue,
                    (select count(*) from recruit.application
                     where status = 'SUBMITTED' and review_status = 'PASSED' and final_status is null) as decision_pending,
                    (select count(*) from recruit.interview
                     where status = 'SCHEDULED' and scheduled_at >= ? and scheduled_at < ?) as interviews_today,
                    (select count(*) from recruit.interview
                     where status = 'SCHEDULED' and scheduled_at >= ? and scheduled_at < ?) as interviews_upcoming,
                    (select count(*) from recruit.interview interview
                     where interview.status = 'COMPLETED'
                       and not exists (select 1 from recruit.evaluation evaluation where evaluation.interview_id = interview.id)) as evaluations_pending,
                    (select count(*) from recruit.notification_log where delivery_status = 'PENDING') as notifications_pending,
                    (select count(*) from recruit.notification_log where delivery_status = 'FAILED' and delivery_attempts < 5) as notifications_retrying,
                    (select count(*) from recruit.notification_log where delivery_status = 'FAILED' and delivery_attempts >= 5) as notifications_exhausted,
                    (select count(*) from recruit.job_posting) as job_posting_total,
                    (select count(*) from recruit.job_posting where status = 'OPEN') as job_posting_open,
                    (select count(*) from recruit.job_posting where published = true) as job_posting_published,
                    (select count(*) from recruit.job_posting where recruitment_mode = 'ROLLING') as job_posting_rolling
                """,
                this::mapDashboard,
                todayStart,
                tomorrowStart,
                sevenDaysAgo,
                tomorrowStart,
                reviewSlaCutoff,
                todayStart,
                tomorrowStart,
                now,
                upcomingEnd
        );
    }

    private AdminDashboardResponse mapDashboard(ResultSet row, int rowNumber) throws SQLException {
        return new AdminDashboardResponse(
                OffsetDateTime.now(businessZone),
                reviewSlaHours,
                new AdminDashboardResponse.ApplicationMetrics(
                        row.getLong("application_total"),
                        row.getLong("application_drafts"),
                        row.getLong("application_submitted"),
                        row.getLong("application_withdrawn"),
                        row.getLong("submitted_today"),
                        row.getLong("submitted_last_seven_days")
                ),
                new AdminDashboardResponse.ReviewQueueMetrics(
                        row.getLong("review_new"),
                        row.getLong("review_in_progress"),
                        row.getLong("review_passed"),
                        row.getLong("review_rejected"),
                        row.getLong("review_unassigned"),
                        row.getLong("review_overdue"),
                        row.getLong("decision_pending")
                ),
                new AdminDashboardResponse.InterviewMetrics(
                        row.getLong("interviews_today"),
                        row.getLong("interviews_upcoming"),
                        row.getLong("evaluations_pending")
                ),
                new AdminDashboardResponse.NotificationMetrics(
                        row.getLong("notifications_pending"),
                        row.getLong("notifications_retrying"),
                        row.getLong("notifications_exhausted")
                ),
                new AdminDashboardResponse.JobPostingMetrics(
                        row.getLong("job_posting_total"),
                        row.getLong("job_posting_open"),
                        row.getLong("job_posting_published"),
                        row.getLong("job_posting_rolling")
                )
        );
    }
}
