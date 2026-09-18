import { cuid } from "@/lib/cuid";
import { db } from "@/lib/db";
import type { ChecklistSnapshot, RequiresPhoto, Severity, SnapshotCategory } from "@/lib/types";

/**
 * Assembles the checklist a given forklift is subject to right now:
 * base items (appliesToAllTypes && appliesToAllEnergies) + items scoped to
 * its forklift type + items scoped to its energy type + custom company items
 * that were linked the same way. This is the single source of truth for
 * "checklist base + tipo + energia + personalizacoes".
 */
export async function assembleChecklistForForklift(forkliftId: string, organizationId: string): Promise<ChecklistSnapshot> {
  const forklift = await db.forklift.findFirstOrThrow({
    where: { id: forkliftId, organizationId },
    include: { forkliftType: true, energyType: true },
  });

  const categories = await db.checklistCategory.findMany({
    where: { active: true, OR: [{ organizationId: null }, { organizationId }] },
    orderBy: { order: "asc" },
    include: {
      items: {
        where: { active: true, OR: [{ organizationId: null }, { organizationId }] },
        orderBy: { order: "asc" },
        include: { typeLinks: true, energyLinks: true },
      },
    },
  });

  const snapshotCategories: SnapshotCategory[] = [];

  for (const category of categories) {
    const applicableItems = category.items.filter((item) => {
      const typeOk =
        item.appliesToAllTypes ||
        item.typeLinks.some((l) => l.forkliftTypeId === forklift.forkliftTypeId);
      const energyOk =
        item.appliesToAllEnergies ||
        item.energyLinks.some((l) => l.energyTypeId === forklift.energyTypeId);
      return typeOk && energyOk;
    });

    if (applicableItems.length === 0) continue;

    snapshotCategories.push({
      categoryId: category.id,
      name: category.name,
      order: category.order,
      items: applicableItems.map((item) => ({
        snapshotItemId: cuid(),
        sourceItemId: item.id,
        label: item.label,
        question: item.question,
        order: item.order,
        requiresPhoto: item.requiresPhoto as RequiresPhoto,
        requiresNote: item.requiresNote,
        defaultSeverity: item.defaultSeverity as Severity,
      })),
    });
  }

  return {
    assembledAt: new Date().toISOString(),
    forkliftId: forklift.id,
    forkliftCode: forklift.code,
    forkliftTypeName: forklift.forkliftType.name,
    energyTypeName: forklift.energyType.name,
    categories: snapshotCategories,
  };
}

export function countSnapshotItems(snapshot: ChecklistSnapshot): number {
  return snapshot.categories.reduce((sum, c) => sum + c.items.length, 0);
}

export async function startChecklist(forkliftId: string, operatorId: string, organizationId: string) {
  const snapshot = await assembleChecklistForForklift(forkliftId, organizationId);
  const forklift = await db.forklift.findFirstOrThrow({ where: { id: forkliftId, organizationId } });

  const checklist = await db.checklist.create({
    data: {
      organizationId,
      forkliftId,
      operatorId,
      hourmeter: forklift.hourmeter,
      status: "EM_ANDAMENTO",
      templateSnapshot: JSON.stringify(snapshot),
      totalItems: countSnapshotItems(snapshot),
    },
  });

  return { checklist, snapshot };
}

export function getSnapshot(checklist: { templateSnapshot: string }): ChecklistSnapshot {
  return JSON.parse(checklist.templateSnapshot) as ChecklistSnapshot;
}
