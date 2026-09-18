"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { logAudit } from "@/lib/audit";

export async function createCategoryAction(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Informe o nome da categoria.");

  const count = await db.checklistCategory.count({ where: { organizationId: session.user.organizationId } });
  const category = await db.checklistCategory.create({
    data: { organizationId: session.user.organizationId, name, order: count },
  });

  await logAudit({
    userId: session.user.id,
    entityType: "ChecklistCategory",
    entityId: category.id,
    action: "CREATE",
    changes: { name },
  });

  revalidatePath("/admin/checklist-config");
}

export async function toggleCategoryActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();
  const category = await db.checklistCategory.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!category) throw new Error("Categoria personalizada não encontrada.");
  await db.checklistCategory.update({ where: { id }, data: { active } });
  await logAudit({
    userId: session.user.id,
    entityType: "ChecklistCategory",
    entityId: id,
    action: active ? "ACTIVATE" : "DEACTIVATE",
  });
  revalidatePath("/admin/checklist-config");
}

export async function createItemAction(formData: FormData) {
  const session = await requireAdmin();

  const categoryId = String(formData.get("categoryId"));
  const label = String(formData.get("label") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const requiresPhoto = String(formData.get("requiresPhoto") ?? "OPCIONAL");
  const requiresNote = formData.get("requiresNote") === "on";
  const defaultSeverity = String(formData.get("defaultSeverity") ?? "MEDIA");
  const forkliftTypeIds = formData.getAll("forkliftTypeIds").map(String);
  const energyTypeIds = formData.getAll("energyTypeIds").map(String);
  const appliesToAllTypes = forkliftTypeIds.length === 0;
  const appliesToAllEnergies = energyTypeIds.length === 0;

  if (!categoryId || !label || !question) {
    throw new Error("Preencha categoria, rótulo e pergunta.");
  }

  const category = await db.checklistCategory.findFirst({ where: { id: categoryId, OR: [{ organizationId: null }, { organizationId: session.user.organizationId }] } });
  if (!category) throw new Error("Categoria não encontrada.");
  const count = await db.checklistItem.count({ where: { categoryId, OR: [{ organizationId: null }, { organizationId: session.user.organizationId }] } });

  const item = await db.checklistItem.create({
    data: {
      organizationId: session.user.organizationId,
      categoryId,
      label,
      question,
      order: count,
      requiresPhoto,
      requiresNote,
      defaultSeverity,
      appliesToAllTypes,
      appliesToAllEnergies,
      createdById: session.user.id,
      updatedById: session.user.id,
      typeLinks: appliesToAllTypes
        ? undefined
        : { create: forkliftTypeIds.map((forkliftTypeId) => ({ forkliftTypeId })) },
      energyLinks: appliesToAllEnergies
        ? undefined
        : { create: energyTypeIds.map((energyTypeId) => ({ energyTypeId })) },
    },
  });

  await logAudit({
    userId: session.user.id,
    entityType: "ChecklistItem",
    entityId: item.id,
    action: "CREATE",
    changes: { label, question, forkliftTypeIds, energyTypeIds },
  });

  revalidatePath("/admin/checklist-config");
}

export async function toggleItemActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();
  const item = await db.checklistItem.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!item) throw new Error("Item personalizado não encontrado.");
  await db.checklistItem.update({
    where: { id },
    data: { active, updatedById: session.user.id },
  });
  await logAudit({
    userId: session.user.id,
    entityType: "ChecklistItem",
    entityId: id,
    action: active ? "ACTIVATE" : "DEACTIVATE",
  });
  revalidatePath("/admin/checklist-config");
}
