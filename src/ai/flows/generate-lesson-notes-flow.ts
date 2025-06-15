
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating lesson notes based on a topic, key points, desired format, and student audience.
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
  studentAudience: z
    .string()
    .optional()
    .describe('A description of the target student audience, e.g., "Second-year electrical engineering students" or "Automotive apprentice mechanics".'),
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

{{#if studentAudience}}
Student Audience: {{{studentAudience}}}
**Crucially, tailor all explanations, examples, analogies, and the depth of discussion to be highly relevant, relatable, and appropriate for this specific student audience.** For instance, if explaining a physics concept to automotive students, use automotive examples. If explaining mathematics to electrical engineering students, use circuit or signal processing examples.
{{/if}}

{{#if keyPoints}}
Key Points to Cover (elaborate on each extensively, providing significant depth suitable for the subject matter and tailored to the student audience):
{{#each keyPoints}}
- {{{this}}}
{{/each}}
{{else}}
(No specific key points provided. Please identify and elaborate on the most important key points for the given lesson topic, ensuring significant depth, clarity, and relevance to the specified student audience.)
{{/if}}

Desired Note Format: {{{noteFormat}}}

**Specific Instructions for Technical Subjects (always tailor to {{{studentAudience}}})**
-   **For Mathematics-related topics (e.g., Algebra, Calculus, Geometry, Trigonometry, Laplace Transforms, Fourier Series, Differential Equations):**
    *   **PRIORITIZE INTUITIVE UNDERSTANDING FOR THE SPECIFIED AUDIENCE ABOVE ALL ELSE.** Before presenting any complex formula or mathematical procedure, you *must* first explain the *'why'* and the *'what'* in simple, relatable terms, using analogies and examples appropriate for the {{{studentAudience}}}.
    *   **USE AUDIENCE-SPECIFIC ANALOGIES AND REAL-WORLD CONNECTIONS EXTENSIVELY.** For abstract concepts (like integrals, transforms, series, limits), start with a clear, simple analogy or a real-world scenario that makes the concept tangible *for that audience*. For example, for Laplace Transforms:
        *   If for **Electrical Engineering students**: Relate it to circuit analysis, signal processing, or control systems (e.g., "Think of the Laplace Transform as a tool that changes a complex circuit problem involving differential equations into a simpler algebraic problem in the 's-domain', making it easier to analyze how voltages and currents behave over time, especially with capacitors and inductors.").
        *   If for **Mechanical/Automotive Engineering students**: Relate it to vibrations, control systems, or dynamic systems (e.g., "Imagine the Laplace Transform helps us analyze how a car's suspension (a spring-damper system) responds to a bump, by transforming the tricky time-based vibration equations into a more manageable form.").
    *   **EXPLAIN THE PURPOSE FIRST (for the {{{studentAudience}}}):** For any mathematical tool or transformation (like Laplace or Fourier), clearly state what problem it helps *them* solve or what advantage it provides *before* showing the formula.
    *   **DECONSTRUCT FORMULAS (for the {{{studentAudience}}}):** When a formula is introduced (e.g., for an integral, a transform, a series), explain *each part* of the formula conceptually, in plain language relevant to their field. For example, for the Laplace transform integral \`$\\int_0^\\infty f(t) e^{-st} dt$\`, explain what \`$f(t)$\` represents (e.g., a time-varying voltage, a mechanical displacement), what \`$e^{-st}$\` represents (a decaying exponential 'weighting' or 'testing' function with complex frequency 's', which can relate to stability or response characteristics), what the integral itself means, and what \`$F(s)$\` (the result) signifies (a representation of \`$f(t)$\` in the 's-domain' or frequency domain, which might simplify analysis of system stability or frequency response for *their* specific systems).
    *   **START SIMPLE AND BUILD UP (for the {{{studentAudience}}}):** Introduce terms and concepts in a logical sequence, beginning with the most basic definitions. Clearly explain any prerequisite knowledge if necessary, assuming the typical background of the {{{studentAudience}}}.
    *   **AVOID UNNECESSARY JARGON (for the {{{studentAudience}}}):** If a technical term is unavoidable, define it immediately in plain language. If a simpler word or phrasing exists, prefer it.
    *   **STEP-BY-STEP EXPLANATIONS (for the {{{studentAudience}}}):** For problem-solving techniques, proofs, or derivations, provide extremely clear, granular, step-by-step explanations. Focus intensely on the reasoning behind each step, tailored to their likely understanding.
    *   **USE LATEX FOR ALL MATH:** All mathematical formulas, equations, and expressions must use LaTeX syntax (e.g., \`$\\frac{a}{b}$\`, \`$x^2 + y^2 = r^2$\`, \`$\\int_0^\\infty f(t) e^{-st} dt$\`).
    *   **ILLUSTRATIVE EXAMPLES (for the {{{studentAudience}}}):** Offer multiple examples with fully worked-out solutions, meticulously explaining the reasoning behind each step of the solution, using scenarios familiar to the {{{studentAudience}}}.
    *   **Example for Explaining a Formula (Polygon Angle Sum - adapt if relevant to audience):** Instead of just stating \`(n-2) * 180°\`, first explain *why* by relating how any polygon can be divided into \`(n-2)\` triangles from one vertex, and each triangle contains 180°. Work through an example like a pentagon: $n=5$, so $(5-2) = 3$ triangles, thus $3 \times 180° = 540°$. If this isn't directly relevant to {{{studentAudience}}}, focus on more pertinent mathematical concepts.

-   **For Technical Drawing or Engineering Drawing topics (e.g., Orthographic Projection, Isometric Drawing, Dimensioning, CAD basics - always tailor to {{{studentAudience}}}):**
    *   Provide detailed, easy-to-follow descriptions of visual elements, components, or drawing conventions, explaining their purpose *within the context of the {{{studentAudience}}}'s field* (e.g., explain dimensioning rules with examples of mechanical parts for mechanical students, or circuit board layouts for electrical students if applicable).
    *   Explain principles (e.g., types of lines, projection methods, sectioning) with utmost clarity, using simple terms and visualizable examples relevant to their domain.
    *   Outline steps for creating specific types of drawings or using particular techniques in a very structured, easy-to-reproduce manner, focusing on applications relevant to the {{{studentAudience}}}.
    *   Suggest practical exercises or examples pertinent to their field (e.g., for automotive students: "Describe, step-by-step, how to draw a first-angle orthographic projection of a simple engine component, explaining what each view represents," or for electrical students: "Explain the fundamental rules for dimensioning a PCB layout, as if to a beginner, and why these rules are important for manufacturing.").
-   **For other technical subjects:** Adapt the level of detail, examples, and explanation to the complexity of the topic and the specific needs and background of the {{{studentAudience}}}. Always prioritize exceptional clarity, accuracy, and intuitive understanding for *them*.

Please generate the lesson notes now. Ensure the content is rich and covers the topic and key points in significant depth according to the guidelines above, especially tailoring for the {{{studentAudience}}}.
- If 'detailed-paragraph' format is requested, provide in-depth paragraphs with explanations, examples, and context. For technical subjects, integrate formulas (as LaTeX if math) or detailed descriptions smoothly within these paragraphs, making sure explanations are exceptionally intuitive and human, and relevant to the {{{studentAudience}}}.
- If 'bullet-points' format is requested, create a structured list of detailed bullet points, possibly with sub-bullets, covering concepts, definitions, examples, and steps where applicable. LaTeX for math or descriptive elements for drawing should be used within bullets, with clear, human-friendly explanations for each point, tailored to the {{{studentAudience}}}.
- If 'summary' format is requested, provide a comprehensive summary that still captures the main essence and critical details of the topic, including key formulas (as LaTeX if math) or core concepts for drawing, explained intuitively and clearly, with relevance to the {{{studentAudience}}}.

Avoid superficial or overly brief content. Aim for notes that a trainer can rely on for a substantial lesson. The explanation should be as human and clear as possible, making complex topics accessible to the specified {{{studentAudience}}}.
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
    const processedInput = {
        ...input,
        keyPoints: input.keyPoints?.filter(kp => kp.trim() !== "").length > 0 ? input.keyPoints.filter(kp => kp.trim() !== "") : undefined,
        studentAudience: input.studentAudience?.trim() ? input.studentAudience.trim() : undefined,
    };

    const {output} = await prompt(processedInput);
    return output!;
  }
);

