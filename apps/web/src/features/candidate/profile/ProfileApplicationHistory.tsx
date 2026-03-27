"use client";

import { CandidateApplicationsPanel } from "@/features/recruitment/application/CandidateApplicationsPanel";
import type { CandidateApplicationSummary } from "@/entities/recruitment/model";

interface ProfileApplicationHistoryProps {
  applications: CandidateApplicationSummary[];
}

export function ProfileApplicationHistory({ applications }: ProfileApplicationHistoryProps) {
  return (
    <CandidateApplicationsPanel
      applications={applications}
      variant="compact"
      pageSize={30}
    />
  );
}
