import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { AdminMobileGuard } from "@/features/admin/layout/AdminMobileGuard";
import { AdminRailNav } from "@/features/admin/navigation/AdminRailNav";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

const navItems = [
  {
    href: "/admin",
    label: "대시보드",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.5h6.75v6.75H3.75V4.5zm9.75 0h6.75v6.75H13.5V4.5zM3.75 14.25h6.75V21H3.75v-6.75zm9.75 3h6.75V21H13.5v-3.75z"
      />
    ),
  },
  {
    href: "/admin/applicants",
    label: "지원자",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0"
      />
    ),
  },
  {
    href: "/",
    label: "공개 사이트",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5M12 3.75c3.519 0 6.692 1.43 8.99 3.744M12 20.25c-3.519 0-6.692-1.43-8.99-3.744"
      />
    ),
  },
];

const privacyNavItem = {
  href: "/admin/data-requests",
  label: "개인정보 요청",
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.75l7.5 3v5.25c0 4.5-3.15 7.95-7.5 8.25-4.35-.3-7.5-3.75-7.5-8.25V6.75l7.5-3zm0 5.25v4.5m0 3h.008"
    />
  ),
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const visibleNavItems = session.permissions.includes("DATA_PRIVACY_MANAGE")
    ? [navItems[0], navItems[1], privacyNavItem, navItems[2]]
    : navItems;

  return (
    <AdminMobileGuard>
    <div className="min-h-screen bg-background text-on-surface md:grid md:grid-cols-[88px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col justify-between border-r border-sidebar-border/80 bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <div className="space-y-8">
          <Link
            href="/admin"
            aria-label="HireFlow 관리자 홈"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent elevation-2"
          >
            <span className="font-headline text-xl font-semibold">H</span>
          </Link>

          <AdminRailNav items={visibleNavItems} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground">
              관리자 모드
            </p>
            <p className="mt-2 text-xs font-medium leading-5 text-sidebar-foreground/90">채용 운영 워크스페이스</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-sm font-semibold uppercase text-sidebar-foreground">
            {session.displayName?.charAt(0) ?? "A"}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-outline-variant bg-surface/95 px-6 py-5 backdrop-blur md:px-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                관리자 워크스페이스
              </p>
              <div className="space-y-2">
                <h1 className="font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
                  HireFlow 관리자
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                  지원자 검토, 공고 관리, 채용 진행 현황을 한 화면에서 확인합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="rounded-lg border border-outline-variant bg-card px-4 py-3 text-sm elevation-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
                  현재 세션
                </p>
                <p className="mt-1 font-semibold text-on-surface">{session.displayName}</p>
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-on-surface-variant">{session.role}</p>
              </div>
              <AdminLogoutButton redirectTo="/admin/login" />
            </div>
          </div>
        </header>

        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
    </AdminMobileGuard>
  );
}
