"use client";

import { useState } from "react";

import type { CandidateSession } from "@/entities/candidate/model";
import type { CandidateApplicationSummary } from "@/entities/recruitment/model";

import { ProfileApplicationHistory } from "./ProfileApplicationHistory";
import { ProfileEditor } from "./ProfileEditor";

interface ProfileDashboardProps {
  candidateSession: CandidateSession;
  applications: CandidateApplicationSummary[];
}

export function ProfileDashboard({
  candidateSession,
  applications,
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "applications">(
    "profile",
  );
  const submittedCount = applications.filter(
    (application) => application.status === "SUBMITTED",
  ).length;

  const tabClassName = (tab: string) =>
    `px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
      activeTab === tab
        ? "border-primary text-primary"
        : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
    }`;

  return (
    <div className="space-y-8">
      <section className="rounded-sm border border-outline-variant bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="text-[11px] font-medium text-outline">이름</span>
            <p className="mt-0.5 text-sm font-medium text-on-surface">
              {candidateSession.name}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-outline">이메일</span>
            <p className="mt-0.5 text-sm font-medium text-on-surface">
              {candidateSession.email}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-outline">지원 현황</span>
            <p className="mt-0.5 text-sm font-medium text-on-surface">
              총 {applications.length}건
              {submittedCount > 0 ? ` (제출 ${submittedCount}건)` : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="flex border-b border-outline-variant">
        <button
          type="button"
          className={tabClassName("profile")}
          onClick={() => setActiveTab("profile")}
        >
          프로필 관리
        </button>
        <button
          type="button"
          className={tabClassName("applications")}
          onClick={() => setActiveTab("applications")}
        >
          지원 이력 ({applications.length})
        </button>
      </div>

      {activeTab === "profile" ? <ProfileEditor /> : null}
      {activeTab === "applications" ? (
        <ProfileApplicationHistory applications={applications} />
      ) : null}
    </div>
  );
}
