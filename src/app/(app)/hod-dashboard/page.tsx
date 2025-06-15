
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookCopy, TrendingUp, Archive } from "lucide-react";

export default function HODDashboardPage() {
  const hodFeatures = [
    {
      title: "Department Staff",
      description: "Manage teaching staff, assignments, and performance within your department.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "#staff", // Placeholder link
    },
    {
      title: "Course Management",
      description: "Oversee departmental courses, curriculum updates, and learning materials.",
      icon: <BookCopy className="h-6 w-6 text-primary" />,
      link: "#courses", // Placeholder link
    },
    {
      title: "Student Performance",
      description: "Track student progress, analyze academic results, and identify support needs.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "#performance", // Placeholder link
    },
    {
      title: "Resource Allocation",
      description: "Manage and approve departmental resource requests (e.g., labs, equipment).",
      icon: <Archive className="h-6 w-6 text-primary" />,
      link: "#resources", // Placeholder link
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
          <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">{feature.title}</CardTitle>
              {feature.icon}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              {/* Placeholder for content or link */}
              <div className="mt-4 h-20 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Details for {feature.title} Coming Soon</p>
              </div>
               {/* <a href={feature.link} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Go to {feature.title} &rarr;
              </a> */}
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
            This dashboard will provide Heads of Department with tools to effectively manage their teams,
            curriculum, student outcomes, and departmental resources. Future enhancements will include
            AI-powered insights for departmental planning and performance analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
