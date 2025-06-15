
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, CheckCircle, CalendarIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { saveAssessment, deleteAssessment } from "./actions";

const assessmentFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: "Assessment title must be at least 3 characters." }),
  topic: z.string().min(3, { message: "Associated topic must be at least 3 characters." }),
  instructions: z.string().optional(),
  questions: z.string().min(10, { message: "Questions must be at least 10 characters." }),
  totalMarks: z.coerce.number().positive({ message: "Total marks must be a positive number." }),
  testDate: z.date({ required_error: "Test date is required." }),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

interface Assessment extends AssessmentFormValues {
  id: string;
}

const initialAssessments: Assessment[] = [
  { id: "cat1", title: "CAT 1: React Fundamentals", topic: "Introduction to React", instructions: "Answer all questions. Duration: 1 hour.", questions: "1. What is JSX?\n2. Explain the concept of state in React.", totalMarks: 20, testDate: new Date("2024-10-01") },
  { id: "cat2", title: "Mid-Term: Advanced CSS", topic: "Advanced CSS Techniques", instructions: "Attempt any two questions from Section A, and all from Section B.", questions: "Section A:\n1. Describe CSS Specificity.\n2. Explain Flexbox vs Grid.\nSection B:\n1. Implement a responsive navigation bar.", totalMarks: 50, testDate: new Date("2024-10-15") },
];

export default function AssessmentsPage() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: { title: "", topic: "", instructions: "", questions: "", totalMarks: 10 },
    mode: "onChange",
  });

  useEffect(() => {
    if (editingAssessment) {
      form.reset({
        ...editingAssessment,
        testDate: new Date(editingAssessment.testDate),
      });
      setIsFormOpen(true);
    } else {
      form.reset({ title: "", topic: "", instructions: "", questions: "", totalMarks: 10, testDate: undefined });
    }
  }, [editingAssessment, form]);

  async function onSubmit(data: AssessmentFormValues) {
    try {
      const result = await saveAssessment(data); // Using placeholder action
      if (result.success) {
        if (editingAssessment) {
          setAssessments(assessments.map(asm => asm.id === editingAssessment.id ? { ...data, id: editingAssessment.id } as Assessment : asm));
        } else {
          setAssessments([...assessments, { ...data, id: result.id! } as Assessment]);
        }
        toast({ title: editingAssessment ? "Assessment Updated" : "Assessment Saved", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setEditingAssessment(null);
        setIsFormOpen(false);
        form.reset();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save assessment.", variant: "destructive" });
    }
  }

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
  };

  const handleDelete = async (assessmentId: string) => {
    try {
      const result = await deleteAssessment(assessmentId); // Using placeholder action
      if (result.success) {
        setAssessments(assessments.filter(asm => asm.id !== assessmentId));
        toast({ title: "Assessment Deleted", description: result.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete assessment.", variant: "destructive" });
    }
  };

  const openNewForm = () => {
    setEditingAssessment(null);
    form.reset({ title: "", topic: "", instructions: "", questions: "", totalMarks: 10, testDate: undefined });
    setIsFormOpen(true);
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assessments" description="Create and manage Continuous Assessment Tests (CATs)." />
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
        title="My Assessments"
        description="Create and manage Continuous Assessment Tests (CATs) and other evaluations."
        actions={
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Assessment
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingAssessment ? "Edit Assessment" : "Create New Assessment"}</CardTitle>
            <CardDescription>{editingAssessment ? "Update the details of this assessment." : "Fill in the form to create a new assessment."}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Title</FormLabel>
                      <FormControl><Input placeholder="e.g., CAT 1: Introduction to Programming" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Topic / Course</FormLabel>
                       <FormControl><Input placeholder="e.g., Python Basics" {...field} /></FormControl>
                      <FormDescription>Link this assessment to a specific topic or course.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Provide any instructions for the assessment (e.g., duration, allowed materials)." {...field} className="min-h-[100px] resize-y" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="questions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Questions</FormLabel>
                      <FormControl><Textarea placeholder="Enter the questions for this assessment. You can number them or format as needed." {...field} className="min-h-[150px] resize-y" /></FormControl>
                      <FormDescription>For now, enter all questions here. More structured question types will be added later.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="totalMarks"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="testDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Test Date</FormLabel>
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
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingAssessment(null); form.reset();}}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : (editingAssessment ? "Update Assessment" : "Save Assessment")}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">My Assessments List</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="hidden md:table-cell">Test Date</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.sort((a,b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()).map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.topic}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(assessment.testDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{assessment.totalMarks}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(assessment)} className="mr-2 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(assessment.id)} className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No assessments created yet. Click "Create New Assessment" to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
