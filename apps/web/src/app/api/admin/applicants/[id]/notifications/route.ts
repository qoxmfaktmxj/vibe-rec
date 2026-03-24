import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import {
  createNotification,
  getNotifications,
} from "@/shared/api/admin-hiring";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "Invalid application id." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const notifications = await getNotifications(applicationId);
    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch notifications." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "Invalid application id." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as {
      type: string;
      title: string;
      content: string;
    };
    const notification = await createNotification(applicationId, payload);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to create notification." },
      { status: 500 },
    );
  }
}
