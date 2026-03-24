"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton({
  redirectTo = "/login",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleLogout() {
    setIsPending(true);

    startTransition(() => {
      void (async () => {
        try {
          await fetch("/api/admin/auth/logout", {
            method: "POST",
          });
        } finally {
          setIsPending(false);
          router.push(redirectTo);
          router.refresh();
        }
      })();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-sm border border-outline-variant bg-card px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
