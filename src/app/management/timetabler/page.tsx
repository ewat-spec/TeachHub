
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, AlertTriangle, GanttChartSquare, Brain, ListChecks, AlertOctagon, Lightbulb, BarChart3, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getAiTimetableAnalysis } from "@/app/trainer/schedule/actions"; // Re-using trainer's action
import type { AnalyzeTimetableOutput, AnalyzeTimetableInput } from "@/ai/flows/analyze-timetable-flow";

// Mock data - In a real app, this would come from a central service or database
const mockTrainers = [
  { id: "trainer1", name: "John Smith" },
  { id: "trainer2", name: "Alice Johnson" },
  { id: "trainer3", name: "Robert Brown" },
  { id: "trainerJane", name: "Jane Doe" },
];

const initialScheduledClasses: AnalyzeTimetableInput['scheduledClasses'] = [
  { topic: "Introduction to React", trainerName: "Jane Doe", dayOfWeek: format(new Date("2024-09-15"), "EEEE"), startTime: "10:00", durationHours: 2, venue: "Room A101" },
  { topic: "Advanced CSS Techniques", trainerName: "Alice Johnson", dayOfWeek: format(new Date("2024-09-16"), "EEEE"), startTime: "14:00", durationHours: 1.5, venue: "Online Webinar" },
  { topic: "State Management in React", trainerName: "Jane Doe", dayOfWeek: format(new Date("2024-09-17"), "EEEE"), startTime: "09:00", durationHours: 3, venue: "Room B203" },
  { topic: "Python for Data Science", trainerName: "John Smith", dayOfWeek: format(new Date("2024-09-15"), "EEEE"), startTime: "10:00", durationHours: 2, venue: "Lab 1" }, // Potential clash with Jane Doe
  { topic: "Project Management 101", trainerName: "Robert Brown", dayOfWeek: format(new Date("2024-09-18"), "EEEE"), startTime: "11:00", durationHours: 2, venue: "Room A101" },
];

const curriculumFormSchema = z.object({
  guidelines: z.string().min(10, { message: "Please provide some curriculum guidelines for analysis."}),
});
type CurriculumFormValues = z.infer<typeof curriculumFormSchema>;


export default function TimetablerDashboardPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeTimetableOutput | null>(null);
  const [isLoadingAiAnalysis, setIsLoadingAiAnalysis] = useState(false);
  // For now, use mock scheduled data. In a real app, fetch this.
  const [currentOverallSchedule, setCurrentOverallSchedule] = useState<AnalyzeTimetableInput['scheduledClasses']>(initialScheduledClasses);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const curriculumUiForm = useForm<CurriculumFormValues>({
    resolver: zodResolver(curriculumFormSchema),
    defaultValues: {
      guidelines: "E.g., Maths: 5 hours/week, prefer morning slots. English: 4 hours/week. Science labs need 2-hour blocks. Max 2 consecutive theory classes. Trainer John Smith is unavailable on Friday afternoons.",
    },
     mode: "onChange",
  });

  const handleAnalyzeTimetable = async (data: CurriculumFormValues) => {
    if (currentOverallSchedule.length === 0) {
      toast({ title: "No Classes", description: "The current schedule is empty. Add classes to analyze.", variant: "destructive" });
      return;
    }
    setIsLoadingAiAnalysis(true);
    setAiAnalysisResult(null);

    try {
      const analysis = await getAiTimetableAnalysis({
        curriculumGuidelines: data.guidelines,
        scheduledClasses: currentOverallSchedule, // Use the overall schedule
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
      <div className="container mx-auto">
        <PageHeader
          title="Timetabler's Dashboard"
          description="Tools for creating, managing, and analyzing institution timetables."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
                 <Card key={i} className="shadow-lg animate-pulse">
                    <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                    <CardContent><div className="h-24 bg-muted rounded"></div></CardContent>
                </Card>
            ))}
        </div>
      </div>>
    )
  }

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Timetabler's Dashboard"
        description="Tools for creating, managing, and analyzing institution timetables."
      />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Timetable Overview</CardTitle>
            <GanttChartSquare className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View current term timetables and resource usage. (Placeholder)
            </p>
            <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Full Timetable Grid Coming Soon</p>
            </div>
            {/* Placeholder for displaying a summary or link to full timetable */}
            <Button variant="outline" className="mt-4 w-full" onClick={() => toast({title: "Feature Pending", description: "Full timetable view will be implemented here."})}>View Full Timetable</Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
              <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-6 w-6 text-primary" /> AI Timetable Analysis</CardTitle>
              <CardDescription>Get AI-powered feedback on the institution's schedule based on curriculum guidelines.</CardDescription>
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
                                  placeholder="Describe subject priorities, required hours, preferred times, constraints (e.g., trainer availability, venue capacities)..."
                                  className="min-h-[120px] resize-y"
                                  {...field}
                                  />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <Button type="submit" disabled={isLoadingAiAnalysis || currentOverallSchedule.length === 0} className="w-full md:w-auto">
                          {isLoadingAiAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Analyze Full Schedule with AI
                      </Button>
                      {currentOverallSchedule.length === 0 && <p className="text-sm text-destructive">Schedule data is empty. Add classes to enable analysis.</p>}
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

        <Card className="shadow-lg lg:col-span-1"> {/* Adjusted to lg:col-span-1, previously was part of a 3-col grid for place holders*/}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Resource Management</CardTitle>
            <CheckSquare className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage venues, trainer availability, and equipment scheduling. (Placeholder)
            </p>
            <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Resource Tools Coming Soon</p>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => toast({title: "Feature Pending", description: "Resource management tools will be implemented here."})}>Manage Resources</Button>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Timetabler's Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This dashboard provides tools to build and optimize class schedules,
            manage resources, and leverage AI to identify potential issues and improvements
            in the institution's timetable. The AI analysis tool is now integrated above.
            Further enhancements will include direct timetable editing and publishing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    