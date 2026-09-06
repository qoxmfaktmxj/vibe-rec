"use client";

import { useRouter } from "next/navigation";

interface RetryPageButtonProps {
  className?: string;
}

export function RetryPageButton({ className = "" }: RetryPageButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={className}
    >
      다시 시도
    </button>
  );
}
