"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
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
          router.push("/login");
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
      className="rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
