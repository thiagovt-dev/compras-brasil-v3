"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TenderNavigationProps {
  tenderId: string;
}

export function TenderNavigation({ tenderId }: TenderNavigationProps) {
  const pathname = usePathname();

  const links = [
    {
      href: `/tenders/${tenderId}`,
      label: "Visão Geral",
    },
    {
      href: `/tenders/${tenderId}/lots`,
      label: "Lotes",
    },
    {
      href: `/tenders/${tenderId}/documents`,
      label: "Documentos",
    },
    {
      href: `/tenders/${tenderId}/clarifications`,
      label: "Esclarecimentos",
    },
    {
      href: `/tenders/${tenderId}/impugnations`,
      label: "Impugnações",
    },
    {
      href: `/tenders/${tenderId}/session`,
      label: "Sessão Pública",
    },
  ];

  return (
    <nav className="flex overflow-x-auto pb-2">
      <div className="flex space-x-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 text-[1rem] font-medium rounded-md transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
