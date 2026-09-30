import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// POST /api/leads/:id/assign
// Assigns a lead to a user.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { userId } = body;

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check that the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Don't allow assignment after the lead is closed
    if (lead.status === "CLOSED") {
      return NextResponse.json(
        { error: "Closed lead cannot be assigned" },
        { status: 400 }
      );
    }

    // Check that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Assign the lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedToId: userId,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Assign lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}