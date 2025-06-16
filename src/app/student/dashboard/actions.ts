
'use server';

import {
  askAcademicQuestion,
  type AskAcademicQuestionInput,
  type AskAcademicQuestionOutput,
} from '@/ai/flows/ask-academic-question-flow';

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
