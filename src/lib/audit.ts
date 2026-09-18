import { db } from "@/lib/db";

export async function logAudit(params: {
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes?: unknown;
}) {
  if (!params.userId) throw new Error("Usuário obrigatório para auditoria.");
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) throw new Error("Contexto de empresa não encontrado para auditoria.");

  await db.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changes: params.changes ? JSON.stringify(params.changes) : null,
    },
  });
}
