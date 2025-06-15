
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookCopy, TrendingUp, Archive, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import React from "react"; // Added React for potential future state if needed

export default function HODDashboardPage() {
  const { toast } = useToast();

  const hodFeatures = [
    {
      title: "Department Staff",
      description: "Manage teaching staff, assignments, and performance within your department.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "#staff",
      isCommunication: false,
    },
    {
      title: "Course Management",
      description: "Oversee departmental courses, curriculum updates, and learning materials.",
      icon: <BookCopy className="h-6 w-6 text-primary" />,
      link: "#courses",
      isCommunication: false,
    },
    {
      title: "Student Performance",
      description: "Track student progress, analyze academic results, and identify support needs.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "#performance",
      isCommunication: false,
    },
    {
      title: "Resource Allocation",
      description: "Manage and approve departmental resource requests (e.g., labs, equipment).",
      icon: <Archive className="h-6 w-6 text-primary" />,
      link: "#resources",
      isCommunication: false,
    },
    {
      title: "Communication Center",
      description: "Send and receive messages with staff and directors.",
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      link: "#communication",
      isCommunication: true,
    },
  ];

  // Mock data for communication center
  const mockConversations = [
    { id: "1", name: "Jane Doe (Trainer)", lastMessage: "Approved lesson plan for 'React Basics'.", unread: 0 },
    { id: "2", name: "Director Smith", lastMessage: "Meeting reminder: Budget review tomorrow.", unread: 1 },
    { id: "3", name: "John Appleseed (Trainer)", lastMessage: "Can we discuss the new curriculum?", unread: 0 },
  ];

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const messageTextarea = form.elements.namedItem("messageText") as HTMLTextAreaElement;
    if (messageTextarea && messageTextarea.value.trim()) {
       toast({
        title: "Message Sent (Mock)",
        description: `Your message "${messageTextarea.value.substring(0,30)}..." was notionally sent.`,
      });
      messageTextarea.value = ""; // Clear textarea
    } else {
       toast({
        title: "Empty Message",
        description: "Cannot send an empty message.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto">
      <PageHeader
        title="Head of Department Dashboard"
        description="Oversee and manage your academic department's activities and resources."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hodFeatures.map((feature) => (
          <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">{feature.title}</CardTitle>
              {feature.icon}
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              {feature.isCommunication ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Recent Conversations (Mock)</h4>
                    <ul className="space-y-2">
                      {mockConversations.map(convo => (
                        <li key={convo.id} className="p-2 rounded-md hover:bg-muted cursor-pointer border border-transparent hover:border-primary/30">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground">{convo.name}</span>
                            {convo.unread > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{convo.unread}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <Label htmlFor="messageText" className="text-sm font-medium text-foreground">Compose Message (Mock)</Label>
                    <Textarea id="messageText" name="messageText" placeholder="Type your message here..." className="min-h-[80px]" />
                    <Button type="submit" size="sm" className="w-full">
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="mt-auto pt-4 h-20 bg-muted/50 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Details for {feature.title} Coming Soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">HOD's Focus Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This dashboard provides Heads of Department with tools to effectively manage their teams,
            curriculum, student outcomes, departmental resources, and communication. Future enhancements will include
            AI-powered insights for departmental planning and performance analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
