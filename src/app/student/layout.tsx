
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, CreditCard, LayoutDashboard, GraduationCap, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";


export default function StudentAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (pathname !== '/student/login') {
          router.push('/student/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push('/student/login'); 
    } catch (error) {
        console.error("Error signing out: ", error);
        toast({ title: "Logout Failed", description: "An error occurred while signing out.", variant: "destructive" });
    }
  };
  
  const isLoginPage = pathname === '/student/login';

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <Link href="/student/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <TeachHubLogo className="h-7 w-7" />
            <h1 className="text-xl font-headline font-semibold">Student Portal</h1>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-1">
            <Button variant="ghost" size="sm" asChild className={pathname === "/student/dashboard" ? "bg-muted" : ""}>
              <Link href="/student/dashboard"><LayoutDashboard className="mr-1.5 h-5 w-5"/> Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={pathname.startsWith("/student/academic-record") ? "bg-muted" : ""}>
              <Link href="/student/academic-record"><GraduationCap className="mr-1.5 h-5 w-5"/> Academic Record</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={pathname.startsWith("/student/finance") ? "bg-muted" : ""}>
              <Link href="/student/finance"><CreditCard className="mr-1.5 h-5 w-5"/> My Finances</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={pathname.startsWith("/student/profile") ? "bg-muted" : ""}>
              <Link href="/student/profile"><UserCircle className="mr-1.5 h-5 w-5"/> My Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-5 w-5"/> Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
       {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} TeachHub Student Portal.
          </p>
        </div>
      </footer>
    </div>
  );
}
