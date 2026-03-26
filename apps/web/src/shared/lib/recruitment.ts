import type {
  ApplicationFinalStatus,
  ApplicationReviewStatus,
  ApplicationStatus,
  EvaluationResult,
  InterviewStatus,
  JobPostingStatus,
  JobPostingStepType,
} from "@/entities/recruitment/model";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatDateRange(startAt: string | null, endAt: string | null) {
  return `${formatDate(startAt)} - ${formatDate(endAt)}`;
}

export function getJobPostingStatusLabel(status: JobPostingStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "OPEN":
      return "Open";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

export function getJobPostingStatusClassName(status: JobPostingStatus) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-900";
    case "CLOSED":
      return "bg-stone-200 text-stone-700";
    case "DRAFT":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getStepTypeLabel(stepType: JobPostingStepType) {
  switch (stepType) {
    case "DOCUMENT":
      return "Document";
    case "ASSIGNMENT":
      return "Assignment";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    default:
      return stepType;
  }
}

export function getApplicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    default:
      return status;
  }
}

export function getApplicationStatusClassName(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "bg-emerald-100 text-emerald-900";
    case "DRAFT":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getApplicationReviewStatusLabel(
  reviewStatus: ApplicationReviewStatus,
) {
  switch (reviewStatus) {
    case "NEW":
      return "New";
    case "IN_REVIEW":
      return "In review";
    case "PASSED":
      return "Passed";
    case "REJECTED":
      return "Rejected";
    default:
      return reviewStatus;
  }
}

export function getApplicationReviewStatusClassName(
  reviewStatus: ApplicationReviewStatus,
) {
  switch (reviewStatus) {
    case "NEW":
      return "bg-stone-200 text-stone-700";
    case "IN_REVIEW":
      return "bg-sky-100 text-sky-900";
    case "PASSED":
      return "bg-emerald-100 text-emerald-900";
    case "REJECTED":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getDraftAvailability(posting: {
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string;
}) {
  const now = Date.now();
  const opensAt = new Date(posting.opensAt).getTime();
  const closesAt = new Date(posting.closesAt).getTime();

  if (posting.status !== "OPEN") {
    return {
      canSave: false,
      reason: "This posting is not accepting new applications right now.",
    };
  }

  if (now < opensAt) {
    return {
      canSave: false,
      reason: "Draft saving becomes available when the application window opens.",
    };
  }

  if (now > closesAt) {
    return {
      canSave: false,
      reason: "The application window is closed, so drafts can no longer be saved.",
    };
  }

  return {
    canSave: true,
    reason: "Applicants can save a draft now and submit it before the posting closes.",
  };
}

export function getInterviewStatusLabel(status: InterviewStatus) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "NO_SHOW":
      return "No show";
    default:
      return status;
  }
}

export function getInterviewStatusClassName(status: InterviewStatus) {
  switch (status) {
    case "SCHEDULED":
      return "bg-sky-100 text-sky-900";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900";
    case "CANCELLED":
      return "bg-stone-200 text-stone-700";
    case "NO_SHOW":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getEvaluationResultLabel(result: EvaluationResult) {
  switch (result) {
    case "PENDING":
      return "Pending";
    case "PASS":
      return "Pass";
    case "FAIL":
      return "Fail";
    case "HOLD":
      return "Hold";
    default:
      return result;
  }
}

export function getEvaluationResultClassName(result: EvaluationResult) {
  switch (result) {
    case "PENDING":
      return "bg-amber-100 text-amber-900";
    case "PASS":
      return "bg-emerald-100 text-emerald-900";
    case "FAIL":
      return "bg-rose-100 text-rose-900";
    case "HOLD":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getFinalStatusLabel(status: ApplicationFinalStatus) {
  switch (status) {
    case "OFFER_MADE":
      return "Offer made";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return status;
  }
}

export function getFinalStatusClassName(status: ApplicationFinalStatus) {
  switch (status) {
    case "OFFER_MADE":
      return "bg-sky-100 text-sky-900";
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-900";
    case "DECLINED":
      return "bg-rose-100 text-rose-900";
    case "WITHDRAWN":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function getDegreeLabel(degree: string) {
  switch (degree) {
    case "HIGH_SCHOOL":
      return "High school";
    case "ASSOCIATE":
      return "Associate";
    case "BACHELOR":
      return "Bachelor";
    case "MASTER":
      return "Master";
    case "DOCTORATE":
      return "Doctorate";
    default:
      return degree;
  }
}

export function getNotificationTypeLabel(type: string) {
  switch (type) {
    case "OFFER":
      return "Offer";
    case "REJECTION":
      return "Rejection";
    case "INTERVIEW_INVITE":
      return "Interview invite";
    case "GENERAL":
      return "General";
    default:
      return type;
  }
}

export function getNotificationTypeClassName(type: string) {
  switch (type) {
    case "OFFER":
      return "bg-emerald-100 text-emerald-900";
    case "REJECTION":
      return "bg-rose-100 text-rose-900";
    case "INTERVIEW_INVITE":
      return "bg-sky-100 text-sky-900";
    case "GENERAL":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
