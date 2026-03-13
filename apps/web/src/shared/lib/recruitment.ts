import type {
  ApplicationStatus,
  JobPostingStatus,
  JobPostingStepType,
} from "@/entities/recruitment/model";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
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
      return "Draft saved";
    case "SUBMITTED":
      return "Submitted";
    default:
      return status;
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
      reason: "This posting is not accepting application drafts right now.",
    };
  }

  if (now < opensAt) {
    return {
      canSave: false,
      reason: "Draft save will open when the posting window starts.",
    };
  }

  if (now > closesAt) {
    return {
      canSave: false,
      reason: "Draft save is blocked because the posting window has closed.",
    };
  }

  return {
    canSave: true,
    reason: "Saved data is stored as an application draft in PostgreSQL.",
  };
}
