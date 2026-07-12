import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import {
  createAdminApplicantSavedSearch,
  getAdminApplicantSavedSearches,
} from "@/shared/api/admin-applicants";

export async function GET() {
  try {
    return NextResponse.json(await getAdminApplicantSavedSearches());
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "저장된 검색을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    name?: string;
    filters?: Record<string, string>;
  } | null;
  if (!payload?.name?.trim() || !payload.filters) {
    return NextResponse.json({ message: "검색 이름과 필터가 필요합니다." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await createAdminApplicantSavedSearch(payload.name, payload.filters),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "검색을 저장하지 못했습니다." }, { status: 500 });
  }
}
