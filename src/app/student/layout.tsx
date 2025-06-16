
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter for logout

export default function StudentAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); // For logout

  // Mock logout function
  const handleLogout = () => {
    // In a real app, this would clear session, cookies, context, etc.
    // For prototype, just navigate to login.
    router.push('/student/login'); 
  };
  
  // A very simple header for the student portal
  const showHeader = pathname !== '/student/login'; // Don't show header on login page

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <Link href="/student/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <TeachHubLogo className="h-7 w-7" />
              <h1 className="text-xl font-headline font-semibold">Student Portal</h1>
            </Link>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <nav className="flex items-center space-x-1">
                {/* Future student nav items can go here */}
                 <Button variant="ghost" size="sm" onClick={() => router.push('/student/profile')}> {/* Placeholder profile */}
                  <UserCircle className="mr-2 h-5 w-5"/> My Profile (Mock)
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5"/> Logout
                </Button>
              </nav>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 container mx-auto p-4 md:p-8">
       {children}
      </main>
      {showHeader && (
         <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} TeachHub Student Portal.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
