
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
    // Ensure isCbcCurriculum is explicitly passed, defaulting to false if undefined
    const concreteInput = {
      ...input,
      isCbcCurriculum: input.isCbcCurriculum ?? false,
    };
    const result = await genkitGenerateNotes(concreteInput);
    return result;
  } catch (error) {
    console.error("Error generating AI lesson notes:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate AI lesson notes: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating AI lesson notes.");
  }
}

export async function saveLessonPlan(lessonPlanData: any) {
  console.log("Saving lesson plan:", lessonPlanData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: "Lesson plan saved successfully!", id: lessonPlanData.id || `lp-${Date.now()}` };
}

export async function deleteLessonPlan(lessonPlanId: string) {
  console.log("Deleting lesson plan:", lessonPlanId);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "Lesson plan deleted successfully!" };
}
