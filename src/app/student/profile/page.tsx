
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, Edit3, Briefcase, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getStudentProfile, updateStudentProfile } from "./actions";

// Using a mock ID for the "logged in" student for this prototype phase
const MOCK_LOGGED_IN_STUDENT_ID = "studentAlexDemo"; 

const studentProfileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  admissionNumber: z.string().min(3, { message: "Admission number is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  course: z.string().min(3, "Course name is required."),
  yearOfStudy: z.string().min(1, "Year of study is required."),
  bio: z.string().optional(),
  profilePicUrl: z.string().url().optional().or(z.literal('')),
  careerAspirations: z.string().optional(),
});

type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;


export default function StudentProfilePage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  const form = useForm<StudentProfileFormValues>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {}, // Will be populated from Firestore
    mode: "onChange",
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const profileData = await getStudentProfile(MOCK_LOGGED_IN_STUDENT_ID);
      if (profileData) {
        form.reset(profileData);
        if (profileData.profilePicUrl) {
            setProfilePicPreview(profileData.profilePicUrl);
        }
      } else {
        toast({ title: "Profile Not Found", description: "Could not load your profile data.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to load profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);


  useEffect(() => {
    setIsClient(true);
    if (isClient) {
        fetchProfile();
    }
  }, [isClient, fetchProfile]);


  async function onSubmit(data: StudentProfileFormValues) {
    try {
      const result = await updateStudentProfile(MOCK_LOGGED_IN_STUDENT_ID, data);
      if(result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated.",
          action: <CheckCircle className="text-green-500" />,
        });
      } else {
        toast({ title: "Update Failed", description: result.message, variant: "destructive"});
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive"});
    }
  }

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfilePicPreview(dataUrl);
        // This is a mock. In a real app, you would upload the file to Firebase Storage
        // and save the URL. For now, we'll just save the data URL (which is very long and inefficient).
        form.setValue("profilePicUrl", dataUrl, { shouldValidate: true, shouldDirty: true }); 
        toast({title: "Image Preview Updated", description: "Note: In a real app, this would be uploaded. Saving now will store a temporary version."});
      };
      reader.readAsDataURL(file);
    }
  };


  if (!isClient || isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeader title="My Profile" description="View and update your personal details." />
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-8 w-1/3 bg-muted rounded"></div>
            <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
                <div className="h-32 w-32 bg-muted rounded-full"></div>
            </div>
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-20 bg-muted rounded w-full"></div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-primary/50 rounded w-24"></div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="View and update your personal details and academic information." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline flex items-center text-primary"><Edit3 className="mr-2 h-6 w-6"/>Edit Your Profile</CardTitle>
              <CardDescription>Keep your information up-to-date to help us support your learning journey.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 mb-6">
                <Image
                  src={profilePicPreview || "https://placehold.co/150x150.png"}
                  alt="Profile"
                  width={150}
                  height={150}
                  className="rounded-full border-4 border-primary shadow-md object-cover"
                  data-ai-hint="student headshot"
                />
                <FormField
                  control={form.control}
                  name="profilePicUrl"
                  render={({ field }) => ( 
                    <FormItem className="w-full max-w-xs">
                      <FormLabel htmlFor="profilePicUpload" className="sr-only">Upload Profile Picture</FormLabel>
                      <FormControl>
                        <Input 
                          id="profilePicUpload"
                          type="file" 
                          accept="image/*" 
                          onChange={handleProfilePicChange} 
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </FormControl>
                      <FormDescription className="text-center">Upload a new profile picture (mock).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="admissionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl><Input placeholder="Your admission number" {...field} readOnly /></FormControl>
                       <FormDescription>This field is not editable.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="Your email address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl><Input type="tel" placeholder="Your phone number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Course</FormLabel>
                      <FormControl><Input placeholder="Your registered course" {...field} readOnly /></FormControl>
                      <FormDescription>Course information is managed by administration.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Year/Level of Study</FormLabel>
                      <FormControl><Input placeholder="Your current year/level" {...field} readOnly /></FormControl>
                       <FormDescription>Academic progression is updated by administration.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a bit about yourself, your interests, or academic goals..."
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
                name="careerAspirations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground"/>Career Aspirations (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are your career goals? Which industries or roles are you interested in?"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Sharing your aspirations can help us guide you better.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
