
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Check, Send, Inbox } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

import type { StudentQuestion } from "./data";
import { getStudentQuestionsForTrainer, markQuestionAsRead, sendReplyToStudent } from "./actions";

export default function StudentQuestionsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [replyingTo, setReplyingTo] = useState<StudentQuestion | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const fetchedQuestions = await getStudentQuestionsForTrainer();
      setQuestions(fetchedQuestions.sort((a, b) => new Date(b.dateAsked).getTime() - new Date(a.dateAsked).getTime()));
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch student questions.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchQuestions();
  }, []);


  const handleMarkAsRead = async (questionId: string) => {
    try {
      const result = await markQuestionAsRead(questionId);
      if (result.success) {
        setQuestions(prev => prev.map(q => q.id === questionId ? {...q, isRead: true} : q));
        toast({ title: "Marked as Read", description: "Question status updated."});
      } else {
        toast({ title: "Error", description: result.message || "Could not mark as read.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
    }
  };
  
  const handleReply = (question: StudentQuestion) => {
    setReplyingTo(question);
    setReplyText(""); // Clear previous reply text
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) {
        toast({title: "Cannot Send", description: "Reply text cannot be empty.", variant: "destructive"});
        return;
    }
    setIsSendingReply(true);
    try {
        const result = await sendReplyToStudent(replyingTo.id, replyText);
        if (result.success) {
            toast({title: "Reply Sent (Mock)", description: `Your reply to ${replyingTo.studentName} has been notionally sent.`});
            // Mark as read if not already and clear reply state
            if (!replyingTo.isRead) {
                await handleMarkAsRead(replyingTo.id);
            }
            setReplyingTo(null);
            setReplyText("");
        } else {
            toast({ title: "Error Sending Reply", description: result.message, variant: "destructive" });
        }
    } catch(error) {
        toast({ title: "Error", description: "An error occurred while sending the reply.", variant: "destructive" });
    } finally {
        setIsSendingReply(false);
    }
  };


  if (!isClient || isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Questions" description="View and respond to questions from your students." />
        <Card className="shadow-lg animate-pulse">
            <CardHeader><div className="h-6 bg-muted rounded w-1/2"></div></CardHeader>
            <CardContent className="space-y-4">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded opacity-80"></div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Questions"
        description="View and respond to questions submitted by your students."
      />

      {questions.length === 0 ? (
        <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
                <Inbox className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No student questions yet.</p>
                <p className="text-sm text-muted-foreground">When students ask questions about your courses, they will appear here.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
            {questions.map((q) => (
                <Card key={q.id} className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${q.isRead ? 'bg-muted/30' : 'bg-card border-primary/50'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="text-lg font-headline flex items-center">
                                <MessageSquare className={`mr-2 h-5 w-5 ${q.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                                Question from: {q.studentName}
                            </CardTitle>
                            {!q.isRead && <Badge variant="destructive">New</Badge>}
                        </div>
                        <CardDescription>
                            Course: <strong>{q.courseTitle}</strong> | Received: {format(new Date(q.dateAsked), "MMM dd, yyyy 'at' HH:mm")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                        <p className="text-sm whitespace-pre-wrap">{q.questionText}</p>
                        
                        {replyingTo?.id === q.id ? (
                            <div className="mt-4 p-3 border rounded-md bg-background space-y-2">
                                <Label htmlFor={`reply-${q.id}`} className="font-semibold">Your Reply:</Label>
                                <Textarea 
                                    id={`reply-${q.id}`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="min-h-[100px]"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)} disabled={isSendingReply}>Cancel</Button>
                                    <Button size="sm" onClick={handleSendReply} disabled={isSendingReply}>
                                        {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                        Send Reply
                                    </Button>
                                </div>
                            </div>
                        ) : (
                             <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                <Button size="sm" variant="default" onClick={() => handleReply(q)}>
                                    <Send className="mr-2 h-4 w-4"/> Reply (Mock)
                                </Button>
                                {!q.isRead && (
                                    <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(q.id)}>
                                        <Check className="mr-2 h-4 w-4"/> Mark as Addressed
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
