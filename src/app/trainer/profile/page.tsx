
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription as ShadCNCardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  department: z.string().optional(),
  cv: z.string().min(10, { message: "CV summary must be at least 10 characters." }).optional(),
  skills: z.string().min(5, { message: "Skills must be at least 5 characters." }).optional(),
  expertise: z.string().min(5, { message: "Areas of expertise must be at least 5 characters." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  department: "Academic Department Placeholder",
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
            <ShadCNCardDescription>Keep your information current to ensure accurate records.</ShadCNCardDescription>
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
              <ShadCNCardDescription>Keep your information current to ensure accurate records.</ShadCNCardDescription>
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your department" {...field} />
                    </FormControl>
                     <FormDescription>The department you belong to or report to.</FormDescription>
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
