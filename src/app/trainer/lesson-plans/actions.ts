
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

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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


export async function getLessonPlans(): Promise<any[]> {
    try {
        const lessonPlansCol = collection(db, 'lessonPlans');
        const snapshot = await getDocs(lessonPlansCol);
        if (snapshot.empty) {
            return [];
        }
        const lessonPlans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return lessonPlans;
    } catch (error) {
        console.error("Error fetching lesson plans from Firestore:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch lesson plans: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching lesson plans.");
    }
}


export async function saveLessonPlan(lessonPlanData: any) {
  console.log("Saving lesson plan to Firestore:", lessonPlanData);
  try {
    const { id, ...dataToSave } = lessonPlanData;
    // Note: In a real app, you would also save a trainerId here
    // dataToSave.trainerId = 'some-trainer-id';

    if (id) {
      dataToSave.updatedAt = serverTimestamp();
      const lessonPlanDoc = doc(db, 'lessonPlans', id);
      await updateDoc(lessonPlanDoc, dataToSave);
      return { success: true, message: "Lesson plan updated successfully!", id: id };
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'lessonPlans'), dataToSave);
      return { success: true, message: "Lesson plan saved successfully!", id: docRef.id };
    }
  } catch (error) {
    console.error("Error saving lesson plan to Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to save lesson plan: ${error.message}`);
    }
    throw new Error("An unknown error occurred while saving lesson plan.");
  }
}

export async function deleteLessonPlan(lessonPlanId: string) {
  console.log("Deleting lesson plan from Firestore:", lessonPlanId);
  try {
    if (!lessonPlanId) {
        throw new Error("No lesson plan ID provided for deletion.");
    }
    await deleteDoc(doc(db, 'lessonPlans', lessonPlanId));
    return { success: true, message: "Lesson plan deleted successfully!" };
  } catch (error) {
    console.error("Error deleting lesson plan from Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to delete lesson plan: ${error.message}`);
    }
    throw new Error("An unknown error occurred while deleting lesson plan.");
  }
}
