import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  AlertTriangle,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/empilhadeiras", label: "Empilhadeiras", icon: Truck },
  { href: "/admin/checklists", label: "Checklists", icon: ClipboardList },
  { href: "/admin/nao-conformidades", label: "Não conformidades", icon: AlertTriangle },
  { href: "/admin/checklist-config", label: "Config. checklist", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/operador");

  return (
    <div className="flex min-h-screen bg-tan">
      <aside className="hidden w-60 flex-col border-r border-black/10 bg-black text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <span className="font-display text-lg font-extrabold uppercase tracking-tight">Aegis</span>
          <p className="font-aux text-[10px] uppercase tracking-widest text-white/40">Administração</p>
        </div>
        <nav className="flex-1 px-2 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 font-aux text-sm text-white/70 hover:bg-white/5 hover:text-yellow"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="font-aux text-xs text-white/60">{session.user.name}</p>
          <form action={logoutAction}>
            <button className="mt-1 font-aux text-[11px] font-semibold uppercase tracking-wide text-white/40 hover:text-yellow">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
