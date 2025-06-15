
// This file needs to be a server component file if it contains server actions.
// However, since it's just exporting functions that internally might use 'use server',
// and the main function `suggestLessonPlanElements` from genkit is already designed for server-side execution,
// we might not need the 'use server' directive at the top of *this* file, but rather in the component that calls these.
// For clarity and to ensure Next.js treats these as server actions when imported, let's add it.
'use server';

import { 
  suggestLessonPlanElements as genkitSuggestElements, 
  type SuggestLessonPlanElementsInput, 
  type SuggestLessonPlanElementsOutput 
} from '@/ai/flows/suggest-lesson-plan-elements';

import {
  generateLessonNotes as genkitGenerateNotes,
  type GenerateLessonNotesInput,
  type GenerateLessonNotesOutput
} from '@/ai/flows/generate-lesson-notes-flow';

export async function getAiSuggestions(input: SuggestLessonPlanElementsInput): Promise<SuggestLessonPlanElementsOutput> {
  try {
    const result = await genkitSuggestElements(input);
    return result;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get AI suggestions: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching AI suggestions.");
  }
}

export async function getAiLessonNotes(input: GenerateLessonNotesInput): Promise<GenerateLessonNotesOutput> {
  try {
    const result = await genkitGenerateNotes(input);
    return result;
  } catch (error) {
    console.error("Error generating AI lesson notes:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate AI lesson notes: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating AI lesson notes.");
  }
}

// Placeholder for future actions like saving/updating lesson plans
export async function saveLessonPlan(lessonPlanData: any) {
  console.log("Saving lesson plan:", lessonPlanData);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: "Lesson plan saved successfully!", id: lessonPlanData.id || `lp-${Date.now()}` };
}

export async function deleteLessonPlan(lessonPlanId: string) {
  console.log("Deleting lesson plan:", lessonPlanId);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "Lesson plan deleted successfully!" };
}
