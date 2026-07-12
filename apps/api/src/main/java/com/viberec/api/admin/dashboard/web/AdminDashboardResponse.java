package com.viberec.api.admin.dashboard.web;

import java.time.OffsetDateTime;

public record AdminDashboardResponse(
        OffsetDateTime generatedAt,
        int reviewSlaHours,
        ApplicationMetrics applications,
        ReviewQueueMetrics reviewQueue,
        InterviewMetrics interviews,
        NotificationMetrics notifications,
        JobPostingMetrics jobPostings
) {
    public record ApplicationMetrics(
            long total,
            long drafts,
            long submitted,
            long withdrawn,
            long submittedToday,
            long submittedLastSevenDays
    ) {
    }

    public record ReviewQueueMetrics(
            long newApplicants,
            long inReview,
            long passed,
            long rejected,
            long unassigned,
            long overdue,
            long decisionPending
    ) {
    }

    public record InterviewMetrics(
            long today,
            long upcomingSevenDays,
            long pendingEvaluation
    ) {
    }

    public record NotificationMetrics(
            long pending,
            long retrying,
            long exhausted
    ) {
    }

    public record JobPostingMetrics(
            long total,
            long open,
            long published,
            long rolling
    ) {
    }
}
