
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeachHubLogo } from '@/components/icons/TeachHubLogo';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))] p-4">
      <main className="text-center space-y-10 flex flex-col items-center">
        <div className="flex items-center gap-4 animate-fade-in-down delay-200">
          <TeachHubLogo className="h-20 w-20 text-primary" />
          <h1 className="text-6xl font-headline font-bold text-primary tracking-tight">
            TeachHub
          </h1>
        </div>
        <p className="text-2xl text-foreground max-w-3xl leading-relaxed animate-fade-in-up delay-500">
          Streamlining educational management for trainers, administrators, and departmental heads.
          Access your dedicated portal to manage your tasks efficiently and effectively.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 w-full max-w-md animate-fade-in-up delay-700">
          <Link href="/trainer/dashboard" passHref>
            <Button size="lg" className="w-full text-lg py-8 rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              Trainer Portal
            </Button>
          </Link>
          <Link href="/management/dashboard" passHref>
            <Button size="lg" variant="secondary" className="w-full text-lg py-8 rounded-xl shadow-lg hover:shadow-accent/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              Management Portal
            </Button>
          </Link>
        </div>
      </main>
       <footer className="absolute bottom-6 text-center text-muted-foreground text-sm animate-fade-in delay-1000">
        © {new Date().getFullYear()} TeachHub. All rights reserved.
      </footer>
    </div>
  );
}
