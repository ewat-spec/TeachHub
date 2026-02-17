"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, RefreshCw, ExternalLink, Github, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import React, { useState } from "react";

export default function TrainerNotebookPage() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<"success" | "error" | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);
    try {
      const response = await fetch('/api/sync-notebook', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sync Successful",
          description: "Curriculum has been pushed to NotebookLM.",
        });
        setLastSyncStatus("success");
      } else {
        throw new Error(data.details || "Sync failed");
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      setLastSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const notebookId = process.env.NEXT_PUBLIC_NOTEBOOK_ID || "YOUR_NOTEBOOK_ID";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notebook LM Management"
        description="Sync curriculum content from GitHub to your NotebookLM instance for student access."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Sync Source
            </CardTitle>
            <CardDescription>
              Current source: TeachHub/main/curriculum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm font-medium">Target File:</p>
              <p className="text-sm text-muted-foreground break-all">
                https://github.com/user/TeachHub/blob/main/curriculum/lesson1.md
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              When you update the curriculum on GitHub, use the button below to sync the changes to NotebookLM. This ensures students always have the latest information in their AI assistant.
            </p>
          </CardContent>
          <CardFooter>
            <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Content...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Curriculum Now
                </>
              )}
            </Button>
          </CardFooter>
          {lastSyncStatus && (
            <div className={`mx-6 mb-6 p-3 rounded-md flex items-center gap-2 text-sm ${
                lastSyncStatus === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
                {lastSyncStatus === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {lastSyncStatus === "success" ? "Last sync completed successfully." : "Last sync failed. Check logs for details."}
            </div>
          )}
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              NotebookLM Instance
            </CardTitle>
            <CardDescription>
              Access and manage your notebook directly on Google NotebookLM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-primary/5 rounded-lg border-2 border-dashed border-primary/20">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">Notebook ID: {notebookId}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: You must have permissions to access the notebook in the Google Cloud project.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`https://notebooklm.google.com/notebook/${notebookId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in NotebookLM
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
