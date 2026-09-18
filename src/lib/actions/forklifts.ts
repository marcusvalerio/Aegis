"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { logAudit } from "@/lib/audit";

export async function createForkliftAction(formData: FormData) {
  const session = await requireAdmin();

  const data = {
    code: String(formData.get("code") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    serialNumber: String(formData.get("serialNumber") ?? "").trim() || null,
    forkliftTypeId: String(formData.get("forkliftTypeId")),
    energyTypeId: String(formData.get("energyTypeId")),
    capacityKg: Number(formData.get("capacityKg") ?? 0),
    hourmeter: Number(formData.get("hourmeter") ?? 0),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  if (!data.code || !data.brand || !data.model || !data.forkliftTypeId || !data.energyTypeId) {
    throw new Error("Preencha os campos obrigatórios.");
  }

  const forklift = await db.forklift.create({ data: { ...data, organizationId: session.user.organizationId } });

  await logAudit({
    userId: session.user.id,
    entityType: "Forklift",
    entityId: forklift.id,
    action: "CREATE",
    changes: data,
  });

  revalidatePath("/admin/empilhadeiras");
  redirect("/admin/empilhadeiras");
}

export async function updateForkliftAction(id: string, formData: FormData) {
  const session = await requireAdmin();

  const data = {
    code: String(formData.get("code") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    serialNumber: String(formData.get("serialNumber") ?? "").trim() || null,
    forkliftTypeId: String(formData.get("forkliftTypeId")),
    energyTypeId: String(formData.get("energyTypeId")),
    capacityKg: Number(formData.get("capacityKg") ?? 0),
    hourmeter: Number(formData.get("hourmeter") ?? 0),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    active: formData.get("active") === "on",
  };

  const owned = await db.forklift.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!owned) throw new Error("Empilhadeira não encontrada.");
  await db.forklift.update({ where: { id }, data });

  await logAudit({
    userId: session.user.id,
    entityType: "Forklift",
    entityId: id,
    action: "UPDATE",
    changes: data,
  });

  revalidatePath("/admin/empilhadeiras");
  revalidatePath(`/admin/empilhadeiras/${id}`);
  redirect(`/admin/empilhadeiras/${id}`);
}
