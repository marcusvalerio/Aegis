import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { NavLink } from "@/components/admin/NavLink";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  AlertTriangle,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { href: "/admin/empilhadeiras", label: "Empilhadeiras", icon: <Truck size={16} aria-hidden="true" /> },
  { href: "/admin/checklists", label: "Checklists", icon: <ClipboardList size={16} aria-hidden="true" /> },
  { href: "/admin/nao-conformidades", label: "Não conformidades", icon: <AlertTriangle size={16} aria-hidden="true" /> },
  { href: "/admin/checklist-config", label: "Config. checklist", icon: <Settings size={16} aria-hidden="true" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/operador");

  return (
    <div className="flex min-h-screen flex-col bg-tan md:flex-row">
      <aside className="hidden w-60 flex-col border-r border-black/10 bg-black text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <span className="font-display text-lg font-extrabold uppercase tracking-tight">Aegis</span>
          <p className="font-aux text-[10px] uppercase tracking-widest text-white/40">Administração</p>
        </div>
        <nav aria-label="Navegação administrativa" className="flex-1 px-2 py-4">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
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

      <header className="flex items-center justify-between border-b border-black/10 bg-black px-4 py-3 text-white md:hidden">
        <span className="font-display text-sm font-extrabold uppercase tracking-tight">Aegis</span>
        <form action={logoutAction}>
          <button className="font-aux text-[11px] font-semibold uppercase tracking-wide text-white/50 hover:text-yellow">
            Sair
          </button>
        </form>
      </header>
      <nav
        aria-label="Navegação administrativa"
        className="flex overflow-x-auto border-b border-black/10 bg-white md:hidden"
      >
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} variant="tab" />
        ))}
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  );
}
