
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
import { Loader2, AlertTriangle, CheckCircle, Save, UsersRound, ClipboardEdit, FileText, Share2 } from "lucide-react";

import type { Course, Student, AssessmentGrading, StudentMarkEntry } from "./data";
import { 
  getTrainerCourses, 
  getEnrolledStudents, 
  getAssessmentsForCourse, 
  getStudentMarksForAssessment,
  saveAllStudentMarks,
  updateCourseSharedResources
} from "./actions";

const resourceFormSchema = z.object({
  videoLinksString: z.string().optional(),
  imageLinksString: z.string().optional(),
});
type ResourceFormValues = z.infer<typeof resourceFormSchema>;

const markEntrySchema = z.object({
  studentId: z.string(),
  studentName: z.string(), 
  assessmentId: z.string(),
  mark: z.union([z.string().optional(), z.number().optional()]), 
  comments: z.string().optional(),
});

const gradingFormSchema = z.object({
  marks: z.array(markEntrySchema),
});
type GradingFormValues = z.infer<typeof gradingFormSchema>;


export default function ClassListsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<AssessmentGrading[]>([]);
  const [currentAssessmentDetails, setCurrentAssessmentDetails] = useState<AssessmentGrading | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");


  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      videoLinksString: "",
      imageLinksString: "",
    },
    mode: "onChange",
  });

  const gradingForm = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      marks: [],
    },
    mode: "onChange",
  });

  const { fields: marksFields, replace: replaceMarks } = useFieldArray({
    control: gradingForm.control,
    name: "marks",
  });


  useEffect(() => {
    setIsClient(true);
    async function fetchInitialCourses() {
      setIsLoadingCourses(true);
      try {
        const fetchedCourses = await getTrainerCourses();
        setCourses(fetchedCourses);
      } catch (error) {
        toast({ title: "Error Fetching Courses", description: error instanceof Error ? error.message : "Could not fetch courses.", variant: "destructive" });
      } finally {
        setIsLoadingCourses(false);
      }
    }
    fetchInitialCourses();
  }, [toast]);

  const handleCourseChange = useCallback(async (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedAssessmentId(""); 
    setStudents([]);
    setAssessments([]);
    replaceMarks([]);
    resourceForm.reset({ videoLinksString: "", imageLinksString: "" }); 

    if (courseId) {
      setIsLoadingResources(true);
      setIsLoadingStudents(true);
      setIsLoadingAssessments(true);
      try {
        const currentCourse = courses.find(c => c.id === courseId);
        if (currentCourse) {
            resourceForm.setValue("videoLinksString", (currentCourse.sharedVideoLinks || []).join(', '));
            resourceForm.setValue("imageLinksString", (currentCourse.sharedImageLinks || []).join(', '));
        }

        const [fetchedStudents, fetchedAssessments] = await Promise.all([
          getEnrolledStudents(courseId),
          getAssessmentsForCourse(courseId)
        ]);
        setStudents(fetchedStudents);
        setAssessments(fetchedAssessments);
      } catch (error) {
        toast({ title: "Error Loading Course Data", description: error instanceof Error ? error.message : "Could not fetch students or assessments.", variant: "destructive" });
      } finally {
        setIsLoadingResources(false);
        setIsLoadingStudents(false);
        setIsLoadingAssessments(false);
      }
    }
  }, [courses, resourceForm, replaceMarks, toast]);
  
  useEffect(() => {
    if (selectedCourseId && selectedAssessmentId && students.length > 0) {
      const assessmentDetails = assessments.find(a => a.id === selectedAssessmentId);
      setCurrentAssessmentDetails(assessmentDetails || null);
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
              mark: existingMark?.mark !== undefined ? String(existingMark.mark) : "",
              comments: existingMark?.comments || "",
            };
          });
          replaceMarks(marksForForm);
        } catch (error) {
           toast({ title: "Error Loading Marks", description: error instanceof Error ? error.message : "Could not fetch student marks.", variant: "destructive" });
            const emptyMarksForForm = students.map(student => ({
                studentId: student.id,
                studentName: student.name,
                assessmentId: selectedAssessmentId,
                mark: "",
                comments: "",
            }));
            replaceMarks(emptyMarksForForm);
        } finally {
            setIsLoadingMarks(false);
        }
      }
      fetchAndPopulateMarks();
    } else {
      replaceMarks([]); 
      setCurrentAssessmentDetails(null);
    }
  }, [selectedCourseId, selectedAssessmentId, students, assessments, replaceMarks, toast]);

  const onResourceSubmit = async (data: ResourceFormValues) => {
    if (!selectedCourseId) {
      toast({ title: "No Course Selected", description: "Please select a course to update resources.", variant: "destructive" });
      return;
    }
    setIsLoadingResources(true);
    try {
      const result = await updateCourseSharedResources(selectedCourseId, data.videoLinksString || "", data.imageLinksString || "");
      if (result.success) {
        toast({ title: "Resources Updated", description: result.message, action: <CheckCircle className="text-green-500" /> });
        const updatedCourses = courses.map(c => 
            c.id === selectedCourseId ? {
                ...c, 
                sharedVideoLinks: (data.videoLinksString || "").split(',').map(s => s.trim()).filter(s => s),
                sharedImageLinks: (data.imageLinksString || "").split(',').map(s => s.trim()).filter(s => s)
            } : c
        );
        setCourses(updatedCourses);
      } else {
        toast({ title: "Resource Update Error", description: result.message || "Could not update resources.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Submission Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoadingResources(false);
    }
  };

  const onGradingSubmit = async (data: GradingFormValues) => {
    if (!currentAssessmentDetails || !selectedAssessmentId) {
        toast({title: "Error", description: "No assessment selected or details are missing.", variant: "destructive"});
        return;
    }
    let clientSideValidationError = false;
    gradingForm.clearErrors(); 

    const marksToSave: StudentMarkEntry[] = data.marks.map((m, index) => {
        const markString = String(m.mark).trim();
        let markValue: number | undefined = undefined;

        if (markString === "") {
            markValue = undefined; 
        } else if (!/^\d*\.?\d*$/.test(markString) || isNaN(parseFloat(markString))) {
            gradingForm.setError(`marks.${index}.mark`, { type: "manual", message: "Invalid number." });
            clientSideValidationError = true;
        } else {
            markValue = parseFloat(markString);
            if (markValue < 0 || markValue > currentAssessmentDetails.totalMarks) {
                gradingForm.setError(`marks.${index}.mark`, { type: "manual", message: `Max: ${currentAssessmentDetails.totalMarks}` });
                clientSideValidationError = true;
            }
        }
        
        return {
            studentId: m.studentId,
            assessmentId: selectedAssessmentId,
            mark: markValue, 
            comments: m.comments,
        };
    });
    
    if (clientSideValidationError) {
        toast({title: "Validation Error", description: "Please correct the highlighted marks before saving.", variant: "destructive"});
        return;
    }
    
    try {
      const result = await saveAllStudentMarks(marksToSave);
      if (result.success) {
        toast({ title: "Marks Saved", description: result.message, action: <CheckCircle className="text-green-500" /> });
      } else {
        toast({ title: "Saving Error", description: result.message || "Could not save all marks.", variant: "destructive" });
        if (result.errors && result.errors.length > 0) {
            result.errors.forEach(errMsg => {
                toast({ title: "Individual Save Error", description: errMsg, variant: "destructive", duration: 7000 });
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Select Course & Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem>
            <FormLabel>My Courses</FormLabel>
            <Select onValueChange={handleCourseChange} value={selectedCourseId} disabled={isLoadingCourses}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {!isLoadingCourses && courses.length === 0 && <SelectItem value="NO_COURSES_DUMMY_VALUE" disabled>No courses found</SelectItem>}
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.name} ({course.level}) - {course.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          
          <FormItem>
            <FormLabel>Assessment for Selected Course</FormLabel>
            <Select 
              onValueChange={(value) => setSelectedAssessmentId(value)} 
              value={selectedAssessmentId} 
              disabled={!selectedCourseId || isLoadingAssessments || assessments.length === 0}
            >
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
          </FormItem>
        </CardContent>
      </Card>

      {selectedCourseId && (
        <div className="space-y-6">
          <Form {...resourceForm} key={`resource-form-${selectedCourseId || 'EMPTY_COURSE_KEY'}`}>
            <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary" />Manage Shared Resources for: {courses.find(c => c.id === selectedCourseId)?.name}</CardTitle>
                  <CardDescription>Add or update comma-separated URLs for videos and images to share with students for this course.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={resourceForm.control}
                    name="videoLinksString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URLs (comma-separated)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., https://youtu.be/..., https://vimeo.com/..." {...field} className="min-h-[80px]" disabled={isLoadingResources} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resourceForm.control}
                    name="imageLinksString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URLs (comma-separated)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.png" {...field} className="min-h-[80px]" disabled={isLoadingResources} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isLoadingResources || resourceForm.formState.isSubmitting}>
                    {isLoadingResources || resourceForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Resources
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>

          {selectedAssessmentId && students.length > 0 && (
             <Form {...gradingForm} key={`grading-form-${selectedCourseId || 'EMPTY_COURSE_GRADING_KEY'}-${selectedAssessmentId || 'EMPTY_ASSESSMENT_KEY'}`}>
              <form onSubmit={gradingForm.handleSubmit(onGradingSubmit)}>
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
                    ) : marksFields.length > 0 ? (
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
                            {marksFields.map((item, index) => {
                              const student = students.find(s => s.id === item.studentId);
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.studentName}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{student?.admissionNumber}</TableCell>
                                  <TableCell>
                                    <FormField
                                      control={gradingForm.control}
                                      name={`marks.${index}.mark`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              type="text" 
                                              placeholder={getMarkInputPlaceholder()}
                                              {...field} 
                                              onChange={e => {
                                                const val = e.target.value;
                                                if (val === "" || (/^\d*\.?\d*$/.test(val) && val.split('.').length <=2 && (val.split('.')[1]?.length || 0) <= 2)) {
                                                    field.onChange(val);
                                                    gradingForm.clearErrors(`marks.${index}.mark`); 
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
                                      control={gradingForm.control}
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
                  {marksFields.length > 0 && (
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={gradingForm.formState.isSubmitting}>
                        {gradingForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Marks
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </form>
            </Form>
          )}
          
          {selectedCourseId && !selectedAssessmentId && !isLoadingAssessments && assessments.length > 0 && (
            <Card className="shadow-lg border-primary/50 mt-6">
                <CardContent className="pt-6 text-center">
                    <ClipboardEdit className="mx-auto h-10 w-10 text-primary mb-3"/>
                    <p className="font-semibold text-lg text-primary">Select an Assessment</p>
                    <p className="text-muted-foreground">Please choose an assessment from the dropdown above to proceed with grading.</p>
                </CardContent>
            </Card>
          )}
          {selectedCourseId && !isLoadingAssessments && assessments.length === 0 && (
              <Card className="shadow-lg border-amber-500/50 mt-6">
                <CardContent className="pt-6 text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3"/>
                    <p className="font-semibold text-lg text-amber-700">No Assessments Found</p>
                    <p className="text-muted-foreground">There are no assessments set up for: <span className="font-medium">{courses.find(c => c.id === selectedCourseId)?.name || 'the selected course'}</span>.</p>
                    <Button variant="link" onClick={() => toast({title: "Navigate to Assessments", description: "You can create assessments in the 'My Assessments' page."})} className="mt-2">
                        Go to My Assessments
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

    