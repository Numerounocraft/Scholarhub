"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "Content",
    items: [
      { label: "Scholarships", href: "/admin" },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Branding", href: "/admin/brand" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-5">
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {section}
          </p>
          <ul className="flex flex-col gap-0.5">
            {items.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                    isActive(href)
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
