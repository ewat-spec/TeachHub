"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, CheckCircle, CalendarIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const scheduleFormSchema = z.object({
  id: z.string().optional(), // For editing
  trainer: z.string().min(1, { message: "Trainer selection is required." }),
  sessionDate: z.date({ required_error: "Session date is required." }),
  sessionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  venue: z.string().min(2, { message: "Venue must be at least 2 characters." }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  duration: z.coerce.number().min(0.5, { message: "Duration must be at least 0.5 hours." }),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduledClass extends ScheduleFormValues {
  id: string; // Ensure ID is always present for scheduled items
}

const mockTrainers = [
  { id: "trainer1", name: "John Smith" },
  { id: "trainer2", name: "Alice Johnson" },
  { id: "trainer3", name: "Robert Brown" },
];

const initialScheduledClasses: ScheduledClass[] = [
  { id: "class1", trainer: "trainer1", sessionDate: new Date("2024-09-15"), sessionTime: "10:00", venue: "Room A101", topic: "Introduction to React", duration: 2 },
  { id: "class2", trainer: "trainer2", sessionDate: new Date("2024-09-16"), sessionTime: "14:00", venue: "Online Webinar", topic: "Advanced CSS Techniques", duration: 1.5 },
];

export default function SchedulePage() {
  const { toast } = useToast();
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(initialScheduledClasses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      trainer: "",
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (editingClass) {
      form.reset({
        ...editingClass,
        sessionDate: new Date(editingClass.sessionDate) // Ensure date is a Date object
      });
      setIsFormOpen(true);
    } else {
      form.reset({
        trainer: "",
        sessionDate: undefined,
        sessionTime: "09:00",
        venue: "",
        topic: "",
        duration: 1,
      });
    }
  }, [editingClass, form]);


  async function onSubmit(data: ScheduleFormValues) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    if (editingClass) {
      setScheduledClasses(scheduledClasses.map(cls => cls.id === editingClass.id ? { ...data, id: editingClass.id } as ScheduledClass : cls));
      toast({ title: "Class Updated", description: `Session on "${data.topic}" has been updated.`, action: <CheckCircle className="text-green-500"/> });
    } else {
      setScheduledClasses([...scheduledClasses, { ...data, id: `class${Date.now()}` } as ScheduledClass]);
      toast({ title: "Class Scheduled", description: `New session on "${data.topic}" has been added.`, action: <CheckCircle className="text-green-500"/> });
    }
    setEditingClass(null);
    setIsFormOpen(false);
    form.reset();
  }

  const handleEdit = (cls: ScheduledClass) => {
    setEditingClass(cls);
  };

  const handleDelete = (classId: string) => {
    // Simulate API call
    setScheduledClasses(scheduledClasses.filter(cls => cls.id !== classId));
    toast({ title: "Class Deleted", description: "The session has been removed from the schedule.", variant: "destructive" });
  };
  
  const openNewForm = () => {
    setEditingClass(null);
    form.reset({
      trainer: "",
      sessionDate: undefined,
      sessionTime: "09:00",
      venue: "",
      topic: "",
      duration: 1,
    });
    setIsFormOpen(true);
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Scheduling" description="Allocate trainers to sessions and manage the schedule." />
         <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-40 mb-4"></div>
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-5/6"></div>
              </CardContent>
            </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Scheduling"
        description="Allocate trainers to sessions and manage the schedule."
        actions={
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Session
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingClass ? "Edit Session" : "Schedule New Session"}</CardTitle>
            <CardDescription>{editingClass ? "Update details for this session." : "Fill in the details to add a new session to the schedule."}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="trainer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trainer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockTrainers.map(trainer => (
                              <SelectItem key={trainer.id} value={trainer.id}>{trainer.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="sessionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Session Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session venue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g., 1.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingClass(null); form.reset(); }}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : (editingClass ? "Update Session" : "Add Session")}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Current Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledClasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledClasses.sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime() || a.sessionTime.localeCompare(b.sessionTime)).map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.topic}</TableCell>
                    <TableCell>{mockTrainers.find(t => t.id === cls.trainer)?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(cls.sessionDate), "MMM dd, yyyy")} at {cls.sessionTime}</TableCell>
                    <TableCell>{cls.venue}</TableCell>
                    <TableCell>{cls.duration} hr(s)</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)} className="mr-2 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)} className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className="text-muted-foreground text-center py-8">No classes scheduled yet. Click "Add New Session" to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
