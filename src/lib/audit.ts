import { db } from "@/lib/db";

export async function logAudit(params: {
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes?: unknown;
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changes: params.changes ? JSON.stringify(params.changes) : null,
    },
  });
}
