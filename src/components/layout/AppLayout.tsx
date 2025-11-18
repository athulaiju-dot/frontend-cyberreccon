"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TerminalSquare, UserCircle } from "lucide-react";

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
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Render a placeholder on the server and initial client render
  if (!isClient) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <div className="w-[3rem] border-r" />
        <div className="flex-1" />
      </div>
    );
  }

  const imageUrl = "https://images.unsplash.com/photo-1593466511996-856d7aa49857?q=80&w=2070&auto=format&fit=crop";


  return (
    <SidebarProvider>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader 
            className="bg-cover bg-center relative"
            style={{ backgroundImage: `url(${imageUrl})` }}
            data-ai-hint="cyber security"
        >
          <div className="absolute inset-0 bg-black/50 z-0" />
          <div className="relative z-10 w-full">
              <Link href="/" className="flex items-center gap-2.5 px-2">
                <TerminalSquare className="size-7 text-primary" />
                <span className="font-bold text-lg text-primary font-headline">
                  CyberTrace
                </span>
              </Link>
          </div>
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
        <SidebarFooter>
            <SidebarSeparator />
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={{
                        children: "Profile",
                        className: "bg-card border-border text-foreground font-semibold"
                      }}
                    >
                      <Link href="/login">
                        <UserCircle />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header 
          className="flex h-16 items-center border-b px-4 md:hidden bg-cover bg-center relative"
          style={{ backgroundImage: `url(${imageUrl})` }}
          data-ai-hint="cyber security"
        >
          <div className="absolute inset-0 bg-black/50 z-0" />
          <div className="relative z-10 flex items-center w-full">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 font-bold ml-4">
              <TerminalSquare className="size-6 text-primary" />
              <span className="font-headline text-primary">CyberTrace</span>
            </Link>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
