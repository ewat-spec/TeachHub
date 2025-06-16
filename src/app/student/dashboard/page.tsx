
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, Eye, BarChart2, BookOpen, AlertCircle, Brain, Send, Loader2, MessageCircle, UserCircle, Megaphone, Award, Activity, Briefcase, Navigation, Sparkles as SkillsSparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
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

const mockStudent = {
  id: "studentAlexDemo",
  name: "Alex DemoStudent",
  admissionNumber: "SCT221-0077/2024",
  course: "Automotive Engineering",
  yearOfStudy: "Year 2",
  profilePicUrl: "https://placehold.co/120x120.png", // Slightly larger
  mockSkills: ["Engine Diagnostics", "CAD Software Basics", "Workshop Safety", "Problem Solving"],
  careerLinks: [
    { title: "Explore Automotive Careers", url: "#" , icon: <Briefcase className="h-4 w-4 mr-2"/> },
    { title: "Latest Auto Industry News", url: "#", icon: <Navigation className="h-4 w-4 mr-2"/> },
  ]
};

const mockCourses = [
  { id: "unit1", title: "Engine Systems", code: "AUT201", poeProgress: 75, credits: 15, teacher: "Mr. Harrison", poeStatus: "Partially Submitted", image: "https://placehold.co/600x400.png", imageHint: "engine mechanics repair" },
  { id: "unit2", title: "Vehicle Electrical Systems", code: "AUT202", poeProgress: 40, credits: 12, teacher: "Ms. Electra", poeStatus: "Pending Submission", image: "https://placehold.co/600x400.png", imageHint: "car electrics circuitry" },
  { id: "unit3", title: "Workshop Safety & Practice", code: "AUT203", poeProgress: 100, credits: 10, teacher: "Mr. Safety", poeStatus: "Completed & Verified", image: "https://placehold.co/600x400.png", imageHint: "workshop safety gear" },
  { id: "unit4", title: "Automotive Materials Science", code: "AUT204", poeProgress: 10, credits: 10, teacher: "Dr. Metalloid", poeStatus: "Not Started", image: "https://placehold.co/600x400.png", imageHint: "metal gears components" },
];

const mockAnnouncements = [
    {id: "ann1", title: "Upcoming Practical Assessment for AUT201", date: "2024-10-15", content: "All Year 2 Automotive students are reminded about the practical assessment for Engine Systems scheduled next week. Check the portal for details.", type: "alert"},
    {id: "ann2", title: "Guest Lecture: Future of EV Technology", date: "2024-10-10", content: "Join us for an insightful guest lecture on Electric Vehicle advancements this Friday in the Main Hall.", type: "info"},
    {id: "ann3", title: "PoE Submission Deadline Approaching", date: "2024-10-08", content: "Final deadline for AUT202 PoE submissions is Oct 20th. Ensure all evidence is uploaded.", type: "reminder"},
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
      aiForm.reset(); // Clear form after submission
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

  if (!isClient) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-muted rounded w-3/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-xl"><CardContent className="h-60 bg-muted rounded p-4"></CardContent></Card>
            <Card className="lg:col-span-2 shadow-xl"><CardContent className="h-60 bg-muted rounded p-4"></CardContent></Card>
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
                  <a href="/student/profile">
                    <UserCircle className="mr-2 h-4 w-4" /> View My Profile
                  </a>
                </Button>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl hover:shadow-accent/10 transition-shadow">
            <CardHeader className="border-b pb-3">
                <CardTitle className="font-headline text-xl flex items-center text-accent-foreground"><Megaphone className="mr-2 h-6 w-6 text-accent" />Latest Announcements</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 max-h-[280px] overflow-y-auto">
                {mockAnnouncements.length > 0 ? mockAnnouncements.map(ann => (
                    <div key={ann.id} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start">
                            {getAnnouncementIcon(ann.type)}
                            <div>
                                <h4 className="font-semibold text-md text-foreground">{ann.title}</h4>
                                <p className="text-xs text-muted-foreground mb-1">Posted: {ann.date}</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">{ann.content}</p>
                    </div>
                )) : <p className="text-muted-foreground text-center py-4">No recent announcements.</p>}
            </CardContent>
        </Card>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xl hover:shadow-primary/10 transition-shadow">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl flex items-center text-primary"><SkillsSparkles className="mr-2 h-6 w-6"/>My Skills Pathway (Mock)</CardTitle>
                <CardDescription>Key skills you're developing in {mockStudent.course}.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
                {mockStudent.mockSkills.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-2">
                    {mockStudent.mockSkills.map((skill, index) => (
                        <li key={index} className="flex items-center text-sm">
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
            <CardContent className="pt-4 space-y-2">
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
        <h2 className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
            <BookOpen className="mr-3 h-7 w-7"/>My Courses & Portfolio of Evidence
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2"> {/* Changed to 2-col for XL to make cards bigger */}
          {mockCourses.map((course) => (
            <Card key={course.id} className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col bg-card">
              <div className="relative h-48 w-full"> {/* Increased image height */}
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

