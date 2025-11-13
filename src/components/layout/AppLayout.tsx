"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TerminalSquare } from "lucide-react";

import { tools } from "@/config/tools";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <TerminalSquare className="size-7 text-primary" />
            <span className="font-bold text-lg text-primary font-headline">
              CyberTrace
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {tools.map((tool) => (
              <SidebarMenuItem key={tool.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === tool.href}
                  tooltip={{
                    children: tool.name,
                    className: "bg-card border-border text-foreground font-semibold"
                  }}
                >
                  <Link href={tool.href}>
                    <tool.icon />
                    <span>{tool.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center border-b px-4 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2 font-bold ml-4">
            <TerminalSquare className="size-6 text-primary" />
            <span className="font-headline text-primary">CyberTrace</span>
          </Link>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
