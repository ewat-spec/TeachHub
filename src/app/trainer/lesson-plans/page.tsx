
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, PlusCircle, Edit, Trash2, CheckCircle, Loader2, ListChecks, Lightbulb, StickyNote, Copy, Users, Palette, Languages, BookCheck } from "lucide-react";
import React, { useState, useEffect } from "react";
import { getAiSuggestions, saveLessonPlan, deleteLessonPlan, getAiLessonNotes } from "./actions"; 
import type { SuggestLessonPlanElementsOutput } from '@/ai/flows/suggest-lesson-plan-elements';
import type { GenerateLessonNotesInput, GenerateLessonNotesOutput } from '@/ai/flows/generate-lesson-notes-flow';
import { LatexRenderer } from "@/components/common/LatexRenderer";

const lessonPlanFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  studentAudience: z.string().optional().describe("Description of the target student audience"),
  isCbcCurriculum: z.boolean().optional().default(false),
  keyPointsForNotes: z.string().optional().describe("Comma-separated key points for AI note generation"),
  noteFormat: z.enum(["summary", "detailed-paragraph", "bullet-points"]).optional().default("detailed-paragraph"),
  languageOutputStyle: z.enum(['standard', 'simplified-english']).optional().default('standard').describe("Language style for AI generated notes"),
  lessonNotesContent: z.string().optional().describe("Detailed lesson notes for the trainer."),
  objectives: z.string().min(10, { message: "Learning objectives/outcomes must be at least 10 characters." }),
  activities: z.string().min(10, { message: "Activities description must be at least 10 characters." }),
  materials: z.string().optional(),
  assessment: z.string().optional(),
});

type LessonPlanFormValues = z.infer<typeof lessonPlanFormSchema>;

interface LessonPlan extends LessonPlanFormValues {
  id: string;
}

const initialLessonPlans: LessonPlan[] = [
  { id: "lp1", title: "Effective Communication Skills", topic: "Communication", studentAudience: "General corporate staff", isCbcCurriculum: false, objectives: "Understand key communication barriers. Practice active listening.", activities: "Role-playing, group discussion.", materials: "Handouts, whiteboard", assessment: "Participation, short quiz", keyPointsForNotes: "Active listening, Non-verbal cues, Giving feedback", noteFormat: "bullet-points", languageOutputStyle: "standard", lessonNotesContent: "Detailed notes on active listening techniques...\n- Paraphrasing\n- Asking clarifying questions\n- Body language" },
  { id: "lp2", title: "Project Management Basics", topic: "Project Management", studentAudience: "Aspiring project managers", isCbcCurriculum: false, objectives: "Define project lifecycle. Identify key PM tools.", activities: "Case study analysis, tool demonstration.", materials: "Slides, PM software demo", assessment: "Case study report", noteFormat: "detailed-paragraph", languageOutputStyle: "simplified-english", lessonNotesContent: "Introduction to Project Management...\n- What is a project?\n- Project constraints (Scope, Time, Cost)\n- Stakeholder management basics" },
  { id: "lp3", title: "Introduction to Photosynthesis (CBC Aligned)", topic: "Photosynthesis", studentAudience: "Grade 7 Science Students", isCbcCurriculum: true, objectives: "Learners will be able to explain the process of photosynthesis and identify its key components.", activities: "Observing plant leaves, drawing diagrams, group presentation on importance of photosynthesis.", materials: "Plant samples, charts, videos", assessment: "Observation during group work, diagram labeling", keyPointsForNotes: "Chlorophyll, Sunlight, Carbon Dioxide, Water, Oxygen, Glucose", noteFormat: "detailed-paragraph", languageOutputStyle: "simplified-english", lessonNotesContent: "CBC Aligned notes on Photosynthesis:\nLearning Outcomes:\n1. Explain process\n2. Identify inputs & outputs...\nCore Competencies: Critical Thinking (analyzing process), Communication (presentation)..." },
];

export default function LessonPlansPage() {
  const { toast } = useToast();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(initialLessonPlans);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  
  const [aiSuggestions, setAiSuggestions] = useState<SuggestLessonPlanElementsOutput | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  
  const [aiLessonNotes, setAiLessonNotes] = useState<GenerateLessonNotesOutput | null>(null);
  const [isLoadingAiLessonNotes, setIsLoadingAiLessonNotes] = useState(false);
  const [aiNotesPreviewColor, setAiNotesPreviewColor] = useState<string>("#333333"); 

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanFormSchema),
    defaultValues: { title: "", topic: "", studentAudience: "", isCbcCurriculum: false, keyPointsForNotes: "", noteFormat: "detailed-paragraph", languageOutputStyle: "standard", lessonNotesContent: "", objectives: "", activities: "", materials: "", assessment: ""},
    mode: "onChange",
  });

  useEffect(() => {
    if (editingPlan) {
      form.reset({
        ...editingPlan,
        isCbcCurriculum: editingPlan.isCbcCurriculum ?? false, // Ensure boolean
      });
      setIsFormOpen(true);
      setAiSuggestions(null); 
      setAiLessonNotes(null);
    } else {
      form.reset({ title: "", topic: "", studentAudience: "", isCbcCurriculum: false, keyPointsForNotes: "", noteFormat: "detailed-paragraph", languageOutputStyle: "standard", lessonNotesContent: "", objectives: "", activities: "", materials: "", assessment: "" });
    }
  }, [editingPlan, form]);

  async function onSubmit(data: LessonPlanFormValues) {
    try {
      const result = await saveLessonPlan(data);
      if (result.success) {
        if (editingPlan) {
          setLessonPlans(lessonPlans.map(lp => lp.id === editingPlan.id ? { ...data, id: editingPlan.id } as LessonPlan : lp));
        } else {
          setLessonPlans([...lessonPlans, { ...data, id: result.id! } as LessonPlan]);
        }
        toast({ title: editingPlan ? "Lesson Plan Updated" : "Lesson Plan Saved", description: result.message, action: <CheckCircle className="text-green-500"/> });
        setEditingPlan(null);
        setIsFormOpen(false);
        setAiSuggestions(null);
        setAiLessonNotes(null);
        form.reset();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save lesson plan.", variant: "destructive" });
    }
  }

  const handleFetchAiSuggestions = async () => {
    const topic = form.getValues("topic");
    if (!topic || topic.trim().length < 3) {
      form.setError("topic", { type: "manual", message: "Please enter a valid topic (at least 3 characters) to get suggestions." });
      return;
    }
    setIsLoadingAiSuggestions(true);
    setAiSuggestions(null);
    try {
      const suggestions = await getAiSuggestions({ lessonTopic: topic });
      setAiSuggestions(suggestions);
      toast({ title: "AI Suggestions Ready", description: "Suggestions generated for your lesson plan topic." });
    } catch (error) {
      toast({ title: "AI Suggestion Error", description: error instanceof Error ? error.message : "Could not fetch AI suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleFetchAiLessonNotes = async () => {
    const topic = form.getValues("topic");
    const keyPointsStr = form.getValues("keyPointsForNotes");
    const noteFormat = form.getValues("noteFormat");
    const studentAudience = form.getValues("studentAudience");
    const languageOutputStyle = form.getValues("languageOutputStyle");
    const isCbcCurriculum = form.getValues("isCbcCurriculum");

    if (!topic || topic.trim().length < 3) {
      form.setError("topic", { type: "manual", message: "Please enter a valid topic (at least 3 characters) to generate notes." });
      return;
    }
    setIsLoadingAiLessonNotes(true);
    setAiLessonNotes(null);
    try {
      const keyPointsArray = keyPointsStr ? keyPointsStr.split(',').map(kp => kp.trim()).filter(kp => kp.length > 0) : undefined;
      
      const notesInput: GenerateLessonNotesInput = {
        lessonTopic: topic,
        keyPoints: keyPointsArray,
        noteFormat: noteFormat || "detailed-paragraph",
        languageOutputStyle: languageOutputStyle || "standard",
        isCbcCurriculum: isCbcCurriculum || false,
      };
      if (studentAudience && studentAudience.trim().length > 0) {
        notesInput.studentAudience = studentAudience.trim();
      }

      const notes = await getAiLessonNotes(notesInput);
      setAiLessonNotes(notes);
      toast({ title: "AI Lesson Notes Ready", description: `Notes generated for your lesson plan ${isCbcCurriculum ? "(CBC Aligned)" : ""}.` });
    } catch (error) {
      toast({ title: "AI Notes Error", description: error instanceof Error ? error.message : "Could not generate AI lesson notes.", variant: "destructive" });
    } finally {
      setIsLoadingAiLessonNotes(false);
    }
  };

  const handleCopyAiNotesToForm = () => {
    if (aiLessonNotes?.lessonNotes) {
      form.setValue("lessonNotesContent", aiLessonNotes.lessonNotes, { shouldValidate: true, shouldDirty: true });
      toast({ title: "Notes Copied", description: "AI-generated notes have been copied to the 'My Lesson Notes / Content' field." });
    }
  };
  
  const handleEdit = (plan: LessonPlan) => {
    setEditingPlan(plan);
  };

  const handleDelete = async (planId: string) => {
    try {
      const result = await deleteLessonPlan(planId);
      if (result.success) {
        setLessonPlans(lessonPlans.filter(lp => lp.id !== planId));
        toast({ title: "Lesson Plan Deleted", description: result.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete lesson plan.", variant: "destructive" });
    }
  };

  const openNewForm = () => {
    setEditingPlan(null);
    setAiSuggestions(null);
    setAiLessonNotes(null);
    form.reset({ title: "", topic: "", studentAudience: "", isCbcCurriculum: false, keyPointsForNotes: "", noteFormat: "detailed-paragraph", languageOutputStyle: "standard", lessonNotesContent: "", objectives: "", activities: "", materials: "", assessment: "" });
    setIsFormOpen(true);
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Lesson Plans" description="Create and manage your lesson plans with AI assistance." />
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
        title="My Lesson Plans"
        description="Create and manage your lesson plans with AI assistance. Align with CBC curriculum where needed."
        actions={
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{editingPlan ? "Edit Lesson Plan" : "Create New Lesson Plan"}</CardTitle>
            <CardDescription>{editingPlan ? "Update the details of your lesson plan." : "Fill in the form to create a new lesson plan. Use AI for suggestions and note generation!"}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Introduction to Quantum Physics" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Topic</FormLabel>
                       <FormControl><Input placeholder="e.g., Quantum Entanglement, CBC: Photosynthesis" {...field} /></FormControl>
                      <FormDescription>This topic will be used for AI assistance below.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="studentAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> Student Audience (Optional)</FormLabel>
                       <FormControl><Input placeholder="e.g., 2nd year Electrical Eng. students, Grade 7 CBC learners" {...field} /></FormControl>
                      <FormDescription>Describing the audience helps the AI tailor examples and explanations.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCbcCurriculum"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center"><BookCheck className="mr-2 h-5 w-5 text-primary" />Align with CBC Curriculum?</FormLabel>
                        <FormDescription>
                          Enable for AI to generate notes & suggestions based on Kenyan CBC principles.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* AI Assistance Section */}
                <Card className="bg-muted/30 p-4 space-y-4">
                  <h3 className="text-lg font-medium text-primary">AI Assistance Tools</h3>
                  <FormField
                    control={form.control}
                    name="keyPointsForNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Points for AI Notes (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="Enter comma-separated key points, e.g., point 1, sub-topic A, important detail" {...field} className="min-h-[80px] resize-y bg-background" /></FormControl>
                        <FormDescription>Help the AI focus the generated notes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="noteFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired AI Note Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select note format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="detailed-paragraph">Detailed Paragraphs</SelectItem>
                              <SelectItem value="bullet-points">Bullet Points</SelectItem>
                              <SelectItem value="summary">Summary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose how the AI should structure the notes.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="languageOutputStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" />AI Note Language Style</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select language style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard English</SelectItem>
                              <SelectItem value="simplified-english">Simplified English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select 'Simplified' for easier comprehension.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" onClick={handleFetchAiSuggestions} disabled={isLoadingAiSuggestions || !form.watch("topic")} variant="outline" className="shrink-0">
                          {isLoadingAiSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-accent" />}
                          Suggest Elements
                      </Button>
                      <Button type="button" onClick={handleFetchAiLessonNotes} disabled={isLoadingAiLessonNotes || !form.watch("topic")} variant="outline" className="shrink-0">
                          {isLoadingAiLessonNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StickyNote className="mr-2 h-4 w-4 text-accent" />}
                          Generate Notes {form.getValues("isCbcCurriculum") ? "(CBC)" : ""}
                      </Button>
                  </div>

                  {(aiSuggestions || aiLessonNotes) && (
                    <Accordion type="multiple" className="w-full" defaultValue={aiLessonNotes ? ['ai-notes'] : (aiSuggestions ? ['ai-elements'] : []) }>
                      {aiSuggestions && (
                        <>
                          <AccordionItem value="ai-elements">
                            <AccordionTrigger className="text-primary hover:text-primary/80">
                              <ListChecks className="mr-2 h-5 w-5" /> Suggested Lesson Elements
                            </AccordionTrigger>
                            <AccordionContent>
                              {aiSuggestions.suggestedElements.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
                                  {aiSuggestions.suggestedElements.map((el, idx) => <li key={`el-${idx}`}>{el}</li>)}
                                </ul>
                              ) : <p className="text-sm text-muted-foreground">No specific elements suggested. Try a broader topic.</p>}
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="ai-resources">
                            <AccordionTrigger className="text-primary hover:text-primary/80">
                              <Lightbulb className="mr-2 h-5 w-5" /> Additional Resources
                            </AccordionTrigger>
                            <AccordionContent>
                              {aiSuggestions.additionalResources.length > 0 ? (
                                <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
                                  {aiSuggestions.additionalResources.map((res, idx) => <li key={`res-${idx}`}>{res}</li>)}
                                </ul>
                              ) : <p className="text-sm text-muted-foreground">No additional resources suggested.</p>}
                            </AccordionContent>
                          </AccordionItem>
                        </>
                      )}
                      {aiLessonNotes && (
                          <AccordionItem value="ai-notes">
                              <AccordionTrigger className="text-primary hover:text-primary/80">
                                  <StickyNote className="mr-2 h-5 w-5" /> Generated Lesson Notes Preview {form.getValues("isCbcCurriculum") ? "(CBC Aligned)" : ""}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FormLabel htmlFor="aiNotesColorPicker" className="flex items-center text-sm">
                                      <Palette className="mr-1.5 h-4 w-4 text-muted-foreground"/>
                                      Preview Text Color:
                                    </FormLabel>
                                    <Input 
                                      id="aiNotesColorPicker"
                                      type="color" 
                                      value={aiNotesPreviewColor}
                                      onChange={(e) => setAiNotesPreviewColor(e.target.value)}
                                      className="h-8 w-14 p-1 rounded bg-background"
                                    />
                                  </div>
                                  <div className="p-3 border rounded-md bg-white min-h-[150px] max-h-[400px] overflow-y-auto">
                                    <LatexRenderer latexString={aiLessonNotes.lessonNotes} textColor={aiNotesPreviewColor} />
                                  </div>
                                  <Button type="button" size="sm" variant="outline" onClick={handleCopyAiNotesToForm} className="bg-white">
                                      <Copy className="mr-2 h-4 w-4" /> Copy to My Lesson Notes
                                  </Button>
                              </AccordionContent>
                          </AccordionItem>
                      )}
                    </Accordion>
                  )}
                </Card>
                
                {/* Main Content Section */}
                <FormField
                  control={form.control}
                  name="lessonNotesContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">My Lesson Notes / Content</FormLabel>
                      <FormControl><Textarea placeholder="Enter your detailed lesson notes, script, or primary content here. You can use AI-generated notes as a starting point by copying them from the section above." {...field} className="min-h-[200px] resize-y text-base" /></FormControl>
                      <FormDescription>This is your main area for authoring the lesson's content. You can include LaTeX here too, e.g., $E=mc^2$.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Objectives / Outcomes</FormLabel>
                      <FormControl><Textarea placeholder="What will learners achieve by the end of this lesson? For CBC, frame these as competency-based outcomes." {...field} className="min-h-[100px] resize-y" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activities &amp; Content Outline</FormLabel>
                      <FormControl><Textarea placeholder="Briefly describe the sequence of activities, discussions, or content flow. For CBC, focus on learner-centered activities." {...field} className="min-h-[120px] resize-y" /></FormControl>
                       <FormDescription>This is a summary or outline of activities, while detailed content goes into 'My Lesson Notes / Content'.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="materials"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Materials / Resources</FormLabel>
                        <FormControl><Textarea placeholder="List any materials needed (e.g., slides, videos, articles, handouts, equipment, realia for CBC)" {...field} className="min-h-[80px] resize-y"/></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="assessment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assessment Methods</FormLabel>
                        <FormControl><Textarea placeholder="How will learning be assessed? (e.g., quiz, project, observation, Q&A). For CBC, consider formative assessment of competencies." {...field} className="min-h-[80px] resize-y"/></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingPlan(null); form.reset(); setAiSuggestions(null); setAiLessonNotes(null);}}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : (editingPlan ? "Update Plan" : "Save Plan")}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">My Lesson Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="hidden md:table-cell">Audience</TableHead>
                  <TableHead className="hidden sm:table-cell">CBC</TableHead>
                   <TableHead className="hidden lg:table-cell">Language Style</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell>{plan.topic}</TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-xs">{plan.studentAudience || "N/A"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{plan.isCbcCurriculum ? <CheckCircle className="h-5 w-5 text-green-600"/> : "No"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                        {plan.languageOutputStyle === 'simplified-english' ? 'Simplified' : 'Standard'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)} className="mr-2 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No lesson plans created yet. Click "Create New Plan" to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

