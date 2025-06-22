
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, CheckCircle, CalendarIcon, Brain, BarChart3, ListChecks, Lightbulb, Loader2, Sparkles, CalendarPlus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { getAiPerformanceAnalysis } from "./actions";
import type { AnalyzeTrainerPerformanceOutput, AnalyzeTrainerPerformanceInput } from "@/ai/flows/analyze-trainer-performance-flow";


const scheduleFormSchema = z.object({
  id: z.string().optional(),
  trainer: z.string().min(1, { message: "Trainer selection is required." }),
  sessionDate: z.date({ required_error: "Session date is required." }),
  sessionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  venue: z.string().min(2, { message: "Venue must be at least 2 characters." }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  duration: z.coerce.number().min(0.5, { message: "Duration must be at least 0.5 hours." }),
  isPractical: z.boolean().default(false),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduledClass extends ScheduleFormValues {
  id: string; 
}

const performanceFormSchema = z.object({
  weeklyHourTarget: z.coerce.number().positive({ message: "Target hours must be a positive number."}).min(1).max(80),
  performanceGoals: z.string().optional(),
});
type PerformanceFormValues = z.infer<typeof performanceFormSchema>;


// Mock for the current logged-in trainer (Jane Doe)
const CURRENT_TRAINER_ID = "trainerJane";
const CURRENT_TRAINER_NAME = "Jane Doe";

// Initial classes only for the current trainer (Jane Doe)
const initialScheduledClasses: ScheduledClass[] = [
  { id: "class1", trainer: CURRENT_TRAINER_ID, sessionDate: new Date("2024-09-15"), sessionTime: "10:00", venue: "Room A101", topic: "Introduction to React", duration: 2, isPractical: false },
  { id: "class3", trainer: CURRENT_TRAINER_ID, sessionDate: new Date("2024-09-17"), sessionTime: "09:00", venue: "Workshop A", topic: "State Management in React (Practical)", duration: 4, isPractical: true },
  { id: "class4", trainer: CURRENT_TRAINER_ID, sessionDate: new Date("2024-09-18"), sessionTime: "14:00", venue: "Lab 2", topic: "Advanced Hooks & Performance", duration: 3, isPractical: true },
];


export default function SchedulePage() {
  const { toast } = useToast();
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(initialScheduledClasses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeTrainerPerformanceOutput | null>(null);
  const [isLoadingAiAnalysis, setIsLoadingAiAnalysis] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const scheduleUiForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      trainer: CURRENT_TRAINER_ID,
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
      isPractical: false,
    },
    mode: "onChange",
  });

  const performanceUiForm = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    defaultValues: {
      weeklyHourTarget: 30,
      performanceGoals: "",
    },
     mode: "onChange",
  });

  useEffect(() => {
    if (editingClass) {
      scheduleUiForm.reset({
        ...editingClass,
        sessionDate: new Date(editingClass.sessionDate) 
      });
      setIsFormOpen(true);
    } else {
      scheduleUiForm.reset({
        trainer: CURRENT_TRAINER_ID, 
        sessionDate: undefined,
        sessionTime: "09:00",
        venue: "",
        topic: "",
        duration: 1,
        isPractical: false,
      });
    }
  }, [editingClass, scheduleUiForm]);


  async function onSubmit(data: ScheduleFormValues) {
    const submissionData = { ...data, trainer: CURRENT_TRAINER_ID };
    await new Promise(resolve => setTimeout(resolve, 500)); 
    if (editingClass) {
      setScheduledClasses(scheduledClasses.map(cls => cls.id === editingClass.id ? { ...submissionData, id: editingClass.id } as ScheduledClass : cls));
      toast({ title: "Class Updated", description: `Session on "${submissionData.topic}" has been updated.`, action: <CheckCircle className="text-green-500"/> });
    } else {
      setScheduledClasses([...scheduledClasses, { ...submissionData, id: `class${Date.now()}` } as ScheduledClass]);
      toast({ title: "Class Scheduled", description: `New session on "${submissionData.topic}" has been added.`, action: <CheckCircle className="text-green-500"/> });
    }
    setEditingClass(null);
    setIsFormOpen(false);
    scheduleUiForm.reset();
  }

  const handleAnalyzePerformance = async (data: PerformanceFormValues) => {
    if (scheduledClasses.length === 0) {
      toast({ title: "No Classes", description: "Please add some classes to your schedule before analyzing.", variant: "destructive" });
      return;
    }
    setIsLoadingAiAnalysis(true);
    setAiAnalysisResult(null);

    const classesForAnalysis: AnalyzeTrainerPerformanceInput['scheduledClasses'] = scheduledClasses.map(sc => ({
        topic: sc.topic,
        durationHours: sc.duration,
        isPractical: sc.isPractical,
        dayOfWeek: format(new Date(sc.sessionDate), "EEEE"),
        startTime: sc.sessionTime,
    }));

    try {
      const analysis = await getAiPerformanceAnalysis({
        trainerName: CURRENT_TRAINER_NAME,
        scheduledClasses: classesForAnalysis,
        weeklyHourTarget: data.weeklyHourTarget,
        performanceGoals: data.performanceGoals,
      });
      setAiAnalysisResult(analysis);
      toast({ title: "AI Analysis Complete", description: "Your performance and workload analysis is ready.", action: <Sparkles className="text-green-500" />});
    } catch (error) {
      toast({ title: "AI Analysis Error", description: error instanceof Error ? error.message : "Could not perform performance analysis.", variant: "destructive" });
    } finally {
      setIsLoadingAiAnalysis(false);
    }
  };


  const handleEdit = (cls: ScheduledClass) => {
    setEditingClass(cls);
  };

  const handleDelete = (classId: string) => {
    setScheduledClasses(scheduledClasses.filter(cls => cls.id !== classId));
    toast({ title: "Class Deleted", description: "The session has been removed from the schedule.", variant: "destructive" });
  };
  
  const openNewForm = () => {
    setEditingClass(null);
    scheduleUiForm.reset({
      trainer: CURRENT_TRAINER_ID,
      sessionDate: undefined,
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
      isPractical: false,
    });
    setIsFormOpen(true);
  }
  
  const handleGoogleCalendarSync = () => {
    toast({
        title: "Feature Coming Soon",
        description: "Google Calendar synchronization is planned for a future update!",
    });
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Class Schedule" description="Manage your personal class schedule." />
         <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-40 mb-4"></div>
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-5/6"></div>
              </CardContent>
            </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="My Class Schedule"
        description="Manage your personal class schedule and session details."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={handleGoogleCalendarSync} variant="outline">
                <CalendarPlus className="mr-2 h-4 w-4" /> Sync with Google Calendar
            </Button>
            <Button onClick={openNewForm}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Session
            </Button>
          </div>
        }
      />

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingClass ? "Edit Session" : "Schedule New Session"}</CardTitle>
            <CardDescription>{editingClass ? "Update details for this session." : "Fill in the details to add a new session to your schedule."}</CardDescription>
          </CardHeader>
          <Form {...scheduleUiForm}>
            <form onSubmit={scheduleUiForm.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                 <FormField
                    control={scheduleUiForm.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={scheduleUiForm.control}
                    name="sessionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Session Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0)) 
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleUiForm.control}
                    name="sessionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={scheduleUiForm.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session venue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleUiForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g., 1.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={scheduleUiForm.control}
                  name="isPractical"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          This is a practical session
                        </FormLabel>
                        <FormDescription>
                          Check this box if the session is a long, hands-on practical class.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingClass(null); scheduleUiForm.reset(); }}>Cancel</Button>
                <Button type="submit" disabled={scheduleUiForm.formState.isSubmitting}>{scheduleUiForm.formState.isSubmitting ? "Saving..." : (editingClass ? "Update Session" : "Add Session")}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">My Current Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledClasses.filter(cls => cls.trainer === CURRENT_TRAINER_ID).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledClasses
                  .filter(cls => cls.trainer === CURRENT_TRAINER_ID) 
                  .sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime() || a.sessionTime.localeCompare(b.sessionTime))
                  .map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.topic}</TableCell>
                    <TableCell>{format(new Date(cls.sessionDate), "MMM dd, yyyy")} at {cls.sessionTime}</TableCell>
                    <TableCell>{cls.venue}</TableCell>
                    <TableCell>{cls.duration} hr(s)</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)} className="mr-2 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)} className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className="text-muted-foreground text-center py-8">You have no classes scheduled yet. Click "Add New Session" to get started.</p>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-6 w-6 text-primary" /> AI Performance & Workload Analysis</CardTitle>
            <CardDescription>Get AI-powered feedback on your schedule to help with planning and performance.</CardDescription>
        </CardHeader>
        <Form {...performanceUiForm}>
            <form onSubmit={performanceUiForm.handleSubmit(handleAnalyzePerformance)}>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={performanceUiForm.control}
                            name="weeklyHourTarget"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>My Weekly Hour Target</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={performanceUiForm.control}
                            name="performanceGoals"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>My Performance Goals (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., improve student engagement" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    <Button type="submit" disabled={isLoadingAiAnalysis || scheduledClasses.length === 0}>
                        {isLoadingAiAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Analyze My Schedule
                    </Button>
                    {scheduledClasses.length === 0 && <p className="text-sm text-destructive">Add some classes to your schedule to enable analysis.</p>}
                </CardContent>
            </form>
        </Form>
        {isLoadingAiAnalysis && (
            <CardContent>
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Your personal AI coach is analyzing your schedule...</span>
                </div>
            </CardContent>
        )}
        {aiAnalysisResult && !isLoadingAiAnalysis && (
            <CardContent className="space-y-6 pt-4">
                <Accordion type="multiple" defaultValue={['assessment']} className="w-full">
                    <AccordionItem value="assessment">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                                <BarChart3 className="mr-2 h-5 w-5" /> Overall Summary & Workload
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                             <p className="text-base text-muted-foreground">{aiAnalysisResult.overallSummary}</p>
                             <p className="font-medium">Total Scheduled Hours: <span className="font-bold text-primary">{aiAnalysisResult.totalScheduledHours}</span></p>
                             <p className="text-sm">{aiAnalysisResult.workloadAnalysis}</p>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="balance">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                             <ListChecks className="mr-2 h-5 w-5" /> Schedule Balance Feedback
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {aiAnalysisResult.scheduleBalanceFeedback.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                                    {aiAnalysisResult.scheduleBalanceFeedback.map((feedback, index) => (
                                        <li key={`balance-${index}`}>{feedback}</li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted-foreground">No specific schedule balance feedback provided.</p>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="suggestions">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                                <Lightbulb className="mr-2 h-5 w-5" /> Performance Improvement Suggestions
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                             {aiAnalysisResult.performanceImprovementSuggestions.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                                    {aiAnalysisResult.performanceImprovementSuggestions.map((suggestion, index) => (
                                        <li key={`suggest-${index}`}>{suggestion}</li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted-foreground">No specific suggestions provided by AI.</p>}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
