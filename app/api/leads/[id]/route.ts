import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/leads/:id
// Returns one lead with its hierarchy and commissions.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          include: {
            manager: {
              include: {
                manager: true,
              },
            },
          },
        },
        commissions: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Get lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}