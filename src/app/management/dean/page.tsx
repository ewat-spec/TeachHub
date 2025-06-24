
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake, ShieldAlert, Users, Home, Smile, UserCheck } from "lucide-react";

export default function DeanOfStudentsDashboardPage() {
  const deanFeatures = [
    {
      title: "Student Welfare",
      description: "Track and manage student welfare cases, support requests, and special needs.",
      icon: <HeartHandshake className="h-6 w-6 text-primary" />,
      link: "#welfare", // Placeholder link
    },
    {
      title: "Disciplinary Actions",
      description: "Log and follow up on disciplinary incidents and actions taken.",
      icon: <ShieldAlert className="h-6 w-6 text-primary" />,
      link: "#discipline", // Placeholder link
    },
    {
      title: "Student Clubs & Activities",
      description: "Oversee registered student clubs, manage events, and track participation.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "#clubs", // Placeholder link
    },
    {
      title: "Accommodation / Hostels",
      description: "Manage student accommodation, room allocations, and hostel-related issues.",
      icon: <Home className="h-6 w-6 text-primary" />,
      link: "#accommodation", // Placeholder link
    },
    {
      title: "Counseling Services",
      description: "Coordinate counseling sessions and manage student mental health support.",
      icon: <Smile className="h-6 w-6 text-primary" />,
      link: "#counseling", // Placeholder link
    },
    {
      title: "Student Leadership",
      description: "Engage with student guild leaders and manage student governance activities.",
      icon: <UserCheck className="h-6 w-6 text-primary" />,
      link: "#leadership", // Placeholder link
    },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Dean of Students Dashboard"
        description="Oversee all aspects of student welfare, activities, and conduct."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {deanFeatures.map((feature) => (
          <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">{feature.title}</CardTitle>
              {feature.icon}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              <div className="mt-4 h-20 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Tools for {feature.title} Coming Soon</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Dean's Mandate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This dashboard centralizes all tools related to the well-being and non-academic life of students.
            From here, you can manage welfare cases, oversee clubs, and ensure a supportive environment for all students.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
