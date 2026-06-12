import { NextResponse } from "next/server";
import fs from "fs";
import { latestUpdates as initialUpdates, type UpdateItem } from "@/data/updates";
import { getDataFilePath } from "@/lib/db";

const DATA_FILE = getDataFilePath("updates.json");

function getUpdates(): UpdateItem[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialUpdates, null, 2), "utf-8");
    return initialUpdates;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading updates.json:", error);
    return initialUpdates;
  }
}

function saveUpdates(updates: UpdateItem[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(updates, null, 2), "utf-8");
}

export async function GET() {
  const updates = getUpdates();
  const sorted = [...updates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, title, description, date, href, badge, meta, isNew } = body;

    if (!category || !title || !description || !date) {
      return NextResponse.json(
        { error: "Category, Title, Description, and Date are required." },
        { status: 400 }
      );
    }

    const updates = getUpdates();
    const newUpdate: UpdateItem = {
      id: `${category}-${Date.now()}`,
      category,
      title,
      description,
      date,
      href: href || undefined,
      badge: badge || undefined,
      meta: meta || undefined,
      isNew: isNew ?? true,
    };

    updates.push(newUpdate);
    saveUpdates(updates);
    return NextResponse.json(newUpdate, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const updates = getUpdates();
    const filtered = updates.filter((u) => u.id !== id);

    if (filtered.length === updates.length) {
      return NextResponse.json({ error: "Update not found." }, { status: 404 });
    }

    saveUpdates(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete update" }, { status: 500 });
  }
}
