
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ClipboardList, GanttChartSquare } from "lucide-react";

export default function ManagementDashboardPage() {
  const managementSections = [
    { title: "Director Dashboard", icon: <Briefcase className="h-6 w-6 text-primary" />, description: "Access director-specific tools and overviews.", link: "/management/director" },
    { title: "HOD Dashboard", icon: <ClipboardList className="h-6 w-6 text-primary" />, description: "Access tools for Heads of Academic Departments.", link: "/management/hod" },
    { title: "Timetabler Dashboard", icon: <GanttChartSquare className="h-6 w-6 text-primary" />, description: "Manage and analyze institution timetables.", link: "/management/timetabler" },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Management Hub"
        description="Centralized access to administrative and departmental dashboards."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {managementSections.map((card) => (
          <Card key={card.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <a href={card.link} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Go to {card.title} &rarr;
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome to the Management Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This portal provides access to specialized dashboards for various management roles within TeachHub.
            Select a dashboard above to proceed to its dedicated tools and information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
