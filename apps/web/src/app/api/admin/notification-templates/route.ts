import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { getNotificationTemplates } from "@/shared/api/admin-hire";

export async function GET() {
  try {
    await getRequiredAdminSessionToken();
    const templates = await getNotificationTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to fetch templates." }, { status: 500 });
  }
}
