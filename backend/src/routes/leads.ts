import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/*
  GET /api/leads
  Get all leads
*/
router.get("/", async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        assignedTo: true,
        commissions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(leads);
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/*
  POST /api/leads
  Create a new lead
*/
router.post("/", async (req, res) => {
  try {
    const { title, revenue } = req.body;

    if (!title || revenue === undefined) {
      return res.status(400).json({
        error: "Title and revenue are required",
      });
    }

    const numericRevenue = Number(revenue);

    if (Number.isNaN(numericRevenue) || numericRevenue <= 0) {
      return res.status(400).json({
        error: "Revenue must be a positive number",
      });
    }

    const lead = await prisma.lead.create({
      data: {
        title,
        revenue: numericRevenue,
      },
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/*
  GET /api/leads/:id
  Get one lead with hierarchy and commissions
*/
router.get("/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: {
        id: req.params.id,
      },
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
          include: {
            user: true,
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        error: "Lead not found",
      });
    }

    res.json(lead);
  } catch (error) {
    console.error("Get lead error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/*
  POST /api/leads/:id/assign
  Assign a lead to a user
*/
router.post("/:id/assign", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!lead) {
      return res.status(404).json({
        error: "Lead not found",
      });
    }

    if (lead.status === "CLOSED") {
      return res.status(400).json({
        error: "Closed lead cannot be assigned",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: req.params.id,
      },
      data: {
        assignedToId: userId,
      },
      include: {
        assignedTo: true,
      },
    });

    res.json(updatedLead);
  } catch (error) {
    console.error("Assign lead error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/*
  POST /api/leads/:id/close

  Commission rules:

  Company = 20% of revenue

  Remaining 80%:
    Agent             = 50%
    Manager           = 30%
    Manager's Manager = 20%

  If manager is missing:
    manager's commission goes to company.

  If manager's manager is missing:
    manager's manager commission goes to company.

  Concurrency safety:
    We first change OPEN -> CLOSED using updateMany.

    Only one request can successfully change the lead
    from OPEN to CLOSED.

    Other concurrent requests will get 0 updated rows
    and return 409.
*/
router.post("/:id/close", async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      /*
        Step 1:
        Atomically change OPEN -> CLOSED.

        This protects against two requests closing
        the same lead at the same time.
      */
      const updateResult = await tx.lead.updateMany({
        where: {
          id: req.params.id,
          status: "OPEN",
        },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error("LEAD_ALREADY_CLOSED");
      }

      /*
        Step 2:
        Fetch the lead with complete hierarchy.
      */
      const lead = await tx.lead.findUnique({
        where: {
          id: req.params.id,
        },
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
        },
      });

      if (!lead) {
        throw new Error("LEAD_NOT_FOUND");
      }

      /*
        A lead must have an assigned agent before closing.
      */
      if (!lead.assignedTo) {
        throw new Error("LEAD_NOT_ASSIGNED");
      }

      const revenue = Number(lead.revenue);

      /*
        Step 3:
        Calculate commission amounts.
      */

      // Company gets 20%
      let companyAmount = revenue * 0.2;

      // Remaining 80%
      const distributableAmount = revenue * 0.8;

      // Agent gets 50% of remaining 80%
      const agentAmount = distributableAmount * 0.5;

      // Manager gets 30% of remaining 80%
      const managerAmount = distributableAmount * 0.3;

      // Manager's manager gets 20% of remaining 80%
      const managerManagerAmount = distributableAmount * 0.2;

      const agent = lead.assignedTo;
      const manager = agent.manager;
      const managerManager = manager?.manager;

      /*
        If manager does not exist,
        manager's amount goes to company.
      */
      if (!manager) {
        companyAmount += managerAmount;
      }

      /*
        If manager's manager does not exist,
        their amount goes to company.
      */
      if (!managerManager) {
        companyAmount += managerManagerAmount;
      }

      /*
        Explicit type is important here.

        Without it, TypeScript may infer the array
        using only COMPANY and AGENT types.
      */
      const commissions: {
        leadId: string;
        userId: string | null;
        type:
          | "COMPANY"
          | "AGENT"
          | "MANAGER"
          | "MANAGERS_MANAGER";
        amount: number;
      }[] = [
        {
          leadId: lead.id,
          userId: null,
          type: "COMPANY",
          amount: companyAmount,
        },
        {
          leadId: lead.id,
          userId: agent.id,
          type: "AGENT",
          amount: agentAmount,
        },
      ];

      /*
        Add manager commission only if manager exists.
      */
      if (manager) {
        commissions.push({
          leadId: lead.id,
          userId: manager.id,
          type: "MANAGER",
          amount: managerAmount,
        });
      }

      /*
        Add manager's manager commission only
        if manager's manager exists.
      */
      if (managerManager) {
        commissions.push({
          leadId: lead.id,
          userId: managerManager.id,
          type: "MANAGERS_MANAGER",
          amount: managerManagerAmount,
        });
      }

      /*
        Step 4:
        Save all commission entries.

        @@unique([leadId, type]) in Prisma schema
        also prevents duplicate commission types
        for the same lead.
      */
      await tx.commissionLedger.createMany({
        data: commissions,
      });

      /*
        Step 5:
        Return useful information.
      */
      const savedCommissions = await tx.commissionLedger.findMany({
        where: {
          leadId: lead.id,
        },
        include: {
          user: true,
        },
      });

      return {
        lead,
        commissions: savedCommissions,
      };
    });

    res.json({
      message: "Lead closed successfully",
      lead: result.lead,
      commissions: result.commissions,
    });
  } catch (error: any) {
    if (error.message === "LEAD_ALREADY_CLOSED") {
      return res.status(409).json({
        error: "Lead is already closed",
      });
    }

    if (error.message === "LEAD_NOT_FOUND") {
      return res.status(404).json({
        error: "Lead not found",
      });
    }

    if (error.message === "LEAD_NOT_ASSIGNED") {
      return res.status(400).json({
        error: "Lead must be assigned before closing",
      });
    }

    console.error("Close lead error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;