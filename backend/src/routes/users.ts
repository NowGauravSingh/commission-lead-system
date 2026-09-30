import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/users
// Get all users with their managers.
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// POST /api/users
// Create a new user.
router.post("/", async (req, res) => {
  try {
    const { name, email, managerId } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    // Check manager exists if managerId is provided.
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: {
          id: managerId,
        },
      });

      if (!manager) {
        return res.status(400).json({
          error: "Manager not found",
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        managerId: managerId || null,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    console.error("Create user error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;