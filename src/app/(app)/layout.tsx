
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserCircle2, CalendarDays, BookOpenText, Bell, Settings } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/profile", icon: <UserCircle2 />, label: "Profile", tooltip: "Trainer Profile" },
  { href: "/schedule", icon: <CalendarDays />, label: "Class Schedule", tooltip: "Class Scheduling" },
  { href: "/lesson-plans", icon: <BookOpenText />, label: "Lesson Plans", tooltip: "Lesson Planning" },
  { href: "/notifications", icon: <Bell />, label: "Notifications", tooltip: "Notifications & Reminders" },
];

// New component to conditionally render the title
function AppSpecificSidebarTitle() {
  const { isMobile } = useSidebar();

  const titleElement = (
    <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">TeachHub</h1>
  );

  if (isMobile) {
    return <SheetTitle asChild>{titleElement}</SheetTitle>;
  }
  return titleElement;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="inset" collapsible="icon" className="shadow-lg">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/80 transition-colors">
              <TeachHubLogo className="h-8 w-8" />
              <AppSpecificSidebarTitle /> {/* Use the conditional title component */}
            </Link>
            <div className="ml-auto group-data-[collapsible=icon]:hidden">
               <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full">
            <SidebarMenu className="p-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                      tooltip={item.tooltip}
                      className={cn(
                        "justify-start",
                        (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        {/* <SidebarFooter className="p-2 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings />
            <span className="group-data-[collapsible=icon]:hidden">Settings</span>
          </Button>
        </SidebarFooter> */}
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <div className="md:hidden p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary">
              <TeachHubLogo className="h-7 w-7" />
              <h1 className="text-lg font-headline font-semibold">TeachHub</h1>
            </Link>
            <SidebarTrigger />
        </div>
        <main className="p-4 md:p-8">
         {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
