
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle, Save, Printer, FileSpreadsheet, PlusCircle, Edit, Trash2, FileText, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Course, Marksheet, CourseResource } from "./data";
import { getTrainerCourses, getMarksheetData, saveMarks, updateCourseResources } from "./actions";
import { Badge } from "@/components/ui/badge";

// Type for the state that holds the current marks in the UI
type MarksState = Record<string, { mark: string; comments: string; isDirty: boolean }>;

const resourceTypes = ["PDF", "Video", "Link", "Document", "Image"] as const;

const resourceFormSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters."),
  url: z.string().url("Please enter a valid URL."),
  type: z.enum(resourceTypes, { required_error: "Please select a resource type."}),
});
type ResourceFormValues = z.infer<typeof resourceFormSchema>;


export default function CoursesAndGradingPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [marksheetData, setMarksheetData] = useState<Marksheet | null>(null);

  // State to manage the marks entered in the input fields
  const [marksState, setMarksState] = useState<MarksState>({});
  
  // State for resource management
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CourseResource | null>(null);

  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: { id: "", title: "", url: "", type: "Link" },
  });


  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const fetchedCourses = await getTrainerCourses();
      setCourses(fetchedCourses);
    } catch (error) {
      toast({ title: "Error Fetching Courses", description: error instanceof Error ? error.message : "Could not fetch courses.", variant: "destructive" });
    } finally {
      setIsLoadingCourses(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClient(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseChange = useCallback(async (courseId: string) => {
    setSelectedCourseId(courseId);
    setMarksheetData(null);
    setMarksState({});

    if (courseId) {
      setIsLoadingData(true);
      try {
        const data = await getMarksheetData(courseId);
        setMarksheetData(data);
        if (data) {
          const initialMarks: MarksState = {};
          data.students.forEach(student => {
            data.assessments.forEach(assessment => {
              const markEntry = data.marks.find(m => m.studentId === student.id && m.assessmentId === assessment.id);
              const key = `${student.id}_${assessment.id}`;
              initialMarks[key] = {
                mark: markEntry?.mark !== null && markEntry?.mark !== undefined ? String(markEntry.mark) : "",
                comments: markEntry?.comments || "",
                isDirty: false,
              };
            });
          });
          setMarksState(initialMarks);
        }
      } catch (error) {
        toast({ title: "Error Loading Data", description: error instanceof Error ? error.message : "Could not fetch course data.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [toast]);

  const handleMarkChange = (studentId: string, assessmentId: string, value: string) => {
    const key = `${studentId}_${assessmentId}`;
    setMarksState(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { comments: '', mark: '' }), mark: value, isDirty: true },
    }));
  };
  
  const handleCommentChange = (studentId: string, assessmentId: string, value: string) => {
    const key = `${studentId}_${assessmentId}`;
    setMarksState(prev => ({
        ...prev,
        [key]: { ...(prev[key] || { comments: '', mark: '' }), comments: value, isDirty: true },
    }));
  };

  const handleSaveChanges = async () => {
    if (!marksheetData) return;
    setIsSaving(true);

    const dirtyEntries = Object.entries(marksState)
      .filter(([, value]) => value.isDirty)
      .map(([key, value]) => {
        const [studentId, assessmentId] = key.split('_');
        const markAsNumber = value.mark.trim() === '' ? null : Number(value.mark);
        return {
          studentId,
          assessmentId,
          mark: markAsNumber,
          comments: value.comments,
        };
      });

    if (dirtyEntries.length === 0) {
      toast({ title: "No Changes", description: "There are no changes to save." });
      setIsSaving(false);
      return;
    }
    
    const totalMarksMap = Object.fromEntries(marksheetData.assessments.map(a => [a.id, a.totalMarks]));

    const result = await saveMarks(dirtyEntries, totalMarksMap);
    
    if (result.success) {
      toast({ title: "Marks Saved", description: result.message, action: <CheckCircle className="text-green-500" /> });
      setMarksState(prev => {
        const newState = { ...prev };
        dirtyEntries.forEach(entry => {
          const key = `${entry.studentId}_${entry.assessmentId}`;
          if (newState[key]) newState[key].isDirty = false;
        });
        return newState;
      });
    } else {
      toast({ title: "Save Error", description: result.message, variant: "destructive" });
      result.errors.forEach(err => {
         toast({ title: "Validation Error", description: `${err.message} for one of the students.`, variant: "destructive", duration: 7000 });
      });
    }
    setIsSaving(false);
  };
  
  const handleResourceFormSubmit = async (data: ResourceFormValues) => {
    if (!marksheetData) return;
    
    const currentResources = marksheetData.course.resources || [];
    let updatedResources: CourseResource[];

    if (editingResource) {
        updatedResources = currentResources.map(r => r.id === editingResource.id ? data : r);
    } else {
        updatedResources = [...currentResources, { ...data, id: `res_${Date.now()}` }];
    }

    setIsSaving(true);
    const result = await updateCourseResources(marksheetData.course.id, updatedResources);
    setIsSaving(false);

    if (result.success) {
        toast({ title: editingResource ? "Resource Updated" : "Resource Added", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setMarksheetData(prev => prev ? ({ ...prev, course: { ...prev.course, resources: updatedResources }}) : null);
        setIsResourceModalOpen(false);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleOpenResourceModal = (resource: CourseResource | null) => {
    setEditingResource(resource);
    if (resource) {
        resourceForm.reset(resource);
    } else {
        resourceForm.reset({ id: "", title: "", url: "", type: "Link" });
    }
    setIsResourceModalOpen(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!marksheetData) return;
    const updatedResources = (marksheetData.course.resources || []).filter(r => r.id !== resourceId);
    
    setIsSaving(true);
    const result = await updateCourseResources(marksheetData.course.id, updatedResources);
    setIsSaving(false);
    
    if (result.success) {
        toast({ title: "Resource Deleted", description: result.message, variant: "destructive" });
        setMarksheetData(prev => prev ? ({ ...prev, course: { ...prev.course, resources: updatedResources }}) : null);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const getResourceTypeIcon = (type: CourseResource['type']) => {
    switch (type) {
        case 'PDF': return <FileText className="h-5 w-5 text-red-500" />;
        case 'Video': return <Video className="h-5 w-5 text-blue-500" />;
        case 'Image': return <FileText className="h-5 w-5 text-green-500" />;
        case 'Document': return <FileText className="h-5 w-5 text-purple-500" />;
        case 'Link': default: return <LinkIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handlePrint = () => {
      window.print();
  };

  const hasDirtyChanges = useMemo(() => Object.values(marksState).some(m => m.isDirty), [marksState]);

  if (!isClient) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeader title="Courses & Grading" />
        <Card><CardContent className="h-24 bg-muted rounded"></CardContent></Card>
        <Card><CardContent className="h-64 bg-muted rounded"></CardContent></Card>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tbody { display: table-row-group; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; font-size: 10pt; }
          th { background-color: #f2f2f2; }
          input, textarea { border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; width: 100%; font-size: 10pt; }
          textarea { resize: none; }
        }
      `}</style>
      <div className="space-y-6">
        <PageHeader
          title="Courses & Grading"
          description="Select a course to manage its resources and grade assessments."
        />
        <Card className="shadow-lg no-print">
          <CardHeader>
            <CardTitle className="font-headline">Select Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full md:w-1/2">
              <Label htmlFor="courseSelect">My Courses</Label>
              <Select onValueChange={handleCourseChange} value={selectedCourseId} disabled={isLoadingCourses}>
                <SelectTrigger id="courseSelect">
                  <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingCourses && courses.length === 0 && <SelectItem value="NO_COURSES" disabled>No courses found</SelectItem>}
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.name} ({course.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoadingData && (
          <div className="flex items-center justify-center py-10 no-print">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading course data...</p>
          </div>
        )}

        {marksheetData && !isLoadingData && (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center">
                           Course Resources
                        </CardTitle>
                        <CardDescription className="no-print">
                           Manage shared resources for {marksheetData.course.name}. For PDFs or other files, upload to a service like Google Drive and paste the link here.
                        </CardDescription>
                    </div>
                     <Button onClick={() => handleOpenResourceModal(null)} className="mt-4 sm:mt-0 no-print">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {(marksheetData.course.resources || []).length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {marksheetData.course.resources?.map(resource => (
                                <TableRow key={resource.id}>
                                    <TableCell>{getResourceTypeIcon(resource.type)}</TableCell>
                                    <TableCell>
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center">
                                            {resource.title} <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                                        </a>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{resource.type}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenResourceModal(resource)} className="mr-2 hover:text-primary"><Edit className="h-4 w-4"/><span className="sr-only">Edit</span></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteResource(resource.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4"/><span className="sr-only">Delete</span></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                ): (
                    <p className="text-muted-foreground text-center py-6">No resources have been added for this course yet.</p>
                )}
            </CardContent>
          </Card>
          <Card className="shadow-lg printable-area">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center">
                           <FileSpreadsheet className="mr-2 h-6 w-6"/> Marksheet: {marksheetData.course.name}
                        </CardTitle>
                        <CardDescription className="no-print">
                            Enter or update marks below. Assessments are shown as columns.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0 no-print">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Print Marksheet
                        </Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving || !hasDirtyChanges}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
                <div className="print-only hidden mt-4 border-t pt-4 text-black">
                    <h2 className="text-xl font-bold">KENYA INDUSTRIAL TRAINING INSTITUTE</h2>
                    <h3 className="text-lg">ASSESSMENT MARK SHEET PER UNIT OF COMPETENCY</h3>
                    <div className="grid grid-cols-2 gap-x-4 mt-2 text-sm">
                        <p><strong>Course Title:</strong> {marksheetData.course.name}</p>
                        <p><strong>Unit Title:</strong> {marksheetData.course.name}</p>
                        <p><strong>Assessment Centre Name:</strong> TeachHub Campus</p>
                        <p><strong>Date of Review of POE:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              {marksheetData.students.length > 0 && marksheetData.assessments.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Student Name</TableHead>
                        {marksheetData.assessments.map(assessment => (
                          <TableHead key={assessment.id} className="text-center min-w-[150px]">
                            {assessment.title}
                            <span className="block text-xs font-normal text-muted-foreground">(Total: {assessment.totalMarks})</span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksheetData.students.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium sticky left-0 bg-card z-10">{student.name}</TableCell>
                          {marksheetData.assessments.map(assessment => {
                            const key = `${student.id}_${assessment.id}`;
                            const currentMark = marksState[key] || { mark: '', comments: '' };
                            return (
                              <TableCell key={assessment.id} className="p-2 align-top">
                                <Input
                                  type="text"
                                  placeholder="-"
                                  value={currentMark.mark}
                                  onChange={(e) => handleMarkChange(student.id, assessment.id, e.target.value)}
                                  className="w-20 text-center mx-auto"
                                />
                                 <Textarea
                                  placeholder="Comments..."
                                  value={currentMark.comments}
                                  onChange={(e) => handleCommentChange(student.id, assessment.id, e.target.value)}
                                  className="w-full mt-1 text-xs min-h-[40px]"
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-amber-500" />
                  <p className="font-semibold text-lg">Marksheet Cannot Be Displayed</p>
                  {marksheetData.students.length === 0 && <p>There are no students enrolled in this course.</p>}
                  {marksheetData.assessments.length === 0 && <p>There are no assessments created for this course.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>

       <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
            <DialogDescription>
              {editingResource ? `Update the details for this resource.` : `Add a new resource link for ${marksheetData?.course.name}.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit(handleResourceFormSubmit)} className="space-y-4 py-4">
              <FormField control={resourceForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Engine Diagram PDF" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={resourceForm.control} name="url" render={({ field }) => (
                  <FormItem><FormLabel>URL</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={resourceForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select resource type" /></SelectTrigger></FormControl>
                        <SelectContent>{resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage/>
                  </FormItem>
              )}/>
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  {editingResource ? "Save Changes" : "Add Resource"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
