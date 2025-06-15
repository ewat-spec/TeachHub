import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, CalendarDays, UserCircle2, Bell } from "lucide-react";

export default function DashboardPage() {
  const summaryCards = [
    { title: "My Profile", icon: <UserCircle2 className="h-6 w-6 text-primary" />, description: "Manage your personal and professional details.", link: "/profile" },
    { title: "Upcoming Classes", icon: <CalendarDays className="h-6 w-6 text-primary" />, description: "View and manage your scheduled classes.", link: "/schedule" },
    { title: "Lesson Plans", icon: <BookOpenText className="h-6 w-6 text-primary" />, description: "Create, view, and update your lesson plans.", link: "/lesson-plans" },
    { title: "Notifications", icon: <Bell className="h-6 w-6 text-primary" />, description: "Check your latest notifications and reminders.", link: "/notifications" },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Welcome to TeachHub"
        description="Your central hub for managing training activities and resources."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
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
          <CardTitle className="font-headline text-2xl">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Navigate through the sections using the sidebar to access different features of TeachHub.
            You can update your profile, schedule new classes, plan your lessons with AI-powered suggestions,
            and stay updated with notifications.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Profile:</strong> Keep your CV, skills, and expertise up-to-date.</li>
            <li><strong>Class Schedule:</strong> View your timetable and class details.</li>
            <li><strong>Lesson Plans:</strong> Develop and submit your teaching materials. Try our AI suggestions!</li>
            <li><strong>Notifications:</strong> Never miss an important update or reminder.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
