"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }

  // auth() here would read the request's original (pre-login) cookies, not
  // the session signIn() just issued, so we resolve the role directly.
  const user = await db.user.findUnique({ where: { email } });
  redirect(user?.role === "ADMIN" ? "/admin" : "/operador");
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
