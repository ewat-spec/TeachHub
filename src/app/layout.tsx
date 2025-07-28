import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PerformanceProvider } from "@/components/providers/PerformanceProvider";

export const metadata: Metadata = {
  title: 'TeachHub - Educational Management Platform',
  description: 'Streamlining educational management for trainers, students, and administrators. AI-powered lesson planning, performance analytics, and comprehensive academic tools.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://teachhub.com'),
  openGraph: {
    title: 'TeachHub - Educational Management Platform',
    description: 'Streamlining educational management for trainers, students, and administrators.',
    url: 'https://teachhub.com',
    siteName: 'TeachHub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeachHub - Educational Management Platform',
    description: 'Streamlining educational management for trainers, students, and administrators.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#4A6FA5" />
      </head>
      <body className="font-body antialiased">
        <PerformanceProvider>
          <ErrorBoundary>
            {children}
            <Toaster />
          </ErrorBoundary>
        </PerformanceProvider>
      </body>
    </html>
  );
}
