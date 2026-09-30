import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";


// GET /api/users
// Returns all users with their managers.
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users
// Creates a new user.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, managerId } = body;

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // If managerId is provided, make sure that user exists.
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        return NextResponse.json(
          { error: "Manager not found" },
          { status: 400 }
        );
      }
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        managerId: managerId || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    // Email is unique in our database.
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    console.error("Create user error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}