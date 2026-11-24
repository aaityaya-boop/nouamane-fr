import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, "marketing.manage_seo");
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { name, url, keyword } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: "Experiment name and target URL are required." },
        { status: 400 }
      );
    }

    const experiment = await prisma.seoExperiment.create({
      data: {
        name: String(name).trim(),
        url: String(url).trim(),
        keyword: keyword ? String(keyword).trim() : null,
        startDate: new Date(),
        status: "RUNNING",
      },
    });

    return NextResponse.json({ success: true, experiment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create SEO experiment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}
