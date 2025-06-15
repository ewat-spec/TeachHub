
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
    .describe('The generated lesson notes in Markdown format. For mathematical content, LaTeX syntax should be used for formulas. For technical drawing, detailed descriptions of visual elements or drawing steps should be provided.'),
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
  prompt: `You are an expert AI assistant tasked with creating **comprehensive, detailed, technically accurate, and human-friendly** lesson notes for trainers.
Your goal is to produce notes that are thorough, informative, directly usable for teaching, and easy to understand.
The output must be in Markdown format.

Lesson Topic: {{{lessonTopic}}}

{{#if keyPoints}}
Key Points to Cover (elaborate on each extensively, providing depth suitable for the subject matter):
{{#each keyPoints}}
- {{{this}}}
{{/each}}
{{else}}
(No specific key points provided. Please identify and elaborate on the most important key points for the given lesson topic, ensuring significant depth.)
{{/if}}

Desired Note Format: {{{noteFormat}}}

**Specific Instructions for Technical Subjects:**
-   **For Mathematics-related topics (e.g., Algebra, Calculus, Geometry, Trigonometry):**
    *   Use LaTeX syntax for all mathematical formulas, equations, and expressions (e.g., \`$\\frac{a}{b}$\`, \`$x^2 + y^2 = r^2$\`).
    *   Provide clear, step-by-step explanations for problem-solving techniques, proofs, or derivations.
    *   **Crucially, explain mathematical concepts in a human-friendly and intuitive way.** Focus on the 'why' behind formulas and procedures, not just the 'how'. Use analogies or simple, relatable examples to illustrate abstract ideas. Break down complex ideas into smaller, understandable steps.
    *   Include definitions of key terms and theorems where relevant, explaining them in plain language.
    *   Offer illustrative examples with solutions, explaining the reasoning behind each step.
-   **For Technical Drawing or Engineering Drawing topics (e.g., Orthographic Projection, Isometric Drawing, Dimensioning, CAD basics):**
    *   Provide detailed descriptions of visual elements, components, or drawing conventions.
    *   Explain principles (e.g., types of lines, projection methods, sectioning) with clarity.
    *   Outline steps for creating specific types of drawings or using particular techniques.
    *   Suggest practical exercises or examples (e.g., "Describe the steps to draw a first-angle orthographic projection of a given block," or "Explain the rules for dimensioning a circular feature.").
-   **For other technical subjects:** Adapt the level of detail and explanation to the complexity of the topic. Ensure clarity, accuracy, and intuitive understanding.

Please generate the lesson notes now. Ensure the content is rich and covers the topic and key points in significant depth according to the guidelines above.
- If 'detailed-paragraph' format is requested, provide in-depth paragraphs with explanations, examples, and context. For technical subjects, integrate formulas (as LaTeX if math) or detailed descriptions smoothly within these paragraphs, making sure explanations are intuitive.
- If 'bullet-points' format is requested, create a structured list of detailed bullet points, possibly with sub-bullets, covering concepts, definitions, examples, and steps where applicable. LaTeX for math or descriptive elements for drawing should be used within bullets, with clear, human-friendly explanations.
- If 'summary' format is requested, provide a comprehensive summary that still captures the main essence and critical details of the topic, including key formulas (as LaTeX if math) or core concepts for drawing, explained intuitively.

Avoid superficial or overly brief content. Aim for notes that a trainer can rely on for a substantial lesson. The explanation should be as human as possible.
The notes should be formatted in valid Markdown.
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

