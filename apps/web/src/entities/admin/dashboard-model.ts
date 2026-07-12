export interface AdminDashboard {
  generatedAt: string;
  reviewSlaHours: number;
  applications: {
    total: number;
    drafts: number;
    submitted: number;
    withdrawn: number;
    submittedToday: number;
    submittedLastSevenDays: number;
  };
  reviewQueue: {
    newApplicants: number;
    inReview: number;
    passed: number;
    rejected: number;
    unassigned: number;
    overdue: number;
    decisionPending: number;
  };
  interviews: {
    today: number;
    upcomingSevenDays: number;
    pendingEvaluation: number;
  };
  notifications: {
    pending: number;
    retrying: number;
    exhausted: number;
  };
  jobPostings: {
    total: number;
    open: number;
    published: number;
    rolling: number;
  };
}
