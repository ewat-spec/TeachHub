
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Landmark, Receipt, FileText, CalendarDays, Hash } from "lucide-react";
import { format } from "date-fns";
import { getStudentFinancials, type Invoice, type PaymentRecord } from "./data";

export default function StudentFinancePage() {
  const [financials, setFinancials] = useState<{
    invoices: Invoice[];
    payments: PaymentRecord[];
    outstandingBalance: number;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, studentId would come from auth context
    setFinancials(getStudentFinancials("studentAlexDemo")); 
  }, []);

  if (!isClient || !financials) {
    return (
      <div className="container mx-auto">
        <PageHeader title="My Finances" description="Loading your financial details..." />
        <div className="space-y-6 animate-pulse">
          <Card><CardHeader><div className="h-8 w-1/3 bg-muted rounded"></div></CardHeader><CardContent className="h-24 bg-muted rounded"></CardContent></Card>
          <Card><CardHeader><div className="h-8 w-1/3 bg-muted rounded"></div></CardHeader><CardContent className="h-40 bg-muted rounded"></CardContent></Card>
        </div>
      </div>
    );
  }

  const { invoices, payments, outstandingBalance } = financials;

  return (
    <div className="container mx-auto">
      <PageHeader
        title="My Finances"
        description="View your fee statements, balances, and payment history."
      />

      <Card className="mb-8 shadow-lg bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <DollarSign className="mr-2 h-7 w-7" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg">
          <p>
            Current Outstanding Balance:{" "}
            <span className={`font-bold ${outstandingBalance > 0 ? "text-destructive" : "text-green-600"}`}>
              KES {outstandingBalance.toLocaleString()}
            </span>
          </p>
          {outstandingBalance <= 0 && <p className="text-green-600 text-sm mt-1">Your account is up to date. Thank you!</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-6 w-6 text-primary" />Fee Statements / Invoices</CardTitle>
            <CardDescription>Details of your issued invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {invoices.map((invoice) => (
                  <AccordionItem value={invoice.id} key={invoice.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-2 rounded">
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 mr-2 text-muted-foreground"/>
                          <span>Invoice {invoice.invoiceNumber}</span>
                        </div>
                        <Badge variant={
                            invoice.status === "Paid" ? "default" :
                            invoice.status === "Partial" ? "secondary" :
                            invoice.status === "Overdue" ? "destructive" : "outline"
                        } className={`${invoice.status === "Paid" ? 'bg-green-600 text-white' : ''}`}>
                            {invoice.status}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-2 pb-4 border-t mt-1">
                      <div className="space-y-3 text-sm">
                        <p><strong className="text-foreground">Date Issued:</strong> {format(new Date(invoice.dateIssued), "PPP")}</p>
                        <p><strong className="text-foreground">Due Date:</strong> {format(new Date(invoice.dueDate), "PPP")}</p>
                        <Table className="mt-2">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.lineItems.map(item => (
                              <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">KES {item.total.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-semibold border-t-2 border-primary/30">
                               <TableCell>Subtotal</TableCell>
                               <TableCell className="text-right">KES {invoice.subTotal.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold">
                               <TableCell>Amount Paid</TableCell>
                               <TableCell className="text-right text-green-600">KES {invoice.amountPaid.toLocaleString()}</TableCell>
                            </TableRow>
                             <TableRow className="font-bold text-lg bg-muted/50">
                               <TableCell>Balance Due for Invoice</TableCell>
                               <TableCell className="text-right">KES {(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-center py-6">No invoices found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Receipt className="mr-2 h-6 w-6 text-primary"/>Payment History</CardTitle>
             <CardDescription>Record of payments made.</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.sort((a,b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.datePaid), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{payment.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">KES {payment.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-6">No payment history found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
