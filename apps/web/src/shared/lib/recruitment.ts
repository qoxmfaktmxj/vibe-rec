import type {
  ApplicationFinalStatus,
  ApplicationReviewStatus,
  ApplicationStatus,
  EvaluationResult,
  InterviewStatus,
  JobPostingStatus,
  JobPostingStepType,
  RecruitmentCategory,
  RecruitmentMode,
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
    return "일정 조율";
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
      return "bg-emerald-100 text-emerald-900";
    case "CLOSED":
      return "bg-stone-200 text-stone-700";
    case "DRAFT":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-stone-200 text-stone-700";
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
      return "신규";
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
      reason: "지원 기간이 시작되면 지원서를 작성할 수 있습니다.",
    };
  }

  if (posting.recruitmentMode === "ROLLING") {
    return {
      canSave: true,
      reason:
        "상시 채용 공고입니다. 지원서를 작성하고 제출하면 순차 검토가 진행됩니다.",
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
    reason: "지금부터 마감 시점까지 지원서를 저장하고 제출할 수 있습니다.",
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
