
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, CheckCircle, CalendarIcon, Brain, ListChecks, AlertOctagon, Lightbulb, BarChart3, Loader2, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getAiTimetableAnalysis } from "./actions";
import type { AnalyzeTimetableOutput, AnalyzeTimetableInput } from "@/ai/flows/analyze-timetable-flow";


const scheduleFormSchema = z.object({
  id: z.string().optional(),
  trainer: z.string().min(1, { message: "Trainer selection is required." }),
  sessionDate: z.date({ required_error: "Session date is required." }),
  sessionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  venue: z.string().min(2, { message: "Venue must be at least 2 characters." }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  duration: z.coerce.number().min(0.5, { message: "Duration must be at least 0.5 hours." }),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduledClass extends ScheduleFormValues {
  id: string; 
}

const mockTrainers = [
  { id: "trainer1", name: "John Smith" },
  { id: "trainer2", name: "Alice Johnson" },
  { id: "trainer3", name: "Robert Brown" },
];

const initialScheduledClasses: ScheduledClass[] = [
  { id: "class1", trainer: "trainer1", sessionDate: new Date("2024-09-15"), sessionTime: "10:00", venue: "Room A101", topic: "Introduction to React", duration: 2 },
  { id: "class2", trainer: "trainer2", sessionDate: new Date("2024-09-16"), sessionTime: "14:00", venue: "Online Webinar", topic: "Advanced CSS Techniques", duration: 1.5 },
];

const curriculumFormSchema = z.object({
  guidelines: z.string().min(10, { message: "Please provide some curriculum guidelines for analysis."}),
});
type CurriculumFormValues = z.infer<typeof curriculumFormSchema>;


export default function SchedulePage() {
  const { toast } = useToast();
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(initialScheduledClasses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeTimetableOutput | null>(null);
  const [isLoadingAiAnalysis, setIsLoadingAiAnalysis] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scheduleUiForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      trainer: "",
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
    },
    mode: "onChange",
  });

  const curriculumUiForm = useForm<CurriculumFormValues>({
    resolver: zodResolver(curriculumFormSchema),
    defaultValues: {
      guidelines: "E.g., Maths: 5 hours/week, prefer morning slots. English: 4 hours/week. Science labs need 2-hour blocks. Max 2 consecutive theory classes.",
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
        trainer: "",
        sessionDate: undefined,
        sessionTime: "09:00",
        venue: "",
        topic: "",
        duration: 1,
      });
    }
  }, [editingClass, scheduleUiForm]);


  async function onSubmit(data: ScheduleFormValues) {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    if (editingClass) {
      setScheduledClasses(scheduledClasses.map(cls => cls.id === editingClass.id ? { ...data, id: editingClass.id } as ScheduledClass : cls));
      toast({ title: "Class Updated", description: `Session on "${data.topic}" has been updated.`, action: <CheckCircle className="text-green-500"/> });
    } else {
      setScheduledClasses([...scheduledClasses, { ...data, id: `class${Date.now()}` } as ScheduledClass]);
      toast({ title: "Class Scheduled", description: `New session on "${data.topic}" has been added.`, action: <CheckCircle className="text-green-500"/> });
    }
    setEditingClass(null);
    setIsFormOpen(false);
    scheduleUiForm.reset();
  }

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
      trainer: "",
      sessionDate: undefined,
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
    });
    setIsFormOpen(true);
  }

  const handleAnalyzeTimetable = async (data: CurriculumFormValues) => {
    if (scheduledClasses.length === 0) {
      toast({ title: "No Classes", description: "Please add some classes to the schedule before analyzing.", variant: "destructive" });
      return;
    }
    setIsLoadingAiAnalysis(true);
    setAiAnalysisResult(null);

    const classesForAnalysis: AnalyzeTimetableInput['scheduledClasses'] = scheduledClasses.map(sc => {
        const trainer = mockTrainers.find(t => t.id === sc.trainer);
        return {
            topic: sc.topic,
            trainerName: trainer ? trainer.name : 'Unknown Trainer',
            dayOfWeek: format(new Date(sc.sessionDate), "EEEE"), 
            startTime: sc.sessionTime,
            durationHours: sc.duration,
            venue: sc.venue,
        };
    });

    try {
      const analysis = await getAiTimetableAnalysis({
        curriculumGuidelines: data.guidelines,
        scheduledClasses: classesForAnalysis,
      });
      setAiAnalysisResult(analysis);
      toast({ title: "AI Analysis Complete", description: "Timetable analysis is ready to view.", action: <Sparkles className="text-green-500" />});
    } catch (error) {
      toast({ title: "AI Analysis Error", description: error instanceof Error ? error.message : "Could not perform timetable analysis.", variant: "destructive" });
    } finally {
      setIsLoadingAiAnalysis(false);
    }
  };


  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Scheduling" description="Allocate trainers to sessions and manage the schedule." />
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
        description="Allocate trainers to sessions, manage your schedule, and get AI timetable analysis."
        actions={
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Session
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingClass ? "Edit Session" : "Schedule New Session"}</CardTitle>
            <CardDescription>{editingClass ? "Update details for this session." : "Fill in the details to add a new session to the schedule."}</CardDescription>
          </CardHeader>
          <Form {...scheduleUiForm}>
            <form onSubmit={scheduleUiForm.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={scheduleUiForm.control}
                    name="trainer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trainer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockTrainers.map(trainer => (
                              <SelectItem key={trainer.id} value={trainer.id}>{trainer.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
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
          <CardTitle className="font-headline">My Current Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledClasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledClasses.sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime() || a.sessionTime.localeCompare(b.sessionTime)).map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.topic}</TableCell>
                    <TableCell>{mockTrainers.find(t => t.id === cls.trainer)?.name || 'N/A'}</TableCell>
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
             <p className="text-muted-foreground text-center py-8">No classes scheduled yet. Click "Add New Session" to get started.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-6 w-6 text-primary" /> AI Timetable Analysis</CardTitle>
            <CardDescription>Get AI-powered feedback on your current schedule based on curriculum guidelines.</CardDescription>
        </CardHeader>
        <Form {...curriculumUiForm}>
            <form onSubmit={curriculumUiForm.handleSubmit(handleAnalyzeTimetable)}>
                <CardContent className="space-y-4">
                     <FormField
                        control={curriculumUiForm.control}
                        name="guidelines"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Curriculum Guidelines & Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Describe subject priorities, required hours, preferred times, constraints, etc."
                                className="min-h-[100px] resize-y"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoadingAiAnalysis || scheduledClasses.length === 0}>
                        {isLoadingAiAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Analyze Schedule with AI
                    </Button>
                    {scheduledClasses.length === 0 && <p className="text-sm text-destructive">Add some classes to the schedule to enable analysis.</p>}
                </CardContent>
            </form>
        </Form>
        {isLoadingAiAnalysis && (
            <CardContent>
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing timetable, please wait...</span>
                </div>
            </CardContent>
        )}
        {aiAnalysisResult && !isLoadingAiAnalysis && (
            <CardContent className="space-y-6 pt-4">
                <Accordion type="multiple" defaultValue={['assessment', 'clashes']} className="w-full">
                    <AccordionItem value="assessment">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                                <BarChart3 className="mr-2 h-5 w-5" /> Overall Assessment
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="text-base text-muted-foreground">{aiAnalysisResult.overallAssessment}</p>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="clashes">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className={cn("flex items-center font-semibold", aiAnalysisResult.identifiedClashes.length > 0 ? "text-destructive" : "text-green-600")}>
                                <AlertOctagon className="mr-2 h-5 w-5" /> Identified Clashes ({aiAnalysisResult.identifiedClashes.length})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            {aiAnalysisResult.identifiedClashes.length > 0 ? (
                                aiAnalysisResult.identifiedClashes.map((clash, index) => (
                                    <div key={`clash-${index}`} className="p-4 border border-destructive/50 rounded-md bg-destructive/10 shadow">
                                        <h4 className="font-semibold text-destructive flex items-center"><AlertOctagon className="mr-2 h-5 w-5" /> {clash.description}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <span className="font-medium">Conflicting:</span> {clash.conflictingItems.join(', ')}
                                        </p>
                                        {clash.involvedClasses.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm font-medium">Involved Classes:</p>
                                                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                                                    {clash.involvedClasses.map((cls, clsIdx) => (
                                                        <li key={`clash-detail-${index}-${clsIdx}`}>
                                                            {cls.topic} on {cls.day} at {cls.time}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    <p>No clashes identified. Well done!</p>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="time-allocation">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                             <ListChecks className="mr-2 h-5 w-5" /> Time Allocation Feedback
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {aiAnalysisResult.timeAllocationFeedback.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                                    {aiAnalysisResult.timeAllocationFeedback.map((feedback, index) => (
                                        <li key={`timealloc-${index}`}>{feedback}</li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted-foreground">No specific time allocation feedback provided by AI.</p>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="suggestions">
                        <AccordionTrigger className="text-lg hover:no-underline">
                            <div className="flex items-center text-primary font-semibold">
                                <Lightbulb className="mr-2 h-5 w-5" /> General Suggestions
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                             {aiAnalysisResult.generalSuggestions.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                                    {aiAnalysisResult.generalSuggestions.map((suggestion, index) => (
                                        <li key={`gensuggest-${index}`}>{suggestion}</li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted-foreground">No general suggestions provided by AI.</p>}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
