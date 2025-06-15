
"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, CalendarCheck, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: "reminder" | "assignment" | "alert" | "info";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "reminder", title: "Upcoming Class: Advanced TypeScript", message: "Your class is scheduled for tomorrow at 10:00 AM in Room 301.", date: "2024-09-14", read: false },
  { id: "2", type: "assignment", title: "Lesson Plan Submission Due", message: "Please submit your lesson plan for 'Data Structures' by EOD Friday.", date: "2024-09-12", read: false },
  { id: "3", type: "alert", title: "Venue Change: AI Ethics Workshop", message: "The workshop venue has been changed to Conference Hall B. Please inform your attendees.", date: "2024-09-10", read: true },
  { id: "4", type: "info", title: "New Training Resources Available", message: "Check out the new 'Interactive Teaching Techniques' guide in the resource library.", date: "2024-09-09", read: true },
  { id: "5", type: "reminder", title: "Feedback Collection", message: "Remember to collect feedback forms after your 'Agile Methodologies' session today.", date: "2024-09-15", read: false },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "reminder": return <BellRing className="h-5 w-5 text-blue-500" />;
    case "assignment": return <CalendarCheck className="h-5 w-5 text-green-500" />;
    case "alert": return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "info": return <Info className="h-5 w-5 text-purple-500" />;
    default: return <BellRing className="h-5 w-5 text-gray-500" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isClient) {
     return (
      <div className="space-y-6">
        <PageHeader title="My Notifications & Reminders" description="Stay updated with important alerts and tasks."/>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-48 mb-4"></div>
          <Card className="shadow-lg mb-4">
            <CardContent className="p-4 h-20 bg-muted rounded"></CardContent>
          </Card>
          <Card className="shadow-lg mb-4">
            <CardContent className="p-4 h-20 bg-muted rounded"></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Notifications & Reminders"
        description="Stay updated with important alerts and tasks."
        actions={
          unreadCount > 0 ? (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {unreadCount} New
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              All caught up!
            </Badge>
          )
        }
      />

      {notifications.length > 0 && unreadCount > 0 && (
         <div className="text-right mb-4">
            <button onClick={markAllAsRead} className="text-sm text-primary hover:underline">Mark all as read</button>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((notification) => (
            <Card key={notification.id} className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${notification.read ? 'opacity-70 bg-muted/50' : 'bg-card'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.type)}
                    <CardTitle className="text-lg font-headline">{notification.title}</CardTitle>
                  </div>
                  {!notification.read && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">New</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                  <span>{new Date(notification.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)} className="text-primary hover:underline font-medium">
                      Mark as read
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <BellRing className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No notifications yet.</p>
            <p className="text-sm text-muted-foreground">Check back later for updates and reminders.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
