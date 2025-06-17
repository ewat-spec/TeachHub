
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, CheckCircle, CalendarIcon, UserSearch, FolderOpen } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { savePortfolioEvidence, deletePortfolioEvidence } from "./actions";

const evidenceTypes = [
  "Assessment Result",
  "Practical Observation",
  "Project Submission",
  "Photo/Video of Work",
  "Logbook Entry",
  "Work Sample",
  "Testimonial",
  "Other",
] as const;

const cbetLevels = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Intermediate",
  "Advanced",
  "Other",
] as const;

// Mock student data for selection
const mockStudents = [
  { id: "student1", name: "Student Alpha" },
  { id: "student2", name: "Student Beta" },
  { id: "student3", name: "Student Gamma" },
  { id: "student4", name: "Alex DemoStudent" }, // Matching student from student portal
];

const portfolioEvidenceSchema = z.object({
  id: z.string().optional(),
  studentName: z.string().min(2, { message: "Student name must be at least 2 characters." }),
  courseName: z.string().min(3, { message: "Course name must be at least 3 characters." }),
  cbetLevel: z.enum(cbetLevels, { required_error: "CBET Level is required." }),
  evidenceTitle: z.string().min(3, { message: "Evidence title must be at least 3 characters." }),
  evidenceType: z.enum(evidenceTypes, { required_error: "Evidence type is required." }),
  evidenceDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  evidenceLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  dateAdded: z.date({ required_error: "Date is required." }),
  trainerNotes: z.string().optional(),
});

type PortfolioEvidenceFormValues = z.infer<typeof portfolioEvidenceSchema>;

interface PortfolioEvidenceItem extends PortfolioEvidenceFormValues {
  id: string;
}

const initialEvidence: PortfolioEvidenceItem[] = [
  { id: "poe1", studentName: "Student Alpha", courseName: "Safety Procedures", cbetLevel: "Level 4", evidenceTitle: "Workshop Safety Quiz", evidenceType: "Assessment Result", evidenceDescription: "Completed safety quiz with 90% score.", evidenceLink: "", dateAdded: new Date("2024-08-15"), trainerNotes: "Good understanding of PPE." },
  { id: "poe2", studentName: "Student Beta", courseName: "Vehicle Technology", cbetLevel: "Intermediate", evidenceTitle: "Engine Teardown Practical", evidenceType: "Practical Observation", evidenceDescription: "Successfully identified all major engine components.", evidenceLink: "https://placehold.co/600x400.png", dateAdded: new Date("2024-08-20"), trainerNotes: "Needs to improve on tool handling." },
  { id: "poe3", studentName: "Student Alpha", courseName: "Vehicle Technology", cbetLevel: "Level 4", evidenceTitle: "Braking System Inspection", evidenceType: "Practical Observation", evidenceDescription: "Demonstrated correct procedure for brake inspection.", evidenceLink: "", dateAdded: new Date("2024-08-22"), trainerNotes: "Confident and knowledgeable." },
  { id: "poe4", studentName: "Alex DemoStudent", courseName: "Automotive Engineering", cbetLevel: "Level 2", evidenceTitle: "Engine Systems Quiz 1", evidenceType: "Assessment Result", evidenceDescription: "Score: 85/100. Showed good understanding of basic engine components.", evidenceLink: "", dateAdded: new Date("2024-09-01"), trainerNotes: "Ready for next module." },
];

export default function StudentPortfoliosPage() {
  const { toast } = useToast();
  const [evidenceList, setEvidenceList] = useState<PortfolioEvidenceItem[]>(initialEvidence);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<PortfolioEvidenceItem | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<PortfolioEvidenceFormValues>({
    resolver: zodResolver(portfolioEvidenceSchema),
    defaultValues: { studentName: "", courseName: "", evidenceTitle: "", evidenceDescription: "", evidenceLink: "", trainerNotes: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (editingEvidence) {
      form.reset({
        ...editingEvidence,
        dateAdded: new Date(editingEvidence.dateAdded),
      });
      setIsFormOpen(true);
    } else {
      form.reset({ 
        studentName: selectedStudentName || "", // Pre-fill if a student is selected
        courseName: "", 
        cbetLevel: undefined, 
        evidenceTitle: "", 
        evidenceType: undefined, 
        evidenceDescription: "", 
        evidenceLink: "", 
        dateAdded: new Date(), 
        trainerNotes: "" 
      });
    }
  }, [editingEvidence, form, selectedStudentName]);

  async function onSubmit(data: PortfolioEvidenceFormValues) {
    try {
      const result = await savePortfolioEvidence(data);
      if (result.success) {
        const newOrUpdatedEvidence = { ...data, id: editingEvidence ? editingEvidence.id : result.id! } as PortfolioEvidenceItem;
        if (editingEvidence) {
          setEvidenceList(evidenceList.map(ev => ev.id === editingEvidence.id ? newOrUpdatedEvidence : ev));
        } else {
          setEvidenceList([...evidenceList, newOrUpdatedEvidence]);
        }
        toast({ title: editingEvidence ? "Evidence Updated" : "Evidence Saved", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setEditingEvidence(null);
        setIsFormOpen(false);
        form.reset();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save evidence.", variant: "destructive" });
    }
  }

  const handleEdit = (evidence: PortfolioEvidenceItem) => {
    setEditingEvidence(evidence);
    setSelectedStudentName(evidence.studentName); // Ensure selected student matches item being edited
  };

  const handleDelete = async (evidenceId: string) => {
    try {
      const result = await deletePortfolioEvidence(evidenceId);
      if (result.success) {
        setEvidenceList(evidenceList.filter(ev => ev.id !== evidenceId));
        toast({ title: "Evidence Deleted", description: result.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete evidence.", variant: "destructive" });
    }
  };

  const openNewForm = () => {
    setEditingEvidence(null);
    // Pre-fill studentName if one is already selected, otherwise leave it blank for the trainer to fill
    form.reset({ 
        studentName: selectedStudentName || "", 
        courseName: "", 
        cbetLevel: undefined, 
        evidenceTitle: "", 
        evidenceType: undefined, 
        evidenceDescription: "", 
        evidenceLink: "", 
        dateAdded: new Date(), 
        trainerNotes: "" 
    });
    setIsFormOpen(true);
  }

  const filteredEvidence = selectedStudentName 
    ? evidenceList.filter(ev => ev.studentName === selectedStudentName)
    : []; 

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Portfolios" description="Manage portfolio of evidence for your students." />
        <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-muted rounded w-full mb-4"></div>
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
        title="Student Portfolios of Evidence"
        description="Select a student to view their portfolio, or add new evidence."
        actions={
          <Button onClick={openNewForm} disabled={!selectedStudentName && !isFormOpen}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Evidence
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline flex items-center"><UserSearch className="mr-2 h-5 w-5 text-primary"/>Select Student</CardTitle>
            <CardDescription>Choose a student to view and manage their Portfolio of Evidence.</CardDescription>
        </CardHeader>
        <CardContent>
            <Select onValueChange={(value) => setSelectedStudentName(value)} value={selectedStudentName || undefined}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                    {mockStudents.map(student => (
                        <SelectItem key={student.id} value={student.name}>{student.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardContent>
      </Card>

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingEvidence ? "Edit Portfolio Evidence" : "Add New Portfolio Evidence"}</CardTitle>
            <CardDescription>
                {editingEvidence ? `Update evidence for ${editingEvidence.studentName}.` : 
                (selectedStudentName ? `Add new evidence for ${selectedStudentName}.` : "Fill in student and evidence details.")}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="Enter student's full name" 
                                {...field} 
                                readOnly={!!selectedStudentName && !editingEvidence} 
                            />
                        </FormControl>
                        {selectedStudentName && !editingEvidence && <FormDescription>Adding evidence for {selectedStudentName}.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name / Module</FormLabel>
                        <FormControl><Input placeholder="e.g., Vehicle Technology, Safety Procedures" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="cbetLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CBET Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select CBET Level" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {cbetLevels.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="evidenceType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Type of Evidence</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select evidence type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {evidenceTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <FormField
                  control={form.control}
                  name="evidenceTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Safety Quiz Q1, Engine Assembly Practical" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evidenceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence Description</FormLabel>
                      <FormControl><Textarea placeholder="Describe the evidence and what it demonstrates." {...field} className="min-h-[100px] resize-y" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="evidenceLink"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Evidence Link (Optional)</FormLabel>
                            <FormControl><Input type="url" placeholder="https://example.com/evidence_doc.pdf" {...field} /></FormControl>
                            <FormDescription>Link to an external document, photo, video, etc.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dateAdded"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date Added / Observed</FormLabel>
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
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="trainerNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer Notes (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Any additional notes about this evidence or student performance..." {...field} className="min-h-[80px] resize-y" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingEvidence(null); form.reset();}}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : (editingEvidence ? "Update Evidence" : "Save Evidence")}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      {selectedStudentName && !isFormOpen && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
                <FolderOpen className="mr-2 h-5 w-5 text-primary"/> Portfolio for: {selectedStudentName}
            </CardTitle>
            <CardDescription>Displaying all recorded evidence for the selected student.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEvidence.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvidence.sort((a,b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).map((evidence) => (
                    <TableRow key={evidence.id}>
                      <TableCell>{evidence.courseName}</TableCell>
                      <TableCell>{evidence.cbetLevel}</TableCell>
                      <TableCell className="font-medium truncate max-w-[150px] sm:max-w-xs">{evidence.evidenceTitle}</TableCell>
                      <TableCell className="hidden md:table-cell">{evidence.evidenceType}</TableCell>
                      <TableCell className="hidden lg:table-cell">{format(new Date(evidence.dateAdded), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(evidence)} className="mr-2 hover:text-primary">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(evidence.id)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No portfolio evidence recorded for {selectedStudentName}. Click "Add New Evidence" to get started.</p>
            )}
          </CardContent>
        </Card>
      )}
      {!selectedStudentName && !isFormOpen && (
         <Card className="shadow-lg mt-6">
            <CardContent className="py-12 text-center">
                <UserSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">Select a Student</p>
                <p className="text-sm text-muted-foreground">Please choose a student from the dropdown above to view their portfolio.</p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

    
