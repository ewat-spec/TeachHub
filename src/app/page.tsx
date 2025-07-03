
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeachHubLogo } from '@/components/icons/TeachHubLogo';
import { GraduationCap, LogIn, Server } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))] p-4">
      <main className="text-center space-y-8 flex flex-col items-center">
        <div className="flex items-center gap-4 animate-fade-in-down delay-200">
          <TeachHubLogo className="h-16 w-16 text-primary" />
          <h1 className="text-5xl font-headline font-bold text-primary tracking-tight">
            TeachHub
          </h1>
        </div>
        <p className="text-xl text-foreground max-w-2xl leading-relaxed animate-fade-in-up delay-500">
          Streamlining educational management for trainers, students, and administrators.
          Access your dedicated portal to manage your tasks efficiently and effectively.
        </p>
        
        <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs animate-fade-in-up delay-700">
          <Link href="/trainer/dashboard" passHref className="w-full">
            <Button size="lg" className="w-full justify-start text-lg py-7 rounded-lg shadow-lg hover:shadow-primary/20 transition-shadow">
              <LogIn className="mr-4 h-5 w-5" /> Trainer Portal
            </Button>
          </Link>
          <Link href="/student" passHref className="w-full">
            <Button size="lg" variant="outline" className="w-full justify-start text-lg py-7 rounded-lg shadow-lg border-border hover:bg-primary/5">
               <GraduationCap className="mr-4 h-5 w-5" /> Student Portal
            </Button>
          </Link>
          <Link href="/management/dashboard" passHref className="w-full">
            <Button size="lg" variant="secondary" className="w-full justify-start text-lg py-7 rounded-lg shadow-lg">
              <Server className="mr-4 h-5 w-5" /> Management Portal
            </Button>
          </Link>
        </div>
      </main>
       <footer className="mt-8 text-center text-muted-foreground text-sm animate-fade-in delay-1000">
        © 2025 TeachHub. All rights reserved.
      </footer>
    </div>
  );
}
