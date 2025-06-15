
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating lesson notes based on a topic, key points, and desired format.
 *
 * - generateLessonNotes - The main function to trigger the flow.
 * - GenerateLessonNotesInput - The input type for the generateLessonNotes function.
 * - GenerateLessonNotesOutput - The output type for the generateLessonNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonNotesInputSchema = z.object({
  lessonTopic: z
    .string()
    .min(3, 'Lesson topic must be at least 3 characters.')
    .describe('The topic of the lesson for which to generate notes.'),
  keyPoints: z
    .array(z.string())
    .optional()
    .describe('Specific points or subtopics to focus on in the notes. Each string is a key point.'),
  noteFormat: z
    .enum(['summary', 'detailed-paragraph', 'bullet-points'])
    .default('detailed-paragraph')
    .describe('The desired format for the generated notes.'),
});

export type GenerateLessonNotesInput = z.infer<
  typeof GenerateLessonNotesInputSchema
>;

const GenerateLessonNotesOutputSchema = z.object({
  lessonNotes: z
    .string()
    .describe('The generated lesson notes in Markdown format.'),
});

export type GenerateLessonNotesOutput = z.infer<
  typeof GenerateLessonNotesOutputSchema
>;

export async function generateLessonNotes(
  input: GenerateLessonNotesInput
): Promise<GenerateLessonNotesOutput> {
  return generateLessonNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonNotesPrompt',
  input: {schema: GenerateLessonNotesInputSchema},
  output: {schema: GenerateLessonNotesOutputSchema},
  prompt: `You are an AI assistant designed to help trainers prepare comprehensive lesson notes.
Based on the lesson topic, key points (if provided), and desired format specified, generate clear and informative lesson notes.
The notes should be well-structured and suitable for a trainer to use for teaching or as a handout.
Format the output as Markdown.

Lesson Topic: {{{lessonTopic}}}

{{#if keyPoints}}
Key Points to Cover:
{{#each keyPoints}}
- {{{this}}}
{{/each}}
{{/if}}

Desired Note Format: {{{noteFormat}}}

Generate the lesson notes now.
`,
});

const generateLessonNotesFlow = ai.defineFlow(
  {
    name: 'generateLessonNotesFlow',
    inputSchema: GenerateLessonNotesInputSchema,
    outputSchema: GenerateLessonNotesOutputSchema,
  },
  async input => {
    // Ensure keyPoints is an array of strings if provided, otherwise undefined.
    // The prompt expects an array or nothing. An empty string for keyPoints from UI should be handled.
    const processedInput = {
        ...input,
        keyPoints: input.keyPoints?.filter(kp => kp.trim() !== "") // Filter out empty strings
    };
    if (processedInput.keyPoints?.length === 0) {
        processedInput.keyPoints = undefined;
    }

    const {output} = await prompt(processedInput);
    return output!;
  }
);
