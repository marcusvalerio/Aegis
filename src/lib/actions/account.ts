"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_PASSWORD_LENGTH = 12;

/**
 * Lets an authenticated ADMIN change their own password. Deliberately
 * scoped to session.user.id only — there is no way to pass a target user
 * id in, so this action can never touch another account's credentials.
 */
export async function changeOwnPasswordAction(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Preencha todos os campos." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (newPassword !== confirmPassword) {
    return { error: "A confirmação não coincide com a nova senha." };
  }
  if (newPassword === currentPassword) {
    return { error: "A nova senha precisa ser diferente da atual." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Não autorizado." };
  }

  const currentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentValid) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "PASSWORD_CHANGE_SELF",
    },
  });

  return { success: true };
}
