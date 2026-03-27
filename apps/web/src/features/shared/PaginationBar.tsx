"use client";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary?: string;
}

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  summary,
}: PaginationBarProps) {
  if (totalPages <= 1) {
    return summary ? (
      <div className="text-sm text-on-surface-variant">{summary}</div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" aria-atomic="true" className="text-sm text-on-surface-variant">
        {summary}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="min-h-[44px] rounded-sm border border-outline-variant px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="min-h-[44px] rounded-sm border border-outline-variant px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
