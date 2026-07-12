import { redirect } from "next/navigation";

import { AdminDataPrivacyQueue } from "@/features/admin/privacy/AdminDataPrivacyQueue";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getAdminCandidateDataRequests } from "@/shared/api/admin-privacy";

export default async function AdminDataRequestsPage() {
  const session = await getCurrentAdminSession();
  if (!session?.permissions.includes("DATA_PRIVACY_MANAGE")) {
    redirect("/admin");
  }
  const requests = await getAdminCandidateDataRequests();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">Privacy operations</p>
        <h1 className="mt-2 font-headline text-3xl font-semibold tracking-[-0.05em]">개인정보 요청 관리</h1>
        <p className="mt-2 text-sm text-on-surface-variant">내보내기와 삭제 요청을 검토하고 모든 처리 단계를 감사 이력으로 남깁니다.</p>
      </div>
      <AdminDataPrivacyQueue initialRequests={requests} />
    </div>
  );
}
