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
      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
