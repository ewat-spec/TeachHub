
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, CheckCircle, Users } from "lucide-react";

import { getStudents, saveStudent, deleteStudent, type StudentData } from "./actions";

const studentFormSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  admissionNumber: z.string().min(3, "Admission number is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  course: z.string().min(3, "Course name is required."),
  yearOfStudy: z.string().min(1, "Year of study is required."),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentRegistryPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const allStudents = await getStudents();
      setStudents(allStudents.sort((a,b) => a.fullName.localeCompare(b.fullName)));
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not fetch students.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClient(true);
    fetchAllStudents();
  }, [fetchAllStudents]);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { fullName: "", admissionNumber: "", email: "", phone: "", course: "", yearOfStudy: "" },
  });

  useEffect(() => {
    if (isFormModalOpen) {
      if (editingStudent) {
        form.reset(editingStudent);
      } else {
        form.reset({ fullName: "", admissionNumber: "", email: "", phone: "", course: "", yearOfStudy: "" });
      }
    }
  }, [isFormModalOpen, editingStudent, form]);
  
  const handleFormSubmit = async (data: StudentFormValues) => {
    try {
      const result = await saveStudent(data);
      if (result.success) {
        toast({ title: editingStudent ? "Student Updated" : "Student Added", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setIsFormModalOpen(false);
        fetchAllStudents();
      } else {
        toast({ title: "Error", description: result.message || "An error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Submission Error", description: error instanceof Error ? error.message : "Could not save student record.", variant: "destructive" });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const result = await deleteStudent(studentId);
       if (result.success) {
        toast({ title: "Student Deleted", description: result.message, variant: "destructive" });
        fetchAllStudents();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
        toast({ title: "Deletion Error", description: error instanceof Error ? error.message : "Could not delete student.", variant: "destructive" });
    }
  };
  
  const openEditModal = (student: StudentData) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
  };
  
  const openNewModal = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);


  if (!isClient) {
    return (
      <div className="container mx-auto">
        <PageHeader title="Student Registry" description="Loading student records..." />
        <div className="space-y-6 animate-pulse">
          <Card><CardHeader><div className="h-8 w-1/3 bg-muted rounded"></div></CardHeader><CardContent className="h-64 bg-muted rounded"></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Student Registry"
        description="View, add, edit, and manage all student records in the registry."
        actions={<Button onClick={openNewModal}><PlusCircle className="mr-2 h-4 w-4"/> Add New Student</Button>}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Students ({filteredStudents.length})</CardTitle>
          <CardDescription>A complete list of all students in the registry.</CardDescription>
          <div className="mt-4">
            <Input 
                placeholder="Search by name, admission no, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Loading students...</p></div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Admission No.</TableHead><TableHead className="hidden md:table-cell">Course</TableHead><TableHead className="hidden lg:table-cell">Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.course}</TableCell>
                    <TableCell className="hidden lg:table-cell">{student.email}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => openEditModal(student)} className="mr-2 hover:text-primary"><Edit className="h-4 w-4"/><span className="sr-only">Edit</span></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:text-destructive"><Trash2 className="h-4 w-4"/><span className="sr-only">Delete</span></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the student record for {student.fullName}.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(student.id!)}>Yes, delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4"/>
                <p className="font-semibold">No Students Found</p>
                <p className="text-sm">{searchTerm ? `Your search for "${searchTerm}" did not match any students.` : "There are no students in the registry. Click 'Add New Student' to begin."}</p>
             </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingStudent ? "Edit Student Record" : "Add New Student"}</DialogTitle>
            <DialogDescription>{editingStudent ? `Updating information for ${editingStudent.fullName}.` : "Enter the details for the new student."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
               <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="admissionNumber" render={({ field }) => (
                  <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input placeholder="SCT221-0001/2024" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="student@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="0712345678" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="course" render={({ field }) => (
                  <FormItem><FormLabel>Course</FormLabel><FormControl><Input placeholder="Automotive Engineering" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="yearOfStudy" render={({ field }) => (
                  <FormItem><FormLabel>Year of Study</FormLabel><FormControl><Input placeholder="Year 2" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  {editingStudent ? "Save Changes" : "Add Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
