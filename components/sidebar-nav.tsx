"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"

interface SidebarNavProps {
  items: {
    title: string
    href: string
    icon: LucideIcon
  }[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 font-normal",
                  pathname === item.href
                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    : "hover:bg-gray-100",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
}
