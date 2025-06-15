"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  cv: z.string().min(10, { message: "CV summary must be at least 10 characters." }).optional(),
  skills: z.string().min(5, { message: "Skills must be at least 5 characters." }).optional(),
  expertise: z.string().min(5, { message: "Areas of expertise must be at least 5 characters." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mock user data - in a real app, this would come from an API or auth context
const defaultValues: Partial<ProfileFormValues> = {
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  cv: "Experienced corporate trainer with 10+ years in leadership development and soft skills training. Proven ability to design and deliver engaging workshops.",
  skills: "Curriculum Design, Public Speaking, Workshop Facilitation, E-learning Development, Coaching",
  expertise: "Leadership, Communication, Team Building, Conflict Resolution, Time Management",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Profile data submitted:", data);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
      action: <CheckCircle className="text-green-500" />,
    });
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Update your personal and professional information." />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Profile Details</CardTitle>
            <CardDescription>Keep your information current to ensure accurate records.</CardDescription>
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded w-full"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-muted rounded w-24"></div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Update your personal and professional information." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Profile Details</CardTitle>
              <CardDescription>Keep your information current to ensure accurate records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CV / Bio Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summarize your CV or professional bio..."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {/* For a real CV upload, you'd use a file input component.
               <FormItem>
                <FormLabel>Upload CV (PDF, DOCX)</FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf,.doc,.docx" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                </FormControl>
                <FormMessage />
              </FormItem> 
              */}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List your key skills, separated by commas (e.g., Python, Project Management, Public Speaking)"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas of Expertise</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your main areas of expertise (e.g., Software Development, Agile Methodologies, Leadership Training)"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
