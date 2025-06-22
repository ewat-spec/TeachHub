
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookCopy, TrendingUp, Archive, MessageSquare, Send, GanttChartSquare, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import Link from "next/link";

export default function HODDashboardPage() {
  const { toast } = useToast();

  const hodFeatures = [
    {
      title: "Department Staff & Workload",
      description: "Oversee teaching staff, monitor workload distribution, and manage assignments within your department.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "#staff",
    },
    {
      title: "Performance Reviews",
      description: "Access tools and AI-driven insights to conduct meaningful performance reviews and support staff development.",
      icon: <UserCheck className="h-6 w-6 text-primary" />,
      link: "#performance",
    },
    {
      title: "Timetabling Oversight",
      description: "Review and approve departmental timetables. Collaborate with the timetabler to ensure optimal scheduling.",
      icon: <GanttChartSquare className="h-6 w-6 text-primary" />,
      link: "/management/timetabler",
    },
    {
      title: "Course Management",
      description: "Oversee departmental courses, curriculum updates, and learning materials.",
      icon: <BookCopy className="h-6 w-6 text-primary" />,
      link: "#courses",
    },
    {
      title: "Student Success Metrics",
      description: "Track student progress, analyze academic results, and identify departmental support needs.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "#student-success",
    },
    {
      title: "Resource Allocation",
      description: "Manage and approve departmental resource requests (e.g., labs, equipment).",
      icon: <Archive className="h-6 w-6 text-primary" />,
      link: "#resources",
    },
  ];

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
            <CardContent className="flex-grow flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              <div className="mt-auto pt-4">
                {feature.link.startsWith("/") ? (
                   <Button asChild variant="outline" className="w-full">
                     <Link href={feature.link}>Go to {feature.title.split(' ')[0]}</Link>
                   </Button>
                ) : (
                  <div className="h-20 bg-muted/50 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground text-sm text-center">Details for {feature.title} Coming Soon</p>
                  </div>
                )}
              </div>
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
            curriculum, student outcomes, and departmental resources. Future enhancements will include
            AI-powered insights for departmental planning and performance analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
