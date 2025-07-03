
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  useSidebar,
  SheetTitle,
} from "@/components/ui/sidebar";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserCircle2, CalendarDays, BookOpenText, Bell, ClipboardCheck, FolderKanban, ClipboardEdit, MessageCircle, BookMarked, Loader2, LogOut } from "lucide-react";

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: "/trainer/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Trainer Dashboard" },
  { href: "/trainer/profile", icon: <UserCircle2 />, label: "My Profile", tooltip: "My Profile" },
  { href: "/trainer/schedule", icon: <CalendarDays />, label: "My Schedule", tooltip: "My Class Schedule" },
  { href: "/trainer/lesson-plans", icon: <BookOpenText />, label: "My Lesson Plans", tooltip: "My Lesson Plans" },
  { href: "/trainer/assessments", icon: <ClipboardCheck />, label: "My Assessments", tooltip: "My Assessments & CATs" },
  { href: "/trainer/class-lists", icon: <BookMarked />, label: "Courses & Grading", tooltip: "Manage Course Resources & Marksheets" },
  { href: "/trainer/portfolios", icon: <FolderKanban />, label: "Student Portfolios", tooltip: "Student Portfolios of Evidence" },
  { href: "/trainer/student-questions", icon: <MessageCircle />, label: "Student Questions", tooltip: "View Questions from Students" },
  { href: "/trainer/notifications", icon: <Bell />, label: "My Notifications", tooltip: "My Notifications" },
];

function AppSpecificSidebarTitle() {
  const { isMobile } = useSidebar();

  const titleElement = (
    <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">TeachHub Trainer</h1>
  );

  if (isMobile) {
    return <SheetTitle asChild>{titleElement}</SheetTitle>;
  }
  return titleElement;
}

function TrainerAppLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push('/trainer/login'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: "An error occurred while signing out.", variant: "destructive" });
    }
  };

  return (
     <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="inset" collapsible="icon" className="shadow-lg">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Link href="/trainer/dashboard" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/80 transition-colors">
              <TeachHubLogo className="h-8 w-8" />
              <AppSpecificSidebarTitle />
            </Link>
            <div className="ml-auto group-data-[collapsible=icon]:hidden">
               <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full">
            <SidebarMenu className="p-2">
              {navItems.sort((a,b) => {
                if (a.label === "My Notifications") return 1;
                if (b.label === "My Notifications") return -1;
                return 0;
              }).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href))}
                      tooltip={item.tooltip}
                      className={cn(
                        "justify-start",
                        (pathname === item.href || (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href)))
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
                <SidebarMenuItem key="logout">
                   <SidebarMenuButton
                      onClick={handleLogout}
                      tooltip="Log Out"
                      className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <div>
                        <LogOut />
                        <span>Logout</span>
                      </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
         <div className="md:hidden p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
            <Link href="/trainer/dashboard" className="flex items-center gap-2 text-primary">
              <TeachHubLogo className="h-7 w-7" />
              <h1 className="text-lg font-headline font-semibold">TeachHub Trainer</h1>
            </Link>
            <SidebarTrigger />
        </div>
        <main className="p-4 md:p-8">
         {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}


export default function TrainerAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (pathname !== '/trainer/login') {
          router.push('/trainer/login');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const isLoginPage = pathname === '/trainer/login';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary"/>
        <p className="ml-4 text-lg text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  if (!user) {
    return null; // Render nothing while redirecting
  }

  return <TrainerAppLayoutContent>{children}</TrainerAppLayoutContent>;
}
