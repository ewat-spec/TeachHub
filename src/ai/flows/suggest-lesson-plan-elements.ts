'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting lesson plan elements and additional resources based on a given topic.
 *
 * - suggestLessonPlanElements - The main function to trigger the flow.
 * - SuggestLessonPlanElementsInput - The input type for the suggestLessonPlanElements function.
 * - SuggestLessonPlanElementsOutput - The output type for the suggestLessonPlanElements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLessonPlanElementsInputSchema = z.object({
  lessonTopic: z
    .string()
    .describe('The topic of the lesson for which to generate suggestions.'),
});

export type SuggestLessonPlanElementsInput = z.infer<
  typeof SuggestLessonPlanElementsInputSchema
>;

const SuggestLessonPlanElementsOutputSchema = z.object({
  suggestedElements: z
    .array(z.string())
    .describe('An array of suggested lesson plan elements.'),
  additionalResources: z
    .array(z.string())
    .describe('An array of suggested additional resources.'),
});

export type SuggestLessonPlanElementsOutput = z.infer<
  typeof SuggestLessonPlanElementsOutputSchema
>;

export async function suggestLessonPlanElements(
  input: SuggestLessonPlanElementsInput
): Promise<SuggestLessonPlanElementsOutput> {
  return suggestLessonPlanElementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLessonPlanElementsPrompt',
  input: {schema: SuggestLessonPlanElementsInputSchema},
  output: {schema: SuggestLessonPlanElementsOutputSchema},
  prompt: `You are an AI assistant designed to help trainers create engaging lesson plans.
  Based on the lesson topic provided, suggest several lesson plan elements and additional resources that the trainer could use.
  Return the suggestions as arrays of strings.

  Lesson Topic: {{{lessonTopic}}}`,
});

const suggestLessonPlanElementsFlow = ai.defineFlow(
  {
    name: 'suggestLessonPlanElementsFlow',
    inputSchema: SuggestLessonPlanElementsInputSchema,
    outputSchema: SuggestLessonPlanElementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
