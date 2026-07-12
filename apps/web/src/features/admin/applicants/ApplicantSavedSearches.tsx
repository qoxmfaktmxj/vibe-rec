"use client";

import Link from "next/link";
import { useState } from "react";

import type { AdminApplicantSavedSearch } from "@/entities/admin/applicant-model";

function savedSearchHref(filters: Record<string, string>) {
  const query = new URLSearchParams(filters);
  const queryString = query.toString();
  return queryString ? `/admin/applicants?${queryString}` : "/admin/applicants";
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

export function ApplicantSavedSearches({
  initialSearches,
  currentFilters,
}: {
  initialSearches: AdminApplicantSavedSearch[];
  currentFilters: Record<string, string>;
}) {
  const [searches, setSearches] = useState(initialSearches);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCurrentSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/applicants/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters: currentFilters }),
      });
      if (!response.ok) throw new Error(await responseError(response, "검색을 저장하지 못했습니다."));
      const saved = (await response.json()) as AdminApplicantSavedSearch;
      setSearches((current) => [saved, ...current]);
      setName("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "검색을 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function removeSearch(savedSearchId: number) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applicants/saved-searches/${savedSearchId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseError(response, "저장된 검색을 삭제하지 못했습니다."));
      setSearches((current) => current.filter((search) => search.id !== savedSearchId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "저장된 검색을 삭제하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border border-outline-variant bg-card px-5 py-5" aria-labelledby="saved-searches-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="saved-searches-heading" className="font-headline text-xl font-semibold tracking-[-0.04em]">저장된 검색</h2>
          <p className="mt-1 text-sm text-on-surface-variant">현재 필터와 정렬을 개인 검색으로 저장합니다.</p>
        </div>
        <form onSubmit={saveCurrentSearch} className="flex w-full max-w-md gap-2">
          <label htmlFor="saved-search-name" className="sr-only">저장 검색 이름</label>
          <input
            id="saved-search-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            disabled={pending}
            placeholder="예: 내 미검토 지원자"
            className="min-w-0 flex-1 border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm"
          />
          <button type="submit" disabled={pending || !name.trim()} className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            저장
          </button>
        </form>
      </div>
      {searches.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {searches.map((search) => (
            <li key={search.id} className="inline-flex items-center border border-outline-variant bg-surface-container-lowest">
              <Link href={savedSearchHref(search.filters)} className="px-3 py-2 text-sm font-medium hover:text-primary">
                {search.name}
              </Link>
              <button
                type="button"
                aria-label={`${search.name} 저장 검색 삭제`}
                onClick={() => void removeSearch(search.id)}
                disabled={pending}
                className="border-l border-outline-variant px-2.5 py-2 text-on-surface-variant hover:text-destructive disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
