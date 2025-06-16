
'use server';

import {
  askAcademicQuestion,
  type AskAcademicQuestionInput,
  type AskAcademicQuestionOutput,
} from '@/ai/flows/ask-academic-question-flow';
import { 
  mockStudentQuestions,
  type StudentQuestion,
  type StudentQuestionInput,
} from '@/app/trainer/student-questions/data'; // Assuming data structure is shared or similar

export async function getAiAcademicHelp(
  input: AskAcademicQuestionInput
): Promise<AskAcademicQuestionOutput> {
  try {
    const result = await askAcademicQuestion(input);
    return result;
  } catch (error) {
    console.error('Error getting AI academic help:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get AI academic help: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching AI academic help.');
  }
}

// New action to (mock) submit a question to the trainer
export async function submitStudentQuestionToTrainer(
  questionData: StudentQuestionInput
): Promise<{ success: boolean; message?: string }> {
  console.log("Submitting question to trainer (mock):", questionData);
  // Simulate API call and database interaction
  await new Promise(resolve => setTimeout(resolve, 700));

  // In a real app, you would save this to a database.
  // For this mock, we'll just add it to an in-memory array (assuming it's accessible or handled server-side).
  // This part is tricky as actions.ts is server-side and `mockStudentQuestions` is in a separate module.
  // For a true mock, this would update a shared server-side store or database.
  // For now, we'll just log it and assume success.
  const newQuestion: StudentQuestion = {
    id: `sq_${Date.now()}`,
    ...questionData,
    dateAsked: new Date().toISOString(),
    isRead: false,
    trainerId: "trainerJane" // Assume a default trainer for mock purposes
  }
  // This push will only affect this instance if `mockStudentQuestions` isn't truly shared server-side state.
  // In a real scenario, the data layer (`actions.ts` on the trainer side) would fetch from the DB.
  // console.log("Adding to mock store (won't persist across requests without DB):", newQuestion);
  // mockStudentQuestions.push(newQuestion); // This line won't actually update the trainer's view without proper state management or DB

  return { success: true, message: "Question sent successfully (mock)." };
}
