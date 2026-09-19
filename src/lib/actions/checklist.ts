"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startChecklist, getSnapshot } from "@/lib/checklist-engine";
import { computeForkliftStatus } from "@/lib/status-engine";
import { saveUploadedPhoto } from "@/lib/uploads";
import { logAudit } from "@/lib/audit";
import type { AnswerValue, Severity } from "@/lib/types";

async function requireOperatorSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function startChecklistAction(forkliftId: string) {
  const session = await requireOperatorSession();

  const forklift = await db.forklift.findFirst({ where: { id: forkliftId, organizationId: session.user.organizationId } });
  if (!forklift || !forklift.active) {
    throw new Error("Empilhadeira não encontrada ou inativa.");
  }

  const existing = await db.checklist.findFirst({
    where: { forkliftId, operatorId: session.user.id, organizationId: session.user.organizationId, status: "EM_ANDAMENTO" },
  });

  const { checklist } = existing
    ? { checklist: existing }
    : await startChecklist(forkliftId, session.user.id, session.user.organizationId);

  redirect(`/operador/checklist/${checklist.id}`);
}

export async function answerItemAction(input: {
  checklistId: string;
  snapshotItemId: string;
  categoryName: string;
  itemLabel: string;
  question: string;
  answer: AnswerValue;
}) {
  const session = await requireOperatorSession();

  const checklist = await db.checklist.findFirst({ where: { id: input.checklistId, operatorId: session.user.id, organizationId: session.user.organizationId } });
  if (!checklist) {
    throw new Error("Checklist não encontrado.");
  }
  if (checklist.status !== "EM_ANDAMENTO") {
    throw new Error("Checklist já finalizado.");
  }

  const answer = await db.checklistAnswer.upsert({
    where: {
      checklistId_snapshotItemId: {
        checklistId: input.checklistId,
        snapshotItemId: input.snapshotItemId,
      },
    },
    update: { answer: input.answer, answeredAt: new Date() },
    create: {
      checklistId: input.checklistId,
      snapshotItemId: input.snapshotItemId,
      categoryName: input.categoryName,
      itemLabel: input.itemLabel,
      question: input.question,
      answer: input.answer,
    },
  });

  // If the operator changed their mind away from NAO_CONFORME, drop the NC record.
  if (input.answer !== "NAO_CONFORME") {
    await db.nonConformity.deleteMany({ where: { answerId: answer.id } });
  }

  revalidatePath(`/operador/checklist/${input.checklistId}`);
  return { answerId: answer.id };
}

export async function registerNonConformityAction(formData: FormData) {
  const session = await requireOperatorSession();

  const checklistId = String(formData.get("checklistId"));
  const answerId = String(formData.get("answerId"));
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity")) as Severity;
  const photo = formData.get("photo") as File | null;

  const checklist = await db.checklist.findFirst({ where: { id: checklistId, operatorId: session.user.id, organizationId: session.user.organizationId } });
  if (!checklist) {
    throw new Error("Checklist não encontrado.");
  }

  const answer = await db.checklistAnswer.findUnique({ where: { id: answerId } });
  if (!answer || answer.checklistId !== checklistId) {
    throw new Error("Item não encontrado.");
  }

  if (!description) {
    throw new Error("Descreva o problema encontrado.");
  }

  const nc = await db.nonConformity.upsert({
    where: { answerId },
    update: { description, severity },
    create: {
      organizationId: session.user.organizationId,
      checklistId,
      answerId,
      forkliftId: checklist.forkliftId,
      itemLabel: answer.itemLabel,
      description,
      severity,
    },
  });

  if (photo && photo.size > 0) {
    const url = await saveUploadedPhoto(photo, session.user.organizationId);
    await db.attachment.create({ data: { nonConformityId: nc.id, url } });
  }

  revalidatePath(`/operador/checklist/${checklistId}`);
  return { nonConformityId: nc.id };
}

export async function finalizeChecklistAction(checklistId: string) {
  const session = await requireOperatorSession();

  const checklist = await db.checklist.findFirst({
    where: { id: checklistId, operatorId: session.user.id, organizationId: session.user.organizationId },
    include: { answers: { include: { nonConformity: true } } },
  });
  if (!checklist || checklist.operatorId !== session.user.id) {
    throw new Error("Checklist não encontrado.");
  }
  if (checklist.status === "CONCLUIDO") {
    redirect(`/operador/checklist/${checklistId}/resultado`);
  }

  const snapshot = getSnapshot(checklist);
  const totalItems = snapshot.categories.reduce((sum, c) => sum + c.items.length, 0);

  if (checklist.answers.length < totalItems) {
    throw new Error("Responda todos os itens antes de finalizar.");
  }

  const conformCount = checklist.answers.filter((a) => a.answer === "CONFORME").length;
  const naCount = checklist.answers.filter((a) => a.answer === "NA").length;
  const nonConformAnswers = checklist.answers.filter((a) => a.answer === "NAO_CONFORME");
  const nonConformCount = nonConformAnswers.length;

  const severities = nonConformAnswers
    .map((a) => a.nonConformity?.severity)
    .filter((s): s is Severity => Boolean(s));

  const resultStatus = await computeForkliftStatus(severities);

  await db.$transaction([
    db.checklist.update({
      where: { id: checklistId },
      data: {
        status: "CONCLUIDO",
        finishedAt: new Date(),
        resultStatus,
        totalItems,
        conformCount,
        nonConformCount,
        naCount,
      },
    }),
    db.forklift.update({ where: { id: checklist.forkliftId }, data: { status: resultStatus } }),
  ]);

  for (const nc of nonConformAnswers) {
    if (nc.nonConformity && (nc.nonConformity.severity === "ALTA" || nc.nonConformity.severity === "CRITICA")) {
      await db.maintenanceOccurrence.create({
        data: {
          organizationId: session.user.organizationId,
          forkliftId: checklist.forkliftId,
          nonConformityId: nc.nonConformity.id,
          description: `Ocorrência gerada automaticamente: ${nc.nonConformity.description}`,
        },
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    entityType: "Checklist",
    entityId: checklistId,
    action: "FINALIZE",
    changes: { resultStatus, conformCount, nonConformCount, naCount },
  });

  revalidatePath("/admin");
  redirect(`/operador/checklist/${checklistId}/resultado`);
}
