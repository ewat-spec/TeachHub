
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, AlertTriangle, Award, TrendingDown, LineChart } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getAiStudentAnalysis } from "./actions";
import type { AnalyzeStudentPerformanceOutput } from "@/ai/flows/analyze-student-performance-flow";


const analysisFormSchema = z.object({
  studentDataCsv: z.string().min(20, { message: "Please provide student data in CSV format." }),
  analysisContext: z.string().optional(),
});
type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

const mockCsvData = `StudentName,Course,Mark,TotalMarks
Alice Wonderland,React Fundamentals,88,100
Bob The Builder,Safety Procedures,65,100
Charlie Chaplin,React Fundamentals,52,100
Alex DemoStudent,Automotive Engineering,95,100
Diana Prince,Advanced Calculus,45,100
Bruce Wayne,Advanced Calculus,98,100
Clark Kent,Safety Procedures,92,100
Peter Parker,React Fundamentals,75,100
Tony Stark,Automotive Engineering,78,100
Steve Rogers,Safety Procedures,85,100
Natasha Romanoff,Advanced Calculus,55,100
`;

export default function PerformanceAnalysisPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStudentPerformanceOutput | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      studentDataCsv: mockCsvData,
      analysisContext: "This is for the end-of-term review. Identify students for academic probation and those eligible for advanced placement.",
    },
    mode: "onChange",
  });

  async function onSubmit(data: AnalysisFormValues) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await getAiStudentAnalysis(data);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "The AI has finished analyzing the student data.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isClient) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeader title="AI Student Performance Analysis" />
        <Card><CardContent className="h-64 bg-muted rounded"></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Student Performance Analysis"
        description="Paste student data to get AI-driven insights into performance trends."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>Provide student performance data in CSV format below. Ensure the header includes StudentName, Course, Mark, and TotalMarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="studentDataCsv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Data (CSV)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="StudentName,Course,Mark,TotalMarks..."
                        className="min-h-[200px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="analysisContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Goal/Context (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Identify students for mid-term intervention." {...field} />
                    </FormControl>
                     <FormDescription>Providing context helps the AI tailor its analysis.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze Performance
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {isLoading && (
        <Card className="shadow-lg">
          <CardContent className="py-10 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">AI is analyzing the data...</p>
            <p className="text-sm text-muted-foreground">This may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>AI Analysis Results</CardTitle>
                <CardDescription>{analysisResult.summary}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={["top-performers", "students-to-watch"]} className="w-full">
                    <AccordionItem value="top-performers">
                        <AccordionTrigger className="text-lg text-green-700 hover:no-underline">
                            <div className="flex items-center"><Award className="mr-2 h-5 w-5"/> Top Performers ({analysisResult.topPerformers.length})</div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <ul className="space-y-3">
                                {analysisResult.topPerformers.map((student, index) => (
                                    <li key={`top-${index}`} className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded-r-md">
                                        <p className="font-semibold">{student.studentName} - {student.course}</p>
                                        <p className="text-sm text-muted-foreground">Score: {student.mark}/{student.totalMarks}</p>
                                        <p className="text-sm italic mt-1">Reason: "{student.reason}"</p>
                                    </li>
                                ))}
                           </ul>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="students-to-watch">
                        <AccordionTrigger className="text-lg text-amber-700 hover:no-underline">
                            <div className="flex items-center"><TrendingDown className="mr-2 h-5 w-5"/> Students to Watch ({analysisResult.studentsToWatch.length})</div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <ul className="space-y-3">
                                {analysisResult.studentsToWatch.map((student, index) => (
                                    <li key={`watch-${index}`} className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-md">
                                        <p className="font-semibold">{student.studentName} - {student.course}</p>
                                        <p className="text-sm text-muted-foreground">Score: {student.mark}/{student.totalMarks}</p>
                                        <p className="text-sm italic mt-1">Reason: "{student.reason}"</p>
                                    </li>
                                ))}
                           </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="trends">
                        <AccordionTrigger className="text-lg text-blue-700 hover:no-underline">
                             <div className="flex items-center"><LineChart className="mr-2 h-5 w-5"/> Overall Trends</div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                                {analysisResult.overallTrends.map((trend, index) => (
                                    <li key={`trend-${index}`}>{trend}</li>
                                ))}
                           </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
