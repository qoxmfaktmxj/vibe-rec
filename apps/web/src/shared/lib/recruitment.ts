import type {
  ApplicationFinalStatus,
  ApplicationReviewStatus,
  ApplicationStatus,
  CandidateApplicationDetail,
  CandidateApplicationSummary,
  CandidateNextAction,
  CandidateVisibleStage,
  EvaluationResult,
  InterviewStatus,
  JobPostingStatus,
  JobPostingStepType,
  RecruitmentCategory,
  RecruitmentMode,
} from "@/entities/recruitment/model";

export function getCandidateVisibleStageLabel(stage: CandidateVisibleStage) {
  switch (stage) {
    case "DRAFT":
      return "작성 중";
    case "SCREENING":
      return "서류 검토";
    case "INTERVIEW":
      return "면접 전형";
    case "OFFER":
      return "처우 협의";
    case "CLOSED":
      return "전형 종료";
  }
}

export function getCandidateVisibleStageClassName(stage: CandidateVisibleStage) {
  switch (stage) {
    case "DRAFT":
      return "bg-amber-100 text-amber-900";
    case "SCREENING":
      return "bg-sky-100 text-sky-900";
    case "INTERVIEW":
      return "bg-sky-100 text-sky-900";
    case "OFFER":
      return "bg-emerald-100 text-emerald-900";
    case "CLOSED":
      return "bg-surface-container text-on-surface-variant";
  }
}

export function getCandidateNextActionLabel(action: CandidateNextAction) {
  switch (action) {
    case "COMPLETE_APPLICATION":
      return "지원서 작성을 완료해 주세요.";
    case "WAIT_FOR_REVIEW":
      return "채용팀의 서류 검토를 기다려 주세요.";
    case "WAIT_FOR_INTERVIEW":
      return "면접 일정 안내를 기다려 주세요.";
    case "PREPARE_FOR_INTERVIEW":
      return "예정된 면접을 준비해 주세요.";
    case "WAIT_FOR_DECISION":
      return "면접 결과 안내를 기다려 주세요.";
    case "REVIEW_OFFER":
      return "채용 제안 내용을 확인해 주세요.";
    case "CONTACT_RECRUITING":
      return "채용 담당자에게 문의해 주세요.";
    case "NONE":
      return "현재 필요한 추가 행동이 없습니다.";
  }
}

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

type JobPostingAvailability = {
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string | null;
  recruitmentMode: RecruitmentMode;
};

type JobPostingGrouping = {
  recruitmentCategory: RecruitmentCategory;
  recruitmentMode: RecruitmentMode;
};

export type JobPostingDisplayGroup = "NEW_GRAD" | "EXPERIENCED" | "ROLLING";

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
  if (!startAt && !endAt) {
    return "일정 조율 중";
  }

  if (!startAt) {
    return `~ ${formatDate(endAt)}`;
  }

  if (!endAt) {
    return `${formatDate(startAt)}부터`;
  }

  return `${formatDate(startAt)} - ${formatDate(endAt)}`;
}

export function formatRecruitmentPeriod(posting: {
  opensAt: string;
  closesAt: string | null;
  recruitmentMode: RecruitmentMode;
}) {
  if (posting.recruitmentMode === "ROLLING") {
    return "상시 모집";
  }

  return formatDateRange(posting.opensAt, posting.closesAt);
}

export type JobPostingDdayInfo =
  | { kind: "rolling" }
  | { kind: "closed" }
  | { kind: "dday"; days: number; label: string; urgent: boolean };

/**
 * D-day metadata for a job posting card. Rolling postings never expire (live dot),
 * fixed-term postings without a close date fall back to "closed" once past open.
 */
export function getJobPostingDdayInfo(posting: {
  closesAt: string | null;
  recruitmentMode: RecruitmentMode;
}): JobPostingDdayInfo {
  if (posting.recruitmentMode === "ROLLING") {
    return { kind: "rolling" };
  }

  if (!posting.closesAt) {
    return { kind: "closed" };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const closesAt = new Date(posting.closesAt);
  const startOfCloseDay = new Date(
    closesAt.getFullYear(),
    closesAt.getMonth(),
    closesAt.getDate(),
  ).getTime();

  const days = Math.round((startOfCloseDay - startOfToday) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { kind: "closed" };
  }

  return {
    kind: "dday",
    days,
    label: days === 0 ? "D-DAY" : `D-${days}`,
    urgent: days <= 7,
  };
}

export function isJobPostingOpenForApplications(posting: JobPostingAvailability) {
  const now = Date.now();
  const opensAt = new Date(posting.opensAt).getTime();

  if (posting.status !== "OPEN" || now < opensAt) {
    return false;
  }

  if (posting.recruitmentMode === "ROLLING") {
    return true;
  }

  if (!posting.closesAt) {
    return false;
  }

  const closesAt = new Date(posting.closesAt).getTime();
  return now <= closesAt;
}

export function getJobPostingStatusLabel(status: JobPostingStatus) {
  switch (status) {
    case "DRAFT":
      return "임시 저장";
    case "OPEN":
      return "모집 중";
    case "CLOSED":
      return "마감";
    default:
      return status;
  }
}

export function getJobPostingStatusClassName(status: JobPostingStatus) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "CLOSED":
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
    case "DRAFT":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getRecruitmentCategoryLabel(category: RecruitmentCategory) {
  switch (category) {
    case "NEW_GRAD":
      return "신입 채용";
    case "EXPERIENCED":
      return "경력 채용";
    default:
      return category;
  }
}

export function getRecruitmentModeLabel(mode: RecruitmentMode) {
  switch (mode) {
    case "FIXED_TERM":
      return "기간 채용";
    case "ROLLING":
      return "상시 채용";
    default:
      return mode;
  }
}

export function getEmploymentTypeLabel(employmentType: string) {
  switch (employmentType) {
    case "FULL_TIME":
      return "정규직";
    case "CONTRACT":
      return "계약직";
    case "PART_TIME":
      return "파트타임";
    case "INTERN":
      return "인턴";
    case "TEMPORARY":
      return "단기 계약";
    default:
      return employmentType;
  }
}

export function getJobPostingDisplayGroup(
  posting: JobPostingGrouping,
): JobPostingDisplayGroup {
  if (posting.recruitmentMode === "ROLLING") {
    return "ROLLING";
  }

  return posting.recruitmentCategory;
}

export function groupJobPostings<T extends JobPostingGrouping>(jobPostings: T[]) {
  return jobPostings.reduce(
    (groups, jobPosting) => {
      const group = getJobPostingDisplayGroup(jobPosting);

      if (group === "ROLLING") {
        groups.rolling.push(jobPosting);
      } else if (group === "NEW_GRAD") {
        groups.newGrad.push(jobPosting);
      } else {
        groups.experienced.push(jobPosting);
      }

      return groups;
    },
    {
      newGrad: [] as T[],
      experienced: [] as T[],
      rolling: [] as T[],
    },
  );
}

export function getStepTypeLabel(stepType: JobPostingStepType) {
  switch (stepType) {
    case "DOCUMENT":
      return "서류";
    case "ASSIGNMENT":
      return "과제";
    case "INTERVIEW":
      return "면접";
    case "OFFER":
      return "처우";
    default:
      return stepType;
  }
}

export function getApplicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "DRAFT":
      return "임시 저장";
    case "SUBMITTED":
      return "제출 완료";
    case "WITHDRAWN":
      return "지원 철회";
    default:
      return status;
  }
}

export function getApplicationStatusClassName(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "DRAFT":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getApplicationReviewStatusLabel(
  reviewStatus: ApplicationReviewStatus,
) {
  switch (reviewStatus) {
    case "NEW":
      return "접수 대기";
    case "IN_REVIEW":
      return "검토 중";
    case "PASSED":
      return "합격";
    case "REJECTED":
      return "불합격";
    default:
      return reviewStatus;
  }
}

export function getApplicationReviewStatusClassName(
  reviewStatus: ApplicationReviewStatus,
) {
  switch (reviewStatus) {
    case "NEW":
      return "bg-primary-container text-brand ring-brand/20";
    case "IN_REVIEW":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "PASSED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getDraftAvailability(posting: JobPostingAvailability) {
  const now = Date.now();
  const opensAt = new Date(posting.opensAt).getTime();

  if (posting.status !== "OPEN") {
    return {
      canSave: false,
      reason: "현재 이 공고는 지원서를 받고 있지 않습니다.",
    };
  }

  if (now < opensAt) {
    return {
      canSave: false,
      reason: "지원 기간이 시작된 뒤에 지원서를 작성할 수 있습니다.",
    };
  }

  if (posting.recruitmentMode === "ROLLING") {
    return {
      canSave: true,
      reason:
        "상시 채용 공고입니다. 지원서를 작성하고 제출하면 순차적으로 검토가 진행됩니다.",
    };
  }

  if (!posting.closesAt) {
    return {
      canSave: false,
      reason: "마감 일정이 설정되지 않아 현재는 지원서를 작성할 수 없습니다.",
    };
  }

  if (now > new Date(posting.closesAt).getTime()) {
    return {
      canSave: false,
      reason: "지원 기간이 종료되어 더 이상 지원서를 작성하거나 제출할 수 없습니다.",
    };
  }

  return {
    canSave: true,
    reason: "지금부터 마감 전까지 지원서를 저장하고 제출할 수 있습니다.",
  };
}

export const applicationFlowLabels = ["작성", "제출", "검토", "결과"] as const;

type ApplicationFlowState = Pick<
  CandidateApplicationDetail | CandidateApplicationSummary,
  "status" | "reviewStatus" | "finalStatus"
>;

export interface ApplicationFlowProgress {
  labels: typeof applicationFlowLabels;
  /** Index into `labels` for the candidate's current step (RecruitmentStepper currentIndex). */
  currentIndex: number;
  /** True when the review ended in rejection or the final offer was declined. */
  isRejected: boolean;
  /** True when the candidate withdrew the application or offer. */
  isWithdrawn: boolean;
}

/**
 * Derives the candidate-facing flow progress (작성→제출→검토→결과) for an application.
 * Shared by the job posting detail page and the /me dashboard so the stepper logic
 * stays consistent everywhere it's rendered.
 */
export function getApplicationFlowProgress(
  application: ApplicationFlowState | null,
): ApplicationFlowProgress {
  const isSubmitted = application?.status === "SUBMITTED";
  const isInReview = application?.reviewStatus === "IN_REVIEW";
  const isRejected =
    application?.reviewStatus === "REJECTED" ||
    application?.finalStatus === "DECLINED";
  const isWithdrawn =
    application?.status === "WITHDRAWN" ||
    application?.finalStatus === "WITHDRAWN";
  const isResolved =
    isRejected ||
    isWithdrawn ||
    application?.reviewStatus === "PASSED" ||
    application?.finalStatus === "ACCEPTED";

  const currentIndex = isResolved ? 3 : isInReview ? 2 : isSubmitted ? 1 : 0;

  return {
    labels: applicationFlowLabels,
    currentIndex,
    isRejected,
    isWithdrawn,
  };
}

export function getInterviewStatusLabel(status: InterviewStatus) {
  switch (status) {
    case "SCHEDULED":
      return "예정";
    case "COMPLETED":
      return "완료";
    case "CANCELLED":
      return "취소";
    case "NO_SHOW":
      return "불참";
    default:
      return status;
  }
}

export function getInterviewStatusClassName(status: InterviewStatus) {
  switch (status) {
    case "SCHEDULED":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "CANCELLED":
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
    case "NO_SHOW":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getEvaluationResultLabel(result: EvaluationResult) {
  switch (result) {
    case "PENDING":
      return "대기";
    case "PASS":
      return "합격";
    case "FAIL":
      return "불합격";
    case "HOLD":
      return "보류";
    default:
      return result;
  }
}

export function getEvaluationResultClassName(result: EvaluationResult) {
  switch (result) {
    case "PENDING":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "PASS":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "FAIL":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "HOLD":
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getFinalStatusLabel(status: ApplicationFinalStatus) {
  switch (status) {
    case "OFFER_MADE":
      return "처우 제안";
    case "ACCEPTED":
      return "수락";
    case "DECLINED":
      return "거절";
    case "WITHDRAWN":
      return "철회";
    default:
      return status;
  }
}

export function getFinalStatusClassName(status: ApplicationFinalStatus) {
  switch (status) {
    case "OFFER_MADE":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "DECLINED":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "WITHDRAWN":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
  }
}

export function getDegreeLabel(degree: string) {
  switch (degree) {
    case "HIGH_SCHOOL":
      return "고등학교";
    case "ASSOCIATE":
      return "전문학사";
    case "BACHELOR":
      return "학사";
    case "MASTER":
      return "석사";
    case "DOCTORATE":
      return "박사";
    default:
      return degree;
  }
}

export function getNotificationTypeLabel(type: string) {
  switch (type) {
    case "OFFER":
      return "처우 제안";
    case "REJECTION":
      return "불합격 안내";
    case "INTERVIEW_INVITE":
      return "면접 안내";
    case "GENERAL":
      return "일반 안내";
    default:
      return type;
  }
}

export function getNotificationTypeClassName(type: string) {
  switch (type) {
    case "OFFER":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "REJECTION":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "INTERVIEW_INVITE":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "GENERAL":
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
    default:
      return "bg-surface-container text-on-surface-variant ring-outline-variant";
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
