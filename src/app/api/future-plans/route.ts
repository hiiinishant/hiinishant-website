import { NextResponse } from "next/server";
import fs from "fs";
import { getDataFilePath } from "@/lib/db";

export interface FuturePlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: "academic" | "business" | "community" | "general";
  status: "planned" | "in-progress" | "completed";
}

const DATA_FILE = getDataFilePath("future_plans.json");

const initialPlans: FuturePlan[] = [
  {
    id: "plan-1",
    title: "Launch 2 AM Study Mobile App",
    description: "Build and publish a native Android/iOS application supporting offline notes access, flashcards, and study planners.",
    targetDate: "Q4 2026",
    category: "business",
    status: "planned",
  },
  {
    id: "plan-2",
    title: "GATE CSE Full Mock Series",
    description: "Publish 10 full-length practice examinations matching the latest GATE system syllabus and time limits.",
    targetDate: "Q3 2026",
    category: "academic",
    status: "in-progress",
  },
  {
    id: "plan-3",
    title: "National Mentorship Program",
    description: "Launch weekly live study rooms and direct peer mentorship circles to help 500+ top aspirants coordinate GATE schedules.",
    targetDate: "Q3 2026",
    category: "community",
    status: "in-progress",
  },
];

function getPlans(): FuturePlan[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialPlans, null, 2), "utf-8");
    return initialPlans;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading future_plans.json:", error);
    return initialPlans;
  }
}

function savePlans(plans: FuturePlan[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(plans, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json(getPlans());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, targetDate, category, status } = body;

    if (!title || !description || !targetDate || !category || !status) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const plans = getPlans();
    const newPlan: FuturePlan = {
      id: `plan-${Date.now()}`,
      title,
      description,
      targetDate,
      category,
      status,
    };

    plans.push(newPlan);
    savePlans(plans);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add plan" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "ID and status required." }, { status: 400 });

    const plans = getPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    plans[idx].status = status;
    savePlans(plans);
    return NextResponse.json(plans[idx]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const plans = getPlans();
    const filtered = plans.filter((p) => p.id !== id);

    if (filtered.length === plans.length) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    savePlans(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete plan" }, { status: 500 });
  }
}
