
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, AlertTriangle, GraduationCap, Percent } from "lucide-react";
import { getStudentAcademicRecord } from "./actions";
import type { AcademicRecord } from "./data";
import { TeachHubLogo } from "@/components/icons/TeachHubLogo";

const MOCK_LOGGED_IN_STUDENT_ID = "studentAlexDemo"; 

export default function AcademicRecordPage() {
  const [record, setRecord] = useState<AcademicRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function fetchRecord() {
      try {
        const fetchedRecord = await getStudentAcademicRecord(MOCK_LOGGED_IN_STUDENT_ID);
        setRecord(fetchedRecord);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  const PageContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading Academic Record...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2"/> Error Loading Record</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!record) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
             <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
             <p className="text-xl font-semibold text-muted-foreground">No Academic Record Found</p>
             <p className="text-sm text-muted-foreground">We could not find any academic records associated with your account.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="print-only fixed top-0 left-0 w-full p-8 hidden bg-white text-black z-[9999]">
             <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                    <TeachHubLogo className="h-12 w-12 text-black"/>
                    <div>
                        <h1 className="text-2xl font-bold">TeachHub Institution</h1>
                        <p className="text-sm">Official Academic Transcript</p>
                    </div>
                </div>
                <div className="text-right text-xs">
                    <p>Date Issued: {new Date().toLocaleDateString()}</p>
                    <p>TeachHub Educational Systems</p>
                </div>
            </div>
             <div className="flex justify-between mt-4 text-sm">
                <div>
                    <p><strong>Student:</strong> {record.studentName}</p>
                    <p><strong>Admission No:</strong> {record.admissionNumber}</p>
                </div>
                 {record.overallAverage !== null && (
                    <div className="text-right">
                        <p><strong>Overall Average:</strong></p>
                        <p className="text-2xl font-bold">{record.overallAverage}%</p>
                    </div>
                 )}
            </div>
        </div>

        <Card className="shadow-lg print-container">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-headline text-primary">Academic Transcript for {record.studentName}</CardTitle>
                <CardDescription>Admission No: {record.admissionNumber}</CardDescription>
            </div>
             {record.overallAverage !== null && (
                <div className="text-right p-3 rounded-lg bg-primary/10">
                    <p className="text-sm font-medium text-primary">Overall Average</p>
                    <p className="text-3xl font-bold text-primary">{record.overallAverage}%</p>
                </div>
             )}
          </CardHeader>
          <CardContent>
            {record.records.length > 0 ? (
                <Accordion type="multiple" defaultValue={record.records.map(r => r.courseId)} className="w-full">
                    {record.records.map(course => (
                        <AccordionItem value={course.courseId} key={course.courseId}>
                             <AccordionTrigger className="hover:bg-muted/50 px-2 rounded text-lg">
                                <div className="flex justify-between w-full items-center">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="h-5 w-5 text-primary"/>
                                        <span className="font-semibold">{course.courseName} <span className="font-normal text-muted-foreground text-sm">({course.courseCode})</span></span>
                                    </div>
                                    {course.courseAverage !== null && (
                                        <Badge variant="outline" className="text-base mr-4">
                                            Avg: {course.courseAverage}%
                                        </Badge>
                                    )}
                                </div>
                             </AccordionTrigger>
                             <AccordionContent className="px-2 pt-2 pb-4 border-t mt-1">
                                {course.assessments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Assessment</TableHead>
                                                <TableHead>Comments</TableHead>
                                                <TableHead className="text-right">Mark</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.assessments.map(asm => (
                                                <TableRow key={asm.assessmentId}>
                                                    <TableCell className="font-medium">{asm.assessmentTitle}</TableCell>
                                                    <TableCell className="text-muted-foreground italic text-xs">{asm.comments}</TableCell>
                                                    <TableCell className="text-right">
                                                        {asm.mark !== null ? `${asm.mark} / ${asm.totalMarks}` : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No assessments recorded for this course.</p>
                                )}
                             </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-center text-muted-foreground py-8">No course records available.</p>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container *, .print-only, .print-only * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 150px; /* Adjust based on header height */
            width: 100%;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="space-y-6">
        <PageHeader
          title="My Academic Record"
          description="Official summary of your academic performance."
          actions={
            <Button onClick={handlePrint} className="no-print" disabled={isLoading || !!error}>
              <Printer className="mr-2 h-4 w-4" /> Print Transcript
            </Button>
          }
        />
        <PageContent />
      </div>
    </>
  );
}

    