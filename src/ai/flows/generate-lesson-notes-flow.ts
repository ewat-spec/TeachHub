
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
  prompt: `You are an expert AI assistant tasked with creating **exceptionally comprehensive, detailed, technically accurate, and profoundly human-friendly** lesson notes for trainers.
Your goal is to produce notes that are thorough, informative, directly usable for teaching, and remarkably easy to understand, even for complex topics.
The output must be in Markdown format.

Lesson Topic: {{{lessonTopic}}}

{{#if keyPoints}}
Key Points to Cover (elaborate on each extensively, providing significant depth suitable for the subject matter):
{{#each keyPoints}}
- {{{this}}}
{{/each}}
{{else}}
(No specific key points provided. Please identify and elaborate on the most important key points for the given lesson topic, ensuring significant depth and clarity.)
{{/if}}

Desired Note Format: {{{noteFormat}}}

**Specific Instructions for Technical Subjects:**
-   **For Mathematics-related topics (e.g., Algebra, Calculus, Geometry, Trigonometry, Laplace Transforms, Fourier Series, Differential Equations):**
    *   **PRIORITIZE INTUITIVE UNDERSTANDING ABOVE ALL ELSE.** Before presenting any complex formula or mathematical procedure, you *must* first explain the *'why'* and the *'what'* in simple, relatable terms.
    *   **USE ANALOGIES AND REAL-WORLD CONNECTIONS EXTENSIVELY.** For abstract concepts (like integrals, transforms, series, limits), start with a clear, simple analogy or a real-world scenario that makes the concept tangible. For example, explain an integral as 'summing up tiny slices of an area' or a Laplace Transform as a 'problem-solving machine' or a 'language translator that changes a problem's form to make it simpler.'
    *   **EXPLAIN THE PURPOSE FIRST:** For any mathematical tool or transformation (like Laplace or Fourier), clearly state what problem it helps to solve or what advantage it provides *before* showing the formula.
    *   **DECONSTRUCT FORMULAS:** When a formula is introduced (e.g., for an integral, a transform, a series), explain *each part* of the formula conceptually. Do not just present symbols; explain their meaning and role within the formula in plain language. For example, for the Laplace transform integral \`$\\int_0^\\infty f(t) e^{-st} dt$\`, explain what \`$f(t)$\` represents (the original time-based function), what \`$e^{-st}$\` represents (a decaying exponential 'weighting' or 'testing' function with complex frequency 's'), what the integral itself means (summing up the weighted function over all time), and what \`$F(s)$\` (the result) signifies (a representation of \`$f(t)$\` in the 's-domain' or frequency domain).
    *   **START SIMPLE AND BUILD UP:** Introduce terms and concepts in a logical sequence, beginning with the most basic definitions. Clearly explain any prerequisite knowledge if necessary.
    *   **AVOID UNNECESSARY JARGON:** If a technical term is unavoidable, define it immediately in plain language. If a simpler word or phrasing exists, prefer it.
    *   **STEP-BY-STEP EXPLANATIONS:** For problem-solving techniques, proofs, or derivations, provide extremely clear, granular, step-by-step explanations. Assume you are explaining to someone who finds math challenging or is encountering the concept for the very first time. Focus intensely on the reasoning behind each step.
    *   **USE LATEX FOR ALL MATH:** All mathematical formulas, equations, and expressions must use LaTeX syntax (e.g., \`$\\frac{a}{b}$\`, \`$x^2 + y^2 = r^2$\`, \`$\\int_0^\\infty f(t) e^{-st} dt$\`).
    *   **ILLUSTRATIVE EXAMPLES:** Offer multiple examples with fully worked-out solutions, meticulously explaining the reasoning behind each step of the solution.
    *   **Example for Explaining a Formula (Polygon Angle Sum):** Instead of just stating \`(n-2) * 180°\`, first explain *why* by relating how any polygon can be divided into \`(n-2)\` triangles from one vertex, and each triangle contains 180°. Show this with a simple drawing description if possible. Then work through an example like a pentagon, step by step: $n=5$, so $(5-2) = 3$ triangles, thus $3 \times 180° = 540°$.

-   **For Technical Drawing or Engineering Drawing topics (e.g., Orthographic Projection, Isometric Drawing, Dimensioning, CAD basics):**
    *   Provide detailed, easy-to-follow descriptions of visual elements, components, or drawing conventions, explaining their purpose.
    *   Explain principles (e.g., types of lines, projection methods, sectioning) with utmost clarity, using simple terms and visualizable examples.
    *   Outline steps for creating specific types of drawings or using particular techniques in a very structured, easy-to-reproduce manner.
    *   Suggest practical exercises or examples (e.g., "Describe, step-by-step, how to draw a first-angle orthographic projection of a simple rectangular block, explaining what each view represents," or "Explain the fundamental rules for dimensioning a circular feature on a drawing, as if to a beginner, and why these rules are important for manufacturing.").
-   **For other technical subjects:** Adapt the level of detail and explanation to the complexity of the topic. Always prioritize exceptional clarity, accuracy, and intuitive understanding.

Please generate the lesson notes now. Ensure the content is rich and covers the topic and key points in significant depth according to the guidelines above.
- If 'detailed-paragraph' format is requested, provide in-depth paragraphs with explanations, examples, and context. For technical subjects, integrate formulas (as LaTeX if math) or detailed descriptions smoothly within these paragraphs, making sure explanations are exceptionally intuitive and human.
- If 'bullet-points' format is requested, create a structured list of detailed bullet points, possibly with sub-bullets, covering concepts, definitions, examples, and steps where applicable. LaTeX for math or descriptive elements for drawing should be used within bullets, with clear, human-friendly explanations for each point.
- If 'summary' format is requested, provide a comprehensive summary that still captures the main essence and critical details of the topic, including key formulas (as LaTeX if math) or core concepts for drawing, explained intuitively and clearly.

Avoid superficial or overly brief content. Aim for notes that a trainer can rely on for a substantial lesson. The explanation should be as human and clear as possible, making complex topics accessible.
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

