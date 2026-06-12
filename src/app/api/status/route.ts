import { NextResponse } from "next/server";
import {
  getAllDailyStatusesSorted,
  addOrUpdateDailyStatus,
  deleteDailyStatus,
} from "@/data/statusServer";

const ADMIN_PASSWORD = "nishant2am";

// Validate password from request headers or body
async function checkAuth(request: Request): Promise<boolean> {
  const passwordHeader = request.headers.get("x-admin-password");
  if (passwordHeader === ADMIN_PASSWORD) {
    return true;
  }

  // Fallback to reading the body if it's JSON
  try {
    const clone = request.clone();
    const body = await clone.json();
    if (body && body.password === ADMIN_PASSWORD) {
      return true;
    }
  } catch {
    // Body is not json or empty
  }

  return false;
}

export async function GET() {
  try {
    const statuses = getAllDailyStatusesSorted();
    return NextResponse.json(statuses);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch status updates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { date, statusText, tasks } = body;

    if (!date || !statusText || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Date, statusText, and tasks (array) are required." },
        { status: 400 }
      );
    }

    const updated = addOrUpdateDailyStatus(date, statusText, tasks);
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add status update" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Status ID is required." }, { status: 400 });
    }

    const deleted = deleteDailyStatus(id);
    if (!deleted) {
      return NextResponse.json({ error: "Status entry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete status entry" },
      { status: 500 }
    );
  }
}
