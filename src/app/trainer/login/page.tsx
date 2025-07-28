
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-5 w-5 mr-2">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        <path d="M1 1h22v22H1z" fill="none"></path>
    </svg>
);


export default function TrainerLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Account Created", description: "You have been successfully registered. Please log in." });
        setIsSignUp(false);
        form.reset();
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        router.push('/trainer/dashboard');
      }
    } catch (error: any) {
      logger.error('Email sign-in failed', error, { email: data.email });
      toast({ title: "Authentication Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
      router.push('/trainer/dashboard');
    } catch (error: any) {
      logger.error('Google sign-in failed', error);
      let description = "Could not sign in with Google. Please try another method.";
      if (error.code === 'auth/unauthorized-domain') {
        description = "This app's domain is not authorized for sign-in. Please add it to the authorized domains list in your Firebase Authentication settings.";
      }
      toast({ title: "Google Sign-In Failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <TeachHubLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-headline">Trainer Portal</CardTitle>
          </div>
          <CardDescription>Sign in with your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
              Sign in with Google
            </Button>
            
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-2 text-xs text-muted-foreground">OR</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="trainer@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                {isSignUp ? "Create Account" : "Sign In with Email"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary hover:underline">
                    {isSignUp ? "Sign In" : "Sign Up"}
                </button>
                </p>
            </form>
            </Form>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TeachHub. For demonstration purposes only.
      </p>
    </div>
  );
}
