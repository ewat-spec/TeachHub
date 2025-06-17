
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, Eye, BarChart2, BookOpen, AlertCircle, Brain, Send, Loader2, MessageCircle, UserCircle, Megaphone, Award, Activity, Briefcase, Navigation, Sparkles as SkillsSparkles, CalendarClock, CalendarDays, Clock, CreditCard } from "lucide-react"; // Added CreditCard
import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getAiAcademicHelp, submitStudentQuestionToTrainer } from "./actions";
import type { AskAcademicQuestionOutput } from "@/ai/flows/ask-academic-question-flow";
import { LatexRenderer } from "@/components/common/LatexRenderer";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format, isFuture, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link"; // Added Link

const mockStudent = {
  id: "studentAlexDemo",
  name: "Alex DemoStudent",
  admissionNumber: "SCT221-0077/2024",
  course: "Automotive Engineering",
  yearOfStudy: "Year 2",
  profilePicUrl: "https://placehold.co/120x120.png",
  mockSkills: ["Engine Diagnostics", "CAD Software Basics", "Workshop Safety", "Problem Solving", "Technical Drawing"],
  careerLinks: [
    { title: "Explore Automotive Careers", url: "#" , icon: <Briefcase className="h-4 w-4 mr-2"/> },
    { title: "Latest Auto Industry News", url: "#", icon: <Navigation className="h-4 w-4 mr-2"/> },
    { title: "Professional Certifications Guide", url: "#", icon: <Award className="h-4 w-4 mr-2"/> },
  ]
};

interface MockCourse {
  id: string;
  title: string;
  code: string;
  poeProgress: number;
  credits: number;
  teacher: string;
  poeStatus: string;
  image: string;
  imageHint: string;
  poeDueDate?: string | null; // ISO string for due date
}

const mockCourses: MockCourse[] = [
  { id: "unit1", title: "Engine Systems", code: "AUT201", poeProgress: 75, credits: 15, teacher: "Mr. Harrison", poeStatus: "Partially Submitted", image: "https://placehold.co/600x400.png", imageHint: "engine mechanics repair", poeDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "unit2", title: "Vehicle Electrical Systems", code: "AUT202", poeProgress: 40, credits: 12, teacher: "Ms. Electra", poeStatus: "Pending Submission", image: "https://placehold.co/600x400.png", imageHint: "car electrics circuitry", poeDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "unit3", title: "Workshop Safety & Practice", code: "AUT203", poeProgress: 100, credits: 10, teacher: "Mr. Safety", poeStatus: "Completed & Verified", image: "https://placehold.co/600x400.png", imageHint: "workshop safety gear", poeDueDate: null },
  { id: "unit4", title: "Automotive Materials Science", code: "AUT204", poeProgress: 10, credits: 10, teacher: "Dr. Metalloid", poeStatus: "Not Started", image: "https://placehold.co/600x400.png", imageHint: "metal gears components", poeDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "unit5", title: "Advanced Diagnostics", code: "AUT301", poeProgress: 0, credits: 15, teacher: "Mr. Harrison", poeStatus: "Not Started", image: "https://placehold.co/600x400.png", imageHint: "diagnostic tools automotive", poeDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() }, // Due tomorrow
];

interface MockAnnouncement {
    id: string;
    title: string;
    date: string; // ISO string for when it was posted
    content: string;
    type: "alert" | "info" | "reminder";
    dueDate?: string | null; // ISO string for any associated deadline
}

const mockAnnouncements: MockAnnouncement[] = [
    {id: "ann1", title: "Practical Assessment: Engine Systems (AUT201)", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), content: "The practical assessment for AUT201 is next week. Ensure all pre-assessment tasks are completed.", type: "alert", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},
    {id: "ann2", title: "Guest Lecture: EV Technology", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), content: "Join us for an insightful guest lecture on Electric Vehicle advancements this Friday.", type: "info", dueDate: null},
    {id: "ann3", title: "Reminder: PoE Submission for AUT202", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), content: `PoE for Vehicle Electrical Systems is due on ${format(parseISO(mockCourses.find(c => c.id === 'unit2')?.poeDueDate || new Date()), "MMM dd")}.`, type: "reminder", dueDate: mockCourses.find(c => c.id === 'unit2')?.poeDueDate},
];

const aiQuestionFormSchema = z.object({
  question: z.string().min(10, { message: "Question must be at least 10 characters." }).max(500, {message: "Question is too long (max 500 characters)."}),
});
type AiQuestionFormValues = z.infer<typeof aiQuestionFormSchema>;

const trainerQuestionFormSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  questionToTrainer: z.string().min(10, {message: "Question must be at least 10 characters."}).max(1000, {message: "Question is too long (max 1000 characters)."}),
});
type TrainerQuestionFormValues = z.infer<typeof trainerQuestionFormSchema>;


export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoadingAiAnswer, setIsLoadingAiAnswer] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AskAcademicQuestionOutput | null>(null);
  const [isTrainerQuestionModalOpen, setIsTrainerQuestionModalOpen] = useState(false);
  const [currentCourseForQuestion, setCurrentCourseForQuestion] = useState<{id: string; title: string} | null>(null);
  const [isSubmittingTrainerQuestion, setIsSubmittingTrainerQuestion] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const aiForm = useForm<AiQuestionFormValues>({
    resolver: zodResolver(aiQuestionFormSchema),
    defaultValues: { question: "" },
    mode: "onChange",
  });
  
  const trainerQuestionForm = useForm<TrainerQuestionFormValues>({
    resolver: zodResolver(trainerQuestionFormSchema),
    defaultValues: { courseId: "", courseTitle: "", questionToTrainer: "" },
    mode: "onChange",
  });

  const handlePoeAction = (courseTitle: string, action: "view" | "upload") => {
    toast({
      title: `PoE Action (Mock) for ${courseTitle}`,
      description: `This would ${action} Portfolio of Evidence. Feature coming soon!`,
    });
  };

  const onAskAiSubmit = async (data: AiQuestionFormValues) => {
    setIsLoadingAiAnswer(true);
    setAiAnswer(null);
    try {
      const result = await getAiAcademicHelp({
        question: data.question,
        studentContext: { 
          course: mockStudent.course,
        }
      });
      setAiAnswer(result);
      aiForm.reset(); 
    } catch (error) {
      toast({
        title: "AI Helper Error",
        description: error instanceof Error ? error.message : "Could not get an answer from the AI.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAiAnswer(false);
    }
  };

  const handleOpenTrainerQuestionModal = (course: {id: string; title: string}) => {
    setCurrentCourseForQuestion(course);
    trainerQuestionForm.reset({ courseId: course.id, courseTitle: course.title, questionToTrainer: "" });
    setIsTrainerQuestionModalOpen(true);
  };

  const onSubmitTrainerQuestion = async (data: TrainerQuestionFormValues) => {
    setIsSubmittingTrainerQuestion(true);
    try {
      const result = await submitStudentQuestionToTrainer({
        studentId: mockStudent.id,
        studentName: mockStudent.name,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        questionText: data.questionToTrainer
      });
      if (result.success) {
        toast({ title: "Question Sent!", description: `Your question about ${data.courseTitle} has been sent to your trainer.`});
        setIsTrainerQuestionModalOpen(false);
      } else {
        toast({ title: "Error Sending Question", description: result.message || "Could not send your question.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Submission Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsSubmittingTrainerQuestion(false);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch(type) {
        case 'alert': return <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />;
        case 'info': return <Activity className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />;
        case 'reminder': return <Megaphone className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />;
        default: return <Megaphone className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />;
    }
  };

  const upcomingDeadlines = useMemo(() => {
    if (!isClient) return [];
    const today = new Date();
    const items = [];

    // PoE Deadlines from courses
    mockCourses.forEach(course => {
      if (course.poeDueDate && isFuture(parseISO(course.poeDueDate)) && course.poeStatus !== "Completed & Verified") {
        const dueDate = parseISO(course.poeDueDate);
        const daysLeft = differenceInDays(dueDate, today);
        if (daysLeft <= 10) { // Show deadlines within the next 10 days
          items.push({
            id: `course-${course.id}`,
            title: `${course.title} PoE`,
            dueDate,
            daysLeft,
            type: "poe" as const,
          });
        }
      }
    });

    // Deadlines from announcements
    mockAnnouncements.forEach(ann => {
      if (ann.dueDate && isFuture(parseISO(ann.dueDate)) && (ann.type === 'alert' || ann.type === 'reminder')) {
        const dueDate = parseISO(ann.dueDate);
        const daysLeft = differenceInDays(dueDate, today);
        if (daysLeft <= 10) {
            // Avoid duplicating if it's already covered by a PoE deadline for the same thing
            if (!items.some(item => item.title.includes(ann.title.split(':')[0]) && item.type === "poe")) {
                 items.push({
                    id: `ann-${ann.id}`,
                    title: ann.title,
                    dueDate,
                    daysLeft,
                    type: "announcement" as const,
                 });
            }
        }
      }
    });
    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [isClient]);


  if (!isClient) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-muted rounded w-3/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-xl"><CardContent className="h-60 bg-muted rounded p-4"></CardContent></Card>
            <Card className="lg:col-span-1 shadow-xl"><CardContent className="h-60 bg-muted rounded p-4"></CardContent></Card>
            <Card className="lg:col-span-1 shadow-xl"><CardContent className="h-60 bg-muted rounded p-4"></CardContent></Card>
        </div>
        <Card className="shadow-xl"><CardContent className="h-40 bg-muted rounded p-4"></CardContent></Card>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => ( <Card key={i} className="shadow-lg"><CardContent className="h-80 bg-muted rounded p-4"></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${mockStudent.name.split(' ')[0]}! Ready to learn?`}
        description="Your student dashboard: track progress, get help, and manage your studies."
      />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl bg-card hover:shadow-primary/10 transition-shadow">
            <CardHeader className="items-center text-center border-b pb-4 bg-primary/5 rounded-t-lg">
                 <Image 
                    src={mockStudent.profilePicUrl} 
                    alt="Student Profile Picture" 
                    width={100} 
                    height={100} 
                    className="rounded-full mx-auto border-4 border-primary shadow-lg"
                    data-ai-hint="student portrait friendly" 
                  />
                <CardTitle className="text-2xl font-headline mt-3 text-primary">{mockStudent.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{mockStudent.admissionNumber}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2 pt-4">
                <p><strong className="text-foreground">Course:</strong> <span className="text-muted-foreground">{mockStudent.course}</span></p>
                <p><strong className="text-foreground">Year/Level:</strong> <span className="text-muted-foreground">{mockStudent.yearOfStudy}</span></p>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href="/student/profile">
                    <UserCircle className="mr-2 h-4 w-4" /> View My Profile
                  </Link>
                </Button>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl hover:shadow-accent/10 transition-shadow">
            <CardHeader className="border-b pb-3">
                <CardTitle className="font-headline text-xl flex items-center text-accent-foreground"><CalendarClock className="mr-2 h-6 w-6 text-accent" />Upcoming Deadlines & Reminders</CardTitle>
                <CardDescription>Stay on top of your tasks for the next 10 days.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 max-h-[280px] overflow-y-auto">
                {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(item => (
                    <div key={item.id} className={cn(
                        "p-3 border rounded-lg flex items-start gap-3 hover:bg-muted/40 transition-colors",
                        item.daysLeft <= 1 && "border-destructive/50 bg-destructive/10",
                        item.daysLeft > 1 && item.daysLeft <= 3 && "border-yellow-500/50 bg-yellow-500/10"
                    )}>
                        {item.daysLeft <= 1 ? <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0"/> : 
                         item.daysLeft <= 3 ? <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"/> :
                         <CalendarDays className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"/>}
                        <div>
                            <h4 className={cn(
                                "font-semibold text-md",
                                item.daysLeft <=1 && "text-destructive-foreground",
                                item.daysLeft > 1 && item.daysLeft <= 3 && "text-yellow-700"
                            )}>{item.title}</h4>
                            <p className="text-xs text-muted-foreground">
                                Due: {format(item.dueDate, "MMM dd, yyyy")}
                                <span className={cn(
                                    "font-medium ml-1",
                                    item.daysLeft <= 1 && "text-destructive-foreground",
                                    item.daysLeft > 1 && item.daysLeft <= 3 && "text-yellow-700",
                                    item.daysLeft > 3 && "text-primary"
                                )}>
                                    ({item.daysLeft === 0 ? "Today!" : item.daysLeft === 1 ? "Tomorrow!" : `in ${item.daysLeft} days`})
                                </span>
                            </p>
                        </div>
                    </div>
                )) : <p className="text-muted-foreground text-center py-4">No immediate deadlines in the next 10 days. Great job staying ahead, or check your full schedule!</p>}
            </CardContent>
        </Card>

    </div>
     <Card className="shadow-xl hover:shadow-primary/10 transition-shadow">
        <CardHeader className="border-b">
            <CardTitle className="font-headline text-xl flex items-center text-primary"><CreditCard className="mr-2 h-6 w-6"/>My Finances</CardTitle>
            <CardDescription>Access your fee statements and payment history.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-3">
                Keep track of your financial obligations and payments made to the institution.
            </p>
            <Button asChild>
                <Link href="/student/finance">
                    Go to My Finances &rarr;
                </Link>
            </Button>
        </CardContent>
    </Card>


    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xl hover:shadow-primary/10 transition-shadow">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl flex items-center text-primary"><SkillsSparkles className="mr-2 h-6 w-6"/>My Skills Pathway (Mock)</CardTitle>
                <CardDescription>Key skills you're developing in {mockStudent.course}.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
                {mockStudent.mockSkills.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mockStudent.mockSkills.map((skill, index) => (
                        <li key={index} className="flex items-center text-sm p-1 hover:bg-muted/30 rounded">
                            <Award className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0"/>
                            <span className="text-muted-foreground">{skill}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">Skills tracking coming soon!</p>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-primary/10 transition-shadow">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl flex items-center text-primary"><Navigation className="mr-2 h-6 w-6"/>Career Compass (Mock)</CardTitle>
                <CardDescription>Explore industry insights related to your field.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
                 {mockStudent.careerLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-muted transition-colors text-sm text-primary hover:underline">
                        {link.icon} {link.title}
                    </a>
                ))}
            </CardContent>
        </Card>
    </div>


    <Card className="shadow-xl hover:shadow-accent/10 transition-shadow">
        <CardHeader className="border-b">
            <CardTitle className="font-headline text-xl flex items-center text-accent-foreground">
                <Brain className="mr-2 h-6 w-6 text-accent" /> AI Academic Helper
            </CardTitle>
            <CardDescription>Stuck on a concept? Ask the AI for a quick explanation. Always verify complex info with your trainer.</CardDescription>
        </CardHeader>
        <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(onAskAiSubmit)}>
                <CardContent className="pt-4 space-y-4">
                    <FormField
                        control={aiForm.control}
                        name="question"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-semibold text-foreground">Your Question:</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder={`e.g., In ${mockStudent.course.toLowerCase()}, how does a differential work? What's Ohm's Law?`}
                                className="min-h-[100px] resize-y bg-background"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <Button type="submit" disabled={isLoadingAiAnswer} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isLoadingAiAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Ask AI
                    </Button>
                </CardContent>
            </form>
        </Form>
        {isLoadingAiAnswer && (
            <CardContent className="pt-0">
                <div className="flex items-center space-x-2 text-muted-foreground p-3 bg-muted rounded-md">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI is formulating an answer... please wait.</span>
                </div>
            </CardContent>
        )}
        {aiAnswer && !isLoadingAiAnswer && (
            <CardContent className="pt-0">
                <h3 className="text-md font-semibold mb-2 text-accent-foreground">AI's Response:</h3>
                <div className="p-4 border rounded-md bg-muted/30 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  <LatexRenderer latexString={aiAnswer.answer} />
                </div>
            </CardContent>
        )}
    </Card>

      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-headline font-semibold text-primary flex items-center">
                <BookOpen className="mr-3 h-7 w-7"/>My Courses & Portfolio of Evidence
            </h2>
             <Button variant="link" className="text-sm">View All Courses &rarr;</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {mockCourses.slice(0,2).map((course) => ( // Show only first 2 for brevity on dashboard
            <Card key={course.id} className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col bg-card">
              <div className="relative h-48 w-full">
                <Image 
                    src={course.image} 
                    alt={`${course.title} course image`} 
                    fill 
                    style={{objectFit: "cover"}} 
                    className="rounded-t-lg"
                    data-ai-hint={course.imageHint}
                />
              </div>
              <CardHeader className="border-t bg-primary/5">
                <CardTitle className="font-headline text-xl text-primary">{course.title}</CardTitle>
                <CardDescription>Code: {course.code} | Credits: {course.credits}</CardDescription>
                <CardDescription>Trainer: {course.teacher}</CardDescription>
                 {course.poeDueDate && course.poeStatus !== "Completed & Verified" && isFuture(parseISO(course.poeDueDate)) && (
                    <Badge variant={differenceInDays(parseISO(course.poeDueDate), new Date()) <= 3 ? "destructive" : "secondary"} className="mt-1 w-fit">
                        <CalendarClock className="mr-1.5 h-3.5 w-3.5"/>
                        PoE Due: {format(parseISO(course.poeDueDate), "MMM dd")}
                    </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-grow space-y-3 pt-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">PoE Progress:</span>
                    <span className="text-primary font-semibold">{course.poeProgress}%</span>
                  </div>
                  <Progress value={course.poeProgress} aria-label={`${course.title} PoE progress ${course.poeProgress}%`} className="h-3"/>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    Status: 
                    <Badge 
                        variant={course.poeStatus === "Completed & Verified" ? "default" : course.poeStatus === "Partially Submitted" ? "secondary" : "outline"}
                        className={`ml-1.5 ${course.poeStatus === "Completed & Verified" ? 'bg-green-600 text-white' : ''}`}
                    >
                        {course.poeStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => handlePoeAction(course.title, "view")} className="sm:col-span-1">
                  <Eye className="mr-2 h-4 w-4" /> View PoE
                </Button>
                <Button variant="default" size="sm" onClick={() => handlePoeAction(course.title, "upload")} disabled={course.poeProgress === 100} className="sm:col-span-1">
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload
                </Button>
                 <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleOpenTrainerQuestionModal({id: course.id, title: course.title})}
                    className="sm:col-span-1"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Ask Trainer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
    <Card className="lg:col-span-2 shadow-xl hover:shadow-accent/10 transition-shadow mt-8">
        <CardHeader className="border-b pb-3">
            <CardTitle className="font-headline text-xl flex items-center text-accent-foreground"><Megaphone className="mr-2 h-6 w-6 text-accent" />General Announcements</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 max-h-[280px] overflow-y-auto">
            {mockAnnouncements.length > 0 ? mockAnnouncements.filter(ann => ann.type === 'info').map(ann => ( // Filter for general info
                <div key={ann.id} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start">
                        {getAnnouncementIcon(ann.type)}
                        <div>
                            <h4 className="font-semibold text-md text-foreground">{ann.title}</h4>
                            <p className="text-xs text-muted-foreground mb-1">Posted: {format(parseISO(ann.date), "MMM dd, yyyy")}</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground ml-7">{ann.content}</p>
                </div>
            )) : <p className="text-muted-foreground text-center py-4">No general announcements.</p>}
            {mockAnnouncements.filter(ann => ann.type === 'info').length === 0 && <p className="text-muted-foreground text-center py-4">No general announcements at this time.</p>}
        </CardContent>
    </Card>


      <section className="mt-12">
        <h2 className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
            <BarChart2 className="mr-3 h-7 w-7" />My Academic Progress (Mock)
        </h2>
        <Card className="shadow-lg hover:shadow-primary/10 transition-shadow">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Detailed charts and grades will be displayed here soon.</p>
                <div className="mt-4 h-48 bg-muted/50 rounded-md flex items-center justify-center">
                    <BarChart2 className="h-16 w-16 text-muted-foreground/30"/>
                </div>
            </CardContent>
        </Card>
      </section>

      {currentCourseForQuestion && (
        <Dialog open={isTrainerQuestionModalOpen} onOpenChange={setIsTrainerQuestionModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
                 <Form {...trainerQuestionForm}>
                    <form onSubmit={trainerQuestionForm.handleSubmit(onSubmitTrainerQuestion)}>
                        <DialogHeader>
                            <DialogTitle className="font-headline text-primary">Ask Your Trainer</DialogTitle>
                            <DialogDescription>
                                Your question regarding "<strong>{currentCourseForQuestion.title}</strong>" will be sent to your trainer. Be specific!
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <FormField
                                control={trainerQuestionForm.control}
                                name="questionToTrainer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel htmlFor="questionToTrainerText" className="font-semibold text-foreground">Your Question:</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            id="questionToTrainerText"
                                            placeholder="Type your question here... e.g., Could you clarify the deadline for Assignment 2? I'm unsure about the requirements for section B."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmittingTrainerQuestion}>
                                {isSubmittingTrainerQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                Send Question
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

