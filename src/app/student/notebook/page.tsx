"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Info, Sparkles } from "lucide-react";
import React from "react";

export default function StudentNotebookPage() {
  const notebookId = process.env.NEXT_PUBLIC_NOTEBOOK_ID || "YOUR_NOTEBOOK_ID";

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Learning Notebook"
        description="Access your course materials through our specialized AI Notebook powered by NotebookLM."
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-xl overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary/70">Powered by Google NotebookLM</span>
            </div>
            <CardTitle className="text-3xl font-headline">Your Engineering Knowledge Base</CardTitle>
            <CardDescription className="text-lg">
              Interact with your curriculum, ask deep questions, and get instant insights from verified course materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden border shadow-inner bg-muted/30 flex items-center justify-center group">
               <div className="absolute inset-0 bg-[url('https://placehold.co/1200x675.png?text=NotebookLM+Interface+Preview')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" />
               <div className="relative z-10 text-center p-6">
                    <BookOpen className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Launch Your Personal AI Tutor</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Open the notebook to start exploring your course materials with the power of Gemini 2.0.
                    </p>
                    <Button size="lg" className="px-8 py-6 text-lg rounded-full shadow-lg" asChild>
                        <a
                            href={`https://notebooklm.google.com/notebook/${notebookId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-2 h-5 w-5" />
                            Open Notebook Now
                        </a>
                    </Button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <h4 className="font-bold mb-1 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Summarize
                    </h4>
                    <p className="text-xs text-muted-foreground">Get instant summaries of long lectures and technical documents.</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <h4 className="font-bold mb-1 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Q&A
                    </h4>
                    <p className="text-xs text-muted-foreground">Ask complex questions and get answers cited directly from the curriculum.</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <h4 className="font-bold mb-1 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Audio Overviews
                    </h4>
                    <p className="text-xs text-muted-foreground">Generate deep-dive audio discussions about your course topics.</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4 px-6 flex items-center justify-between">
             <p className="text-xs text-muted-foreground">
                Your notebook is kept up-to-date by your trainers.
             </p>
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">System Active</span>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
