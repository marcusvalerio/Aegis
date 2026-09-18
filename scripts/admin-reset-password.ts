import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const MIN_PASSWORD_LENGTH = 12;

/**
 * Resets an existing ADMIN's password from an operator-supplied
 * ADMIN_PASSWORD. Never creates a user, never touches any field besides
 * passwordHash, and never logs the password value itself — only bcrypt
 * output (a one-way hash) and non-sensitive identifiers ever reach stdout.
 */
async function main() {
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD não definida. Exemplo: ADMIN_PASSWORD='...' npm run admin:reset-password",
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const target = email
    ? await db.user.findFirst({ where: { email, role: "ADMIN" } })
    : await resolveSingleAdmin();

  if (!target) {
    throw new Error(
      email
        ? `Nenhum usuário ADMIN encontrado com o e-mail "${email}".`
        : "Nenhum usuário ADMIN encontrado.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: target.id },
    data: { passwordHash },
  });

  await db.auditLog.create({
    data: {
      userId: target.id,
      organizationId: target.organizationId,
      entityType: "User",
      entityId: target.id,
      action: "PASSWORD_RESET_CLI",
    },
  });

  console.log(`Senha atualizada para ${target.email} (id: ${target.id}).`);
}

async function resolveSingleAdmin() {
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  if (admins.length > 1) {
    throw new Error(
      `Mais de um usuário ADMIN encontrado (${admins.length}). Defina ADMIN_EMAIL para especificar qual.`,
    );
  }
  return admins[0] ?? null;
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
