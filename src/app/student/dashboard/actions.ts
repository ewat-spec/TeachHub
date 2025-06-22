
'use server';

import {
  askAcademicQuestion,
  type AskAcademicQuestionInput,
  type AskAcademicQuestionOutput,
} from '@/ai/flows/ask-academic-question-flow';
import { 
  submitStudentQuestion,
  type StudentQuestionInput,
} from '@/app/trainer/student-questions/actions';

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
  // This now calls the centralized action, which is better for future data management
  return await submitStudentQuestion(questionData);
}
