"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/admin-guard";
import { logAudit } from "@/lib/audit";

const MIN_PASSWORD_LENGTH = 12;

export async function createOperatorAction(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) throw new Error("Preencha nome, e-mail e senha.");
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error("A senha precisa ter pelo menos 12 caracteres.");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("Este e-mail já está cadastrado.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      email,
      passwordHash,
      role: "OPERADOR",
      active: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    entityType: "User",
    entityId: user.id,
    action: "CREATE_OPERATOR",
    changes: { name, email, role: "OPERADOR" },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function toggleOperatorActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();
  const user = await db.user.findFirst({
    where: { id, organizationId: session.user.organizationId, role: "OPERADOR" },
  });
  if (!user) throw new Error("Operador não encontrado.");

  await db.user.update({ where: { id }, data: { active } });
  await logAudit({
    userId: session.user.id,
    entityType: "User",
    entityId: id,
    action: active ? "ACTIVATE_OPERATOR" : "DEACTIVATE_OPERATOR",
  });
  revalidatePath("/admin/usuarios");
}
