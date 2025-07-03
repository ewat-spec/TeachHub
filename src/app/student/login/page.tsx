
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, Phone, Mail, Loader2 } from "lucide-react";

// Schemas
const emailSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const phoneSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number with country code (e.g., +2547...)."),
});

const codeSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits."),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;
type CodeFormValues = z.infer<typeof codeSchema>;

// Extend Window interface for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-5 w-5 mr-2">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        <path d="M1 1h22v22H1z" fill="none"></path>
    </svg>
);

export default function StudentLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneFormStep, setPhoneFormStep] = useState<'number' | 'code'>('number');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });
  
  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  // Email form submission
  const onEmailSubmit = async (data: EmailFormValues) => {
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Account Created", description: "You have been successfully registered. Please log in." });
        setIsSignUp(false); // Switch to login view after successful signup
        emailForm.reset();
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      console.error(error.code, error.message);
      toast({ title: "Authentication Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Setup reCAPTCHA verifier
  const setupRecaptcha = () => {
    if (!isClient) return;
    try {
      // Ensure the container is empty before creating a new verifier
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) recaptchaContainer.innerHTML = '';

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, this callback is often used for automatic form submission.
        },
      });
    } catch (error) {
      console.error("Error setting up reCAPTCHA", error);
      toast({title: "reCAPTCHA Error", description: "Could not initialize phone sign-in.", variant: "destructive"});
    }
  };

  useEffect(() => {
    if(isClient) {
      // Setup recaptcha on mount for the phone tab
      setupRecaptcha();
    }
  }, [isClient]);

  // Phone number form submission
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setLoading(true);
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      toast({title: "reCAPTCHA Error", description: "Phone sign-in is not ready. Please refresh.", variant: "destructive"});
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPhoneNumber(auth, data.phoneNumber, appVerifier);
      setConfirmationResult(result);
      setPhoneFormStep('code');
      toast({ title: "Verification Code Sent", description: "Please check your phone for the code." });
    } catch (error: any) {
      console.error("Phone Sign-In Error", error);
      toast({ title: "Failed to Send Code", description: "Please check the phone number and try again. Ensure it includes the country code.", variant: "destructive" });
      // Reset reCAPTCHA on error
      setupRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Verification code form submission
  const onCodeSubmit = async (data: CodeFormValues) => {
    if (!confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(data.code);
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
      router.push('/student/dashboard');
    } catch (error: any) {
      console.error("Code Verification Error", error);
      toast({ title: "Invalid Code", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
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
      router.push('/student/dashboard');
    } catch (error: any) {
      console.error(error.code, error.message);
      toast({ title: "Google Sign-In Failed", description: "Could not sign in with Google. Please try another method.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    // Render a skeleton or loading state on the server
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <TeachHubLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-headline">Student Portal</CardTitle>
          </div>
          <CardDescription>Sign in to access your dashboard.</CardDescription>
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
          
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4"/>Email</TabsTrigger>
              <TabsTrigger value="phone"><Phone className="mr-2 h-4 w-4"/>Phone</TabsTrigger>
            </TabsList>

            {/* Email Tab */}
            <TabsContent value="email">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 mt-4">
                  <FormField control={emailForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="student@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={emailForm.control} name="password" render={({ field }) => (
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
            </TabsContent>
            
            {/* Phone Tab */}
            <TabsContent value="phone">
               {phoneFormStep === 'number' ? (
                 <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 mt-4">
                     <FormField control={phoneForm.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="+254712345678" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                      Send Verification Code
                    </Button>
                  </form>
                 </Form>
               ) : (
                 <Form {...codeForm}>
                  <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4 mt-4">
                    <FormField control={codeForm.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl><Input type="text" placeholder="123456" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                      Verify and Sign In
                    </Button>
                    <Button variant="link" size="sm" onClick={() => setPhoneFormStep('number')} disabled={loading}>Back to phone number entry</Button>
                  </form>
                 </Form>
               )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TeachHub. For demonstration purposes only.
      </p>
    </div>
  );
}
