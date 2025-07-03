

"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, UserSearch, Receipt, FilePlus, CalendarIcon, PlusCircle, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import type { StudentFinancialSummary, Invoice, PaymentRecord } from "./data";
import { getStudentsFinancialSummaries, getStudentFinancialDetails, recordPayment, generateInvoice } from "./actions";


const recordPaymentSchema = z.object({
  studentId: z.string(), // Will be hidden, pre-filled
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  paymentDate: z.date({ required_error: "Payment date is required."}),
  paymentMethod: z.enum(["Bank Transfer", "Card", "Cash", "Mobile Money"], { required_error: "Payment method is required."}),
  description: z.string().optional(),
  reference: z.string().optional(),
  applyToInvoiceId: z.string().optional(),
});
type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

const invoiceLineItemSchema = z.object({
  description: z.string().min(3, "Description is too short."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().positive("Unit price must be positive."),
});
const generateInvoiceSchema = z.object({
  studentId: z.string(), // Will be hidden, pre-filled
  items: z.array(invoiceLineItemSchema).min(1, "At least one line item is required."),
  dueDate: z.date({required_error: "Due date is required."}),
});
type GenerateInvoiceFormValues = z.infer<typeof generateInvoiceSchema>;


export default function AdminFinancePage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<StudentFinancialSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentFinancialSummary | null>(null);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false);

  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);

  const paymentForm = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { amount: 0, paymentDate: new Date(), paymentMethod: undefined, description: "", reference: "", applyToInvoiceId: "" },
  });

  const invoiceForm = useForm<GenerateInvoiceFormValues>({
    resolver: zodResolver(generateInvoiceSchema),
    defaultValues: { items: [{ description: "", quantity: 1, unitPrice: 0 }], dueDate: new Date() },
  });
  const { fields: invoiceItemsFields, append: appendInvoiceItem, remove: removeInvoiceItem } = useFieldArray({
    control: invoiceForm.control,
    name: "items",
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const summaries = await getStudentsFinancialSummaries();
      setStudents(summaries);
    } catch (e) {
      toast({ title: "Error", description: "Could not fetch student financial summaries.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchStudents();
  }, []);

  const handleSelectStudent = async (studentId: string) => {
    if (!studentId) {
      setSelectedStudent(null);
      return;
    }
    setIsLoadingStudentDetails(true);
    try {
      const details = await getStudentFinancialDetails(studentId);
      setSelectedStudent(details);
      // Pre-fill studentId for forms if a student is selected
      paymentForm.setValue("studentId", studentId);
      invoiceForm.setValue("studentId", studentId);
      paymentForm.reset({ ...paymentForm.formState.defaultValues, studentId, paymentDate: new Date() });
      invoiceForm.reset({ ...invoiceForm.formState.defaultValues, studentId, items: [{ description: "", quantity: 1, unitPrice: 0 }], dueDate: new Date() });

    } catch (e) {
      toast({ title: "Error", description: "Could not fetch student details.", variant: "destructive" });
      setSelectedStudent(null);
    } finally {
      setIsLoadingStudentDetails(false);
    }
  };

  const onRecordPaymentSubmit = async (data: RecordPaymentFormValues) => {
    if (!selectedStudent) return;
    try {
      const result = await recordPayment({
          ...data,
          studentId: selectedStudent.id,
          paymentDate: data.paymentDate.toISOString(),
      });
      if (result.success) {
        toast({ title: "Payment Recorded", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setIsRecordPaymentModalOpen(false);
        paymentForm.reset();
        fetchStudents(); // Refresh all student summaries
        handleSelectStudent(selectedStudent.id); // Refresh selected student details
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    }
  };

  const onGenerateInvoiceSubmit = async (data: GenerateInvoiceFormValues) => {
    if (!selectedStudent) return;
     try {
      const result = await generateInvoice({
          ...data,
          studentId: selectedStudent.id,
          dueDate: data.dueDate.toISOString(),
      });
      if (result.success) {
        toast({ title: "Invoice Generated", description: result.message, action: <CheckCircle className="text-green-500"/>});
        setIsGenerateInvoiceModalOpen(false);
        invoiceForm.reset({ studentId: selectedStudent.id, items: [{ description: "", quantity: 1, unitPrice: 0 }], dueDate: new Date() });
        fetchStudents(); // Refresh all student summaries
        handleSelectStudent(selectedStudent.id); // Refresh selected student details
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate invoice.", variant: "destructive" });
    }
  };

  if (!isClient || isLoading) {
    return (
      <div className="container mx-auto">
        <PageHeader title="Finance Management" description="Loading financial data..." />
        <div className="space-y-6 animate-pulse">
          <Card><CardHeader><div className="h-8 w-1/3 bg-muted rounded"></div></CardHeader><CardContent className="h-24 bg-muted rounded"></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Finance Management"
        description="Oversee student financials, record payments, and generate invoices."
      />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><UserSearch className="mr-2 h-5 w-5 text-primary"/>Select Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleSelectStudent} defaultValue="">
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Select a student to view/manage their finances..." />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.admissionNumber}) - Bal: KES {student.outstandingBalance.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoadingStudentDetails && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading student financial details...</p>
        </div>
      )}

      {selectedStudent && !isLoadingStudentDetails && (
        <div className="space-y-6">
          <Card className="shadow-xl bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center justify-between">
                <span>Financial Summary for: {selectedStudent.name}</span>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsRecordPaymentModalOpen(true)}><Receipt className="mr-2 h-4 w-4"/> Record Payment</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsGenerateInvoiceModalOpen(true)}><FilePlus className="mr-2 h-4 w-4"/> Generate Invoice</Button>
                </div>
              </CardTitle>
              <CardDescription>{selectedStudent.admissionNumber} | {selectedStudent.course}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-background rounded-lg shadow">
                    <p className="text-sm text-muted-foreground">Total Billed</p>
                    <p className="text-xl font-bold text-foreground">KES {selectedStudent.totalBilled.toLocaleString()}</p>
                </div>
                 <div className="p-3 bg-background rounded-lg shadow">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">KES {selectedStudent.totalPaid.toLocaleString()}</p>
                </div>
                 <div className="p-3 bg-background rounded-lg shadow">
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className={`text-xl font-bold ${selectedStudent.outstandingBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                        KES {selectedStudent.outstandingBalance.toLocaleString()}
                    </p>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg">Invoices</CardTitle></CardHeader>
              <CardContent>
                {selectedStudent.invoices.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Inv #</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedStudent.invoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{format(new Date(inv.dateIssued), "dd/MM/yy")}</TableCell>
                          <TableCell>{format(new Date(inv.dueDate), "dd/MM/yy")}</TableCell>
                          <TableCell>KES {inv.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>KES {inv.amountPaid.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={inv.status === "Paid" ? "default" : inv.status === "Partial" ? "secondary" : "destructive"} className={`${inv.status === "Paid" ? "bg-green-600 text-white": ""}`}>{inv.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">No invoices for this student.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg">Payment History</CardTitle></CardHeader>
              <CardContent>
                {selectedStudent.payments.length > 0 ? (
                   <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedStudent.payments.map(pay => (
                        <TableRow key={pay.id}>
                          <TableCell>{format(new Date(pay.datePaid), "dd/MM/yy")}</TableCell>
                          <TableCell>KES {pay.amount.toLocaleString()}</TableCell>
                          <TableCell>{pay.paymentMethod}</TableCell>
                          <TableCell className="truncate max-w-[150px]">{pay.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">No payment history for this student.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Dialog open={isRecordPaymentModalOpen} onOpenChange={setIsRecordPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Record Payment for {selectedStudent?.name}</DialogTitle>
            <DialogDescription>Enter payment details. Ensure accuracy before saving.</DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onRecordPaymentSubmit)} className="space-y-4 py-4">
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount (KES)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={paymentForm.control} name="paymentDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Payment Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                    </Popover><FormMessage/>
                  </FormItem>
              )}/>
              <FormField control={paymentForm.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem><SelectItem value="Mobile Money">Mobile Money</SelectItem>
                        </SelectContent>
                    </Select><FormMessage/>
                  </FormItem>
              )}/>
              <FormField control={paymentForm.control} name="reference" render={({ field }) => (
                  <FormItem><FormLabel>Reference (Optional)</FormLabel><FormControl><Input placeholder="Transaction ID, Cheque No." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={paymentForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Fee payment for Term 2" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={paymentForm.control} name="applyToInvoiceId" render={({ field }) => (
                  <FormItem><FormLabel>Apply to Invoice (Optional)</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select invoice if applicable" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {selectedStudent?.invoices.filter(inv => inv.status !== 'Paid').map(inv => (
                          <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} (Due: {format(new Date(inv.dueDate), "PP")}, Bal: KES {(inv.totalAmount-inv.amountPaid).toLocaleString()})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage/>
                  </FormItem>
              )}/>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={paymentForm.formState.isSubmitting}>
                    {paymentForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                     Save Payment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Modal */}
      <Dialog open={isGenerateInvoiceModalOpen} onOpenChange={setIsGenerateInvoiceModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">Generate Invoice for {selectedStudent?.name}</DialogTitle>
            <DialogDescription>Add line items and set a due date for the new invoice.</DialogDescription>
          </DialogHeader>
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(onGenerateInvoiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {invoiceItemsFields.map((item, index) => (
                <Card key={item.id} className="p-3 relative">
                  <div className="space-y-2">
                    <FormField control={invoiceForm.control} name={`items.${index}.description`} render={({ field }) => (
                      <FormItem><FormLabel>Item Description</FormLabel><FormControl><Input placeholder="e.g., Tuition Fee Term 3" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={invoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                        <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={invoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                        <FormItem><FormLabel>Unit Price (KES)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </div>
                  </div>
                  {invoiceItemsFields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => removeInvoiceItem(index)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  )}
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendInvoiceItem({ description: "", quantity: 1, unitPrice: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Line Item
              </Button>
              <FormField control={invoiceForm.control} name="dueDate" render={({ field }) => (
                  <FormItem className="flex flex-col mt-4"><FormLabel>Due Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a due date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                    </Popover><FormMessage/>
                  </FormItem>
              )}/>
              <DialogFooter className="mt-6">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={invoiceForm.formState.isSubmitting}>
                  {invoiceForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FilePlus className="mr-2 h-4 w-4"/>}
                   Generate Invoice
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

       <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/> Overall Financial Reports</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">High-level financial summaries and reporting tools will be available here.</p>
            <div className="mt-4 h-40 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Reporting Dashboards Coming Soon</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
