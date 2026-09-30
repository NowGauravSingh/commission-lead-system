import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";



export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Get leads error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// POST /api/leads
// Creates a new lead.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { title, revenue } = body;

    // Check required fields
    if (!title || revenue === undefined) {
      return NextResponse.json(
        { error: "Title and revenue are required" },
        { status: 400 },
      );
    }

    // Revenue must be positive
    if (Number(revenue) <= 0) {
      return NextResponse.json(
        { error: "Revenue must be greater than 0" },
        { status: 400 },
      );
    }

    // Create lead in PostgreSQL
    const lead = await prisma.lead.create({
      data: {
        title,
        revenue: Number(revenue),
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Create lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
