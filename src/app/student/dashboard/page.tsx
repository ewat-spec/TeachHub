
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, Eye, BarChart2, BookOpen, AlertCircle, Brain, Send, Loader2, MessageCircle } from "lucide-react"; // Added MessageCircle
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Added Dialog components
import { getAiAcademicHelp } from "./actions";
import { submitStudentQuestionToTrainer } from "./actions"; // New action
import type { AskAcademicQuestionOutput } from "@/ai/flows/ask-academic-question-flow";
import { LatexRenderer } from "@/components/common/LatexRenderer";


const mockStudent = {
  id: "studentAlexDemo",
  name: "Alex DemoStudent",
  admissionNumber: "SCT221-0077/2024",
  course: "Automotive Engineering",
  yearOfStudy: "Year 2",
  profilePicUrl: "https://placehold.co/100x100.png"
};

const mockCourses = [
  { id: "unit1", title: "Engine Systems", code: "AUT201", poeProgress: 75, credits: 15, teacher: "Mr. Harrison", poeStatus: "Partially Submitted", image: "https://placehold.co/600x400.png", imageHint: "engine mechanics" },
  { id: "unit2", title: "Vehicle Electrical Systems", code: "AUT202", poeProgress: 40, credits: 12, teacher: "Ms. Electra", poeStatus: "Pending Submission", image: "https://placehold.co/600x400.png", imageHint: "car electrics" },
  { id: "unit3", title: "Workshop Safety & Practice", code: "AUT203", poeProgress: 100, credits: 10, teacher: "Mr. Safety", poeStatus: "Completed & Verified", image: "https://placehold.co/600x400.png", imageHint: "workshop safety" },
  { id: "unit4", title: "Automotive Materials Science", code: "AUT204", poeProgress: 10, credits: 10, teacher: "Dr. Metalloid", poeStatus: "Not Started", image: "https://placehold.co/600x400.png", imageHint: "metal gears" },
];

const mockAnnouncements = [
    {id: "ann1", title: "Upcoming Practical Assessment for AUT201", date: "2024-10-15", content: "All Year 2 Automotive students are reminded about the practical assessment for Engine Systems scheduled next week."},
    {id: "ann2", title: "Guest Lecture: Future of EV Technology", date: "2024-10-10", content: "Join us for an insightful guest lecture on Electric Vehicle advancements this Friday."},
];

const aiQuestionFormSchema = z.object({
  question: z.string().min(10, { message: "Question must be at least 10 characters." }).max(500, {message: "Question is too long (max 500 characters)."}),
});
type AiQuestionFormValues = z.infer<typeof aiQuestionFormSchema>;

const trainerQuestionFormSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(), // For display in modal
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
      // In a real app, studentId would come from auth context
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


  if (!isClient) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-3/4"></div>
        <Card className="shadow-lg">
          <CardHeader><div className="h-6 bg-muted rounded w-1/2"></div></CardHeader>
          <CardContent><div className="h-24 bg-muted rounded"></div></CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
            {[1,2].map(i => (
                <Card key={i} className="shadow-lg"><CardContent className="h-40 bg-muted rounded p-4"></CardContent></Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${mockStudent.name}!`}
        description="Your personal dashboard for managing your studies and Portfolio of Evidence."
      />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl">
            <CardHeader className="items-center text-center">
                 <Image 
                    src={mockStudent.profilePicUrl} 
                    alt="Student Profile Picture" 
                    width={100} 
                    height={100} 
                    className="rounded-full mx-auto border-4 border-primary shadow-md"
                    data-ai-hint="student portrait" 
                  />
                <CardTitle className="text-2xl font-headline mt-3">{mockStudent.name}</CardTitle>
                <CardDescription>{mockStudent.admissionNumber}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p><strong>Course:</strong> {mockStudent.course}</p>
                <p><strong>Year/Level:</strong> {mockStudent.yearOfStudy}</p>
                <Button className="w-full mt-4" variant="outline" onClick={() => toast({title: "Mock Action", description: "Profile editing page coming soon."})}>
                    <FileText className="mr-2 h-4 w-4" /> Edit My Profile (Mock)
                </Button>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><AlertCircle className="mr-2 h-6 w-6 text-primary" />Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {mockAnnouncements.length > 0 ? mockAnnouncements.map(ann => (
                    <div key={ann.id} className="p-3 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold text-md">{ann.title}</h4>
                        <p className="text-xs text-muted-foreground mb-1">Posted: {ann.date}</p>
                        <p className="text-sm">{ann.content}</p>
                    </div>
                )) : <p className="text-muted-foreground">No recent announcements.</p>}
            </CardContent>
        </Card>
    </div>

    <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="font-headline flex items-center">
                <Brain className="mr-2 h-6 w-6 text-primary" /> AI Academic Helper
            </CardTitle>
            <CardDescription>Ask a question and get AI-powered assistance. For complex topics, always verify with your instructor.</CardDescription>
        </CardHeader>
        <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(onAskAiSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                        control={aiForm.control}
                        name="question"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Your Question:</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="e.g., Explain the difference between a series and parallel circuit. What is the formula for calculating torque?"
                                className="min-h-[100px] resize-y"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <Button type="submit" disabled={isLoadingAiAnswer}>
                        {isLoadingAiAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Ask AI
                    </Button>
                </CardContent>
            </form>
        </Form>
        {isLoadingAiAnswer && (
            <CardContent>
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI is thinking... please wait.</span>
                </div>
            </CardContent>
        )}
        {aiAnswer && !isLoadingAiAnswer && (
            <CardContent>
                <h3 className="text-md font-semibold mb-2 text-primary">AI's Answer:</h3>
                <div className="p-3 border rounded-md bg-muted/50 min-h-[100px] prose-sm max-w-none">
                  <LatexRenderer latexString={aiAnswer.answer} />
                </div>
            </CardContent>
        )}
    </Card>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center">
            <BookOpen className="mr-3 h-7 w-7"/>My Courses & Portfolio of Evidence
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mockCourses.map((course) => (
            <Card key={course.id} className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
              <div className="relative h-40 w-full">
                <Image 
                    src={course.image} 
                    alt={`${course.title} placeholder image`} 
                    fill 
                    style={{objectFit: "cover"}} 
                    className="rounded-t-lg"
                    data-ai-hint={course.imageHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                <CardDescription>Code: {course.code} | Credits: {course.credits}</CardDescription>
                <CardDescription>Teacher: {course.teacher}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">PoE Progress:</span>
                    <span className="text-primary font-semibold">{course.poeProgress}%</span>
                  </div>
                  <Progress value={course.poeProgress} aria-label={`${course.title} PoE progress ${course.poeProgress}%`} />
                  <p className="text-xs text-muted-foreground mt-1">Status: {course.poeStatus}</p>
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
        <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Detailed charts and grades will be displayed here.</p>
                <div className="mt-4 h-48 bg-muted rounded-md flex items-center justify-center">
                    <BarChart2 className="h-16 w-16 text-muted-foreground/50"/>
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
                            <DialogTitle className="font-headline">Ask Your Trainer</DialogTitle>
                            <DialogDescription>
                                Your question regarding "<strong>{currentCourseForQuestion.title}</strong>" will be sent to your trainer.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <FormField
                                control={trainerQuestionForm.control}
                                name="questionToTrainer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel htmlFor="questionToTrainerText">Your Question:</FormLabel>
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

