import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// POST /api/leads/:id/close
// Closes a lead and distributes commission.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // --------------------------------------------------
      // 1. Atomically change OPEN -> CLOSED
      //
      // If another request already closed this lead,
      // this update will affect 0 rows.
      // --------------------------------------------------
      const updateResult = await tx.lead.updateMany({
        where: {
          id,
          status: "OPEN",
        },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      // No row updated means:
      // - lead doesn't exist, OR
      // - lead was already closed.
      if (updateResult.count === 0) {
        const existingLead = await tx.lead.findUnique({
          where: { id },
        });

        if (!existingLead) {
          throw new Error("LEAD_NOT_FOUND");
        }

        throw new Error("LEAD_ALREADY_CLOSED");
      }

      // --------------------------------------------------
      // 2. Get the now-closed lead and assigned agent
      // --------------------------------------------------
      const lead = await tx.lead.findUnique({
        where: { id },
        include: {
          assignedTo: true,
        },
      });

      if (!lead) {
        throw new Error("LEAD_NOT_FOUND");
      }

      if (!lead.assignedTo) {
        throw new Error("LEAD_NOT_ASSIGNED");
      }

      // --------------------------------------------------
      // 3. Traverse hierarchy
      // --------------------------------------------------
      const agent = lead.assignedTo;

      let manager = null;
      let managerManager = null;

      // Level 2
      if (agent.managerId) {
        manager = await tx.user.findUnique({
          where: {
            id: agent.managerId,
          },
        });
      }

      // Level 3
      if (manager?.managerId) {
        managerManager = await tx.user.findUnique({
          where: {
            id: manager.managerId,
          },
        });
      }

      // --------------------------------------------------
      // 4. Calculate commission
      // --------------------------------------------------
      const revenue = Number(lead.revenue);

      // 20% initially belongs to company.
      let companyAmount = revenue * 0.20;

      // Remaining 80%.
      const distributableAmount = revenue * 0.80;

      // Level 1 = 50% of 80%
      const agentAmount = distributableAmount * 0.50;

      // Level 2 = 30% of 80%
      const managerAmount = distributableAmount * 0.30;

      // Level 3 = 20% of 80%
      const managerManagerAmount = distributableAmount * 0.20;

      // Missing manager levels go to company.
      if (!manager) {
        companyAmount += managerAmount;
      }

      if (!managerManager) {
        companyAmount += managerManagerAmount;
      }

      // --------------------------------------------------
      // 5. Prepare ledger entries
      // --------------------------------------------------
      const commissions: {
        leadId: string;
        userId: string | null;
        type: "COMPANY" | "AGENT" | "MANAGER" | "MANAGERS_MANAGER";
        amount: number;
      }[] = [
        {
          leadId: lead.id,
          userId: null,
          type: "COMPANY" as const,
          amount: companyAmount,
        },
        {
          leadId: lead.id,
          userId: agent.id,
          type: "AGENT" as const,
          amount: agentAmount,
        },
      ];

      if (manager) {
        commissions.push({
          leadId: lead.id,
          userId: manager.id,
          type: "MANAGER" as const,
          amount: managerAmount,
        });
      }

      if (managerManager) {
        commissions.push({
          leadId: lead.id,
          userId: managerManager.id,
          type: "MANAGERS_MANAGER" as const,
          amount: managerManagerAmount,
        });
      }

      // --------------------------------------------------
      // 6. Insert commission ledger
      // --------------------------------------------------
      await tx.commissionLedger.createMany({
        data: commissions,
      });

      return {
        leadId: lead.id,
        revenue,
        commissions,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "LEAD_NOT_FOUND") {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    if (error.message === "LEAD_NOT_ASSIGNED") {
      return NextResponse.json(
        { error: "Lead is not assigned to an agent" },
        { status: 400 }
      );
    }

    if (error.message === "LEAD_ALREADY_CLOSED") {
      return NextResponse.json(
        { error: "Lead is already closed" },
        { status: 409 }
      );
    }

    console.error("Close lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}