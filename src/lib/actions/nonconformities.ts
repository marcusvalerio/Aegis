"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { logAudit } from "@/lib/audit";
import type { NonConformityStatus } from "@/lib/types";

export async function updateNonConformityStatusAction(
  id: string,
  status: NonConformityStatus,
  resolutionNotes?: string,
) {
  const session = await requireAdmin();

  await db.nonConformity.update({
    where: { id },
    data: {
      status,
      resolutionNotes: resolutionNotes ?? undefined,
      resolvedAt: status === "RESOLVIDA" ? new Date() : null,
      resolvedById: status === "RESOLVIDA" ? session.user.id : null,
    },
  });

  await logAudit({
    userId: session.user.id,
    entityType: "NonConformity",
    entityId: id,
    action: `STATUS_${status}`,
  });

  revalidatePath("/admin/nao-conformidades");
}
