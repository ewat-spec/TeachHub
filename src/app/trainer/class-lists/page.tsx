"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle, Save, UsersRound, ClipboardEdit, FileText } from "lucide-react";

import type { Course, Student, AssessmentGrading, StudentMarkEntry } from "./data";
import { 
  getTrainerCourses, 
  getEnrolledStudents, 
  getAssessmentsForCourse, 
  getStudentMarksForAssessment,
  saveAllStudentMarks
} from "./actions";

const markEntrySchema = z.object({
  studentId: z.string(),
  studentName: z.string(), // For display
  assessmentId: z.string(),
  mark: z.union([z.string().optional(), z.number().optional()]), // Allow empty string or number
  comments: z.string().optional(),
});

const classListGradingFormSchema = z.object({
  selectedCourseId: z.string().min(1, "Please select a course."),
  selectedAssessmentId: z.string().min(1, "Please select an assessment."),
  marks: z.array(markEntrySchema),
});

type ClassListGradingFormValues = z.infer<typeof classListGradingFormSchema>;

export default function ClassListsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<AssessmentGrading[]>([]);
  const [currentAssessmentDetails, setCurrentAssessmentDetails] = useState<AssessmentGrading | null>(null);

  const form = useForm<ClassListGradingFormValues>({
    resolver: zodResolver(classListGradingFormSchema),
    defaultValues: {
      selectedCourseId: "",
      selectedAssessmentId: "",
      marks: [],
    },
    mode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "marks",
  });

  const selectedCourseId = form.watch("selectedCourseId");
  const selectedAssessmentId = form.watch("selectedAssessmentId");

  useEffect(() => {
    setIsClient(true);
    async function fetchCourses() {
      try {
        const fetchedCourses = await getTrainerCourses();
        setCourses(fetchedCourses);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch courses.", variant: "destructive" });
      } finally {
        setIsLoadingCourses(false);
      }
    }
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    if (selectedCourseId) {
      setStudents([]);
      setAssessments([]);
      form.setValue("selectedAssessmentId", "");
      replace([]); // Clear marks array

      async function fetchStudentsAndAssessments() {
        setIsLoadingStudents(true);
        setIsLoadingAssessments(true);
        try {
          const [fetchedStudents, fetchedAssessments] = await Promise.all([
            getEnrolledStudents(selectedCourseId),
            getAssessmentsForCourse(selectedCourseId)
          ]);
          setStudents(fetchedStudents);
          setAssessments(fetchedAssessments);
        } catch (error) {
          toast({ title: "Error", description: "Could not fetch students or assessments for the course.", variant: "destructive" });
        } finally {
          setIsLoadingStudents(false);
          setIsLoadingAssessments(false);
        }
      }
      fetchStudentsAndAssessments();
    } else {
      setStudents([]);
      setAssessments([]);
      replace([]);
    }
  }, [selectedCourseId, toast, form, replace]);

  useEffect(() => {
    if (selectedCourseId && selectedAssessmentId && students.length > 0) {
      setCurrentAssessmentDetails(assessments.find(a => a.id === selectedAssessmentId) || null);
      setIsLoadingMarks(true);
      async function fetchAndPopulateMarks() {
        try {
          const existingMarks = await getStudentMarksForAssessment(selectedAssessmentId);
          const marksForForm = students.map(student => {
            const existingMark = existingMarks.find(m => m.studentId === student.id);
            return {
              studentId: student.id,
              studentName: student.name,
              assessmentId: selectedAssessmentId,
              mark: existingMark?.mark !== undefined ? String(existingMark.mark) : "", // Ensure string for input
              comments: existingMark?.comments || "",
            };
          });
          replace(marksForForm);
        } catch (error) {
           toast({ title: "Error loading marks", description: "Could not fetch existing student marks.", variant: "destructive" });
           // Populate with empty marks if fetch fails
            const emptyMarksForForm = students.map(student => ({
                studentId: student.id,
                studentName: student.name,
                assessmentId: selectedAssessmentId,
                mark: "",
                comments: "",
            }));
            replace(emptyMarksForForm);
        } finally {
            setIsLoadingMarks(false);
        }
      }
      fetchAndPopulateMarks();
    } else {
      replace([]); // Clear marks if no assessment/students
      setCurrentAssessmentDetails(null);
    }
  }, [selectedCourseId, selectedAssessmentId, students, assessments, replace, toast]);

  const onSubmit = async (data: ClassListGradingFormValues) => {
    if (!currentAssessmentDetails) {
        toast({title: "Error", description: "No assessment selected or details are missing.", variant: "destructive"});
        return;
    }

    const marksToSave: StudentMarkEntry[] = data.marks.map(m => {
        const markValue = m.mark === "" || m.mark === undefined ? undefined : Number(m.mark);
        if (markValue !== undefined && (isNaN(markValue) || markValue < 0 || markValue > currentAssessmentDetails.totalMarks)) {
            throw new Error(`Invalid mark for ${m.studentName}. Mark must be between 0 and ${currentAssessmentDetails.totalMarks}.`);
        }
        return {
            studentId: m.studentId,
            assessmentId: data.selectedAssessmentId,
            mark: markValue,
            comments: m.comments,
        };
    });
    
    try {
      const result = await saveAllStudentMarks(marksToSave);
      if (result.success) {
        toast({ title: "Marks Saved", description: result.message, action: <CheckCircle className="text-green-500" /> });
      } else {
        toast({ title: "Saving Error", description: result.message, variant: "destructive" });
        if (result.errors && result.errors.length > 0) {
            result.errors.forEach(errMsg => {
                toast({ title: "Validation Error", description: errMsg, variant: "destructive", duration: 7000 });
            });
        }
      }
    } catch (error) {
      toast({ title: "Submission Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
    }
  };
  
  const getMarkInputPlaceholder = () => {
    return currentAssessmentDetails ? `0 - ${currentAssessmentDetails.totalMarks}` : "Enter mark";
  };


  if (!isClient) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeader title="Class Lists & Grading" description="Select a class and assessment to enter student marks." />
        <Card><CardContent className="h-20 bg-muted rounded"></CardContent></Card>
        <Card><CardContent className="h-64 bg-muted rounded"></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Lists & Grading"
        description="Select your class and an assessment to view students and enter their marks."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Select Course & Assessment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="selectedCourseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My Courses</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoadingCourses}>
                          <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isLoadingCourses && courses.length === 0 && <SelectItem value="" disabled>No courses found</SelectItem>}
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.name} ({course.level}) - {course.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selectedAssessmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment for Selected Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!selectedCourseId || isLoadingAssessments || assessments.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedCourseId ? "Select a course first" : 
                            isLoadingAssessments ? "Loading assessments..." :
                            assessments.length === 0 ? "No assessments for this course" :
                            "Select an assessment"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {assessments.map(assessment => (
                          <SelectItem key={assessment.id} value={assessment.id}>{assessment.title} (Max: {assessment.totalMarks})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {selectedCourseId && selectedAssessmentId && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <UsersRound className="mr-2 h-5 w-5 text-primary"/>
                  Student List for: {courses.find(c => c.id === selectedCourseId)?.name}
                </CardTitle>
                <CardDescription>
                  Entering marks for assessment: {currentAssessmentDetails?.title} (Total Marks: {currentAssessmentDetails?.totalMarks})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStudents || isLoadingMarks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading student data...</p>
                  </div>
                ) : students.length > 0 && fields.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] sm:w-[250px]">Student Name</TableHead>
                          <TableHead className="w-[150px] hidden sm:table-cell">Admission No.</TableHead>
                          <TableHead className="w-[100px] sm:w-[120px]">Mark</TableHead>
                          <TableHead>Comments (Optional)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((item, index) => {
                          const student = students.find(s => s.id === item.studentId);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.studentName}</TableCell>
                              <TableCell className="hidden sm:table-cell">{student?.admissionNumber}</TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`marks.${index}.mark`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          placeholder={getMarkInputPlaceholder()}
                                          {...field} 
                                          onChange={e => {
                                            const val = e.target.value;
                                            if (val === "" || (/^\d*\.?\d*$/.test(val))) { // Allow empty or numeric
                                                field.onChange(val);
                                            }
                                          }}
                                          className="max-w-[100px]" 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`marks.${index}.comments`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Textarea placeholder="Any specific feedback..." {...field} className="min-h-[40px] text-sm"/>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UsersRound className="mx-auto h-12 w-12 mb-2"/>
                    <p>No students enrolled in this course, or no assessment selected with students.</p>
                  </div>
                )}
              </CardContent>
              {students.length > 0 && fields.length > 0 && (
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Marks
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
           {selectedCourseId && !selectedAssessmentId && !isLoadingAssessments && assessments.length > 0 && (
                <Card className="shadow-lg border-primary/50">
                    <CardContent className="pt-6 text-center">
                        <ClipboardEdit className="mx-auto h-10 w-10 text-primary mb-3"/>
                        <p className="font-semibold text-lg text-primary">Select an Assessment</p>
                        <p className="text-muted-foreground">Please choose an assessment from the dropdown above to proceed with grading.</p>
                    </CardContent>
                </Card>
            )}
            {selectedCourseId && !isLoadingAssessments && assessments.length === 0 && (
                 <Card className="shadow-lg border-amber-500/50">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3"/>
                        <p className="font-semibold text-lg text-amber-700">No Assessments Found</p>
                        <p className="text-muted-foreground">There are no assessments set up for the selected course: <span className="font-medium">{courses.find(c => c.id === selectedCourseId)?.name || 'the selected course'}</span>. Please add assessments in the "My Assessments" section.</p>
                         <Button variant="link" onClick={() => {/*router.push('/trainer/assessments')*/ toast({title: "Navigate to Assessments", description: "You can create assessments in the 'My Assessments' page from the sidebar."})}} className="mt-2">
                            Go to My Assessments
                        </Button>
                    </CardContent>
                </Card>
            )}

        </form>
      </Form>
    </div>
  );
}
