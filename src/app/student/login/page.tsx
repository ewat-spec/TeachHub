
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { LogIn, GraduationCap } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";

const studentLoginFormSchema = z.object({
  admissionNumber: z.string().min(3, { message: "Admission number must be at least 3 characters." }),
  course: z.string().min(1, { message: "Please select your course." }),
  yearOfStudy: z.string().min(1, { message: "Please select your year of study." }),
});

type StudentLoginFormValues = z.infer<typeof studentLoginFormSchema>;

const mockCourses = [
  { id: "course1", name: "Automotive Engineering" },
  { id: "course2", name: "Electrical Engineering" },
  { id: "course3", name: "Plumbing and Pipefitting" },
  { id: "course4", name: "ICT Technician" },
];

const mockYears = ["Year 1", "Year 2", "Year 3", "Year 4", "Intermediate", "Advanced"];

export default function StudentLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginFormSchema),
    defaultValues: { admissionNumber: "", course: "", yearOfStudy: "" },
    mode: "onChange",
  });

  // Mock login: For prototype, just navigates to dashboard.
  // In a real app, this would involve an API call for authentication.
  async function onSubmit(data: StudentLoginFormValues) {
    toast({
      title: "Login Attempt (Mock)",
      description: `Simulating login for ${data.admissionNumber}. Redirecting...`,
    });
    // In a real app, you'd pass student data to the dashboard, perhaps via context or query params after auth.
    // For this prototype, we'll just redirect. The dashboard will use mock data.
    router.push('/student/dashboard');
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-2xl animate-pulse">
          <CardHeader className="space-y-2 text-center">
            <div className="h-8 w-3/4 mx-auto bg-muted rounded"></div>
            <div className="h-4 w-1/2 mx-auto bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-12 bg-primary/50 rounded mt-4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--secondary))]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center items-center gap-2 mb-4">
            <TeachHubLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-headline">Student Portal</CardTitle>
          </div>
          <CardDescription>Please enter your details to access your dashboard.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="admissionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Number</FormLabel>
                    <FormControl><Input placeholder="e.g., SCT221-0001/2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCourses.map(course => (
                          <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study / Level</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your year/level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <LogIn className="mr-2 h-5 w-5" />
                {form.formState.isSubmitting ? "Logging In..." : "Login to Dashboard"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TeachHub. For demonstration purposes only.
      </p>
    </div>
  );
}
