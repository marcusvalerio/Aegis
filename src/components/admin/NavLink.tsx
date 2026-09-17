"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLink({
  href,
  label,
  icon,
  variant = "sidebar",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant?: "sidebar" | "tab";
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 font-aux text-xs font-semibold uppercase tracking-wide",
          isActive ? "border-yellow text-black" : "border-transparent text-black/50",
        )}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 border-l-2 px-3 py-2.5 font-aux text-sm transition-colors",
        isActive
          ? "border-yellow bg-white/5 text-yellow"
          : "border-transparent text-white/70 hover:bg-white/5 hover:text-white",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
