
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
import { askWolframAlpha } from '@/ai/tools/wolframAlphaTool';

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
    .describe('A description of the target student audience, e.g., "Second-year electrical engineering students" or "Automotive apprentice mechanics". This helps tailor examples and depth.'),
});

export type GenerateLessonNotesInput = z.infer<
  typeof GenerateLessonNotesInputSchema
>;

const GenerateLessonNotesOutputSchema = z.object({
  lessonNotes: z
    .string()
    .describe('The generated lesson notes in Markdown format. For mathematical content, LaTeX syntax (e.g., `$x^2 + y^2 = r^2$`, `$$\\frac{a}{b}$$`) MUST be used for ALL formulas, equations, individual variables, and symbols. For technical drawing, detailed descriptions of visual elements or drawing steps should be provided.'),
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
  tools: [askWolframAlpha],
  input: {schema: GenerateLessonNotesInputSchema},
  output: {schema: GenerateLessonNotesOutputSchema},
  prompt: `You are an expert AI assistant tasked with creating **exceptionally comprehensive, detailed, technically accurate, and profoundly human-friendly** lesson notes for trainers.
Your goal is to produce notes that are thorough, informative, directly usable for teaching, and remarkably easy to understand, even for complex topics.
The output MUST be in Markdown format.

Lesson Topic: {{{lessonTopic}}}

{{#if studentAudience}}
Student Audience: {{{studentAudience}}}
**Crucially, tailor all explanations, examples, analogies, and the depth of discussion to be highly relevant, relatable, and appropriate for this specific student audience.** For instance, if explaining a physics concept to automotive students, use automotive examples. If explaining mathematics to electrical engineering students, use circuit or signal processing examples.
If the student audience is not specified, assume a general technical audience (e.g., first-year college students in a technical field or vocational training).
{{/if}}

{{#if keyPoints}}
Key Points to Cover (elaborate on each extensively, providing significant depth suitable for the subject matter and tailored to the student audience):
{{#each keyPoints}}
- {{{this}}}
{{/each}}
{{else}}
(No specific key points provided. Please identify and elaborate on the most important key points for the given lesson topic, ensuring significant depth, clarity, and relevance to the specified student audience.)
{{/if}}

Desired NoteFormat: {{{noteFormat}}}

**General Instructions for Explanations (ESPECIALLY for technical and mathematical content, but applicable to ALL subjects):**
1.  **Start with the 'Why' and 'What':** Before diving into details or formulas, always explain the core concept in simple terms. Why is this topic important for the {{{studentAudience}}}? What problem does it solve for them? What is the main idea in plain language?
2.  **Use Analogies:** For abstract concepts, use relatable analogies tailored to the {{{studentAudience}}}. For example, explaining electricity flow using water in pipes, or complex data structures using everyday organizational systems.
3.  **Define Terms Clearly:** If a technical or specialized term or jargon is unavoidable, define it immediately in simple, clear language. If a simpler word or phrasing exists that conveys the same meaning accurately, prefer it.
4.  **Build from Simple to Complex:** Introduce concepts in a logical sequence. Start with foundational ideas and gradually build up to more complex aspects. Don't assume too much prior knowledge beyond what is typical for the {{{studentAudience}}}.
5.  **Step-by-Step for Processes/Arguments:** For procedures, problem-solving techniques, derivations, or the development of an argument, provide extremely clear, granular, step-by-step explanations. Explain the reasoning behind *each step*.
6.  **Illustrative Examples:** Provide concrete examples that demonstrate the concept. These examples should be relevant to the {{{studentAudience}}}'s field of study or common experiences. Work through examples fully.
7.  **Human-Friendly Tone:** Write as if you are a patient, knowledgeable, and enthusiastic teacher explaining this to someone eager to learn. Avoid overly dry or academic language where a more conversational or descriptive style would be clearer.

**Specific Instructions for Different Subject Categories (always tailor to {{{studentAudience}}})**
-   **For Mathematics-related topics (e.g., Algebra, Calculus, Geometry, Trigonometry, Laplace Transforms, Fourier Series, Differential Equations):**
    *   **PRIORITIZE INTUITIVE UNDERSTANDING FOR THE SPECIFIED AUDIENCE ABOVE ALL ELSE.** Before presenting any complex formula or mathematical procedure, you *must* first explain the *'why'* (the purpose, the problem it solves *for them*) and the *'what'* (the core idea) in simple, relatable terms. Use analogies and real-world examples appropriate for the {{{studentAudience}}}. For abstract concepts like integrals, transforms (e.g., Laplace, Fourier), series, or limits, start with a clear, simple analogy or a real-world scenario that makes the concept tangible *for that audience*.
        *   **Laplace Transform Example Intuition (General):** Think of the Laplace Transform as a special toolkit or a language translator. It takes a complicated problem that changes over time (often described by tricky differential equations) and 'transforms' it into a new 'language' (the 's-domain') where it becomes a much simpler algebra problem. After you solve it in this simpler language, you transform it back to see how your system behaves in real time.
        *   If {{{studentAudience}}} is "Electrical Engineering students," explain Laplace using RLC circuits or signal analysis. For instance, "it helps analyze how voltages and currents in circuits with capacitors and inductors behave, especially when things are switched on or off."
        *   If {{{studentAudience}}} is "Mechanical/Automotive Engineering students," explain Laplace using spring-damper systems (like car suspensions) or vibrations. For instance, "it helps us understand how a car's suspension reacts to a bump by changing a complex vibration problem into simpler algebra."
    *   **EXPLAIN THE PURPOSE FIRST (for the {{{studentAudience}}}):** For any mathematical tool, transformation, or formula, clearly state what problem it helps *them* solve or what insight it provides *before* showing the formula itself.
    *   **DECONSTRUCT FORMULAS (for the {{{studentAudience}}}):** When a formula is introduced (e.g., for an integral like $\\int_0^\\infty f(t) e^{-st} dt$, a transform, a series), explain *each part* of the formula conceptually, in plain language relevant to their field. For the Laplace integral: explain what $f(t)$ represents (e.g., a time-varying voltage, a mechanical displacement for *their* systems), what $e^{-st}$ represents (a decaying exponential 'weighting' or 'testing' function, where $s$ is a complex frequency related to system characteristics), what the integral symbol $\\int$ itself means (summing up an infinite number of tiny pieces), and what $F(s)$ (the result) signifies (a representation of $f(t)$ in the 's-domain' or frequency domain, which might simplify analysis of system stability or frequency response for *their* specific systems).
    *   **USE LATEX FOR ALL MATH:** **ALL** mathematical formulas, equations, expressions, individual variables (e.g., $x$, $y$, $s$, $t$), and symbols (e.g., $\\alpha$, $\\beta$, $\\int$, $\\sum$) **MUST** use LaTeX syntax. For inline math, use $...$. For display/block math, use $$...$$. Example: $F(s) = \\mathcal{L} \\{f(t)\\} = \\int_0^{\\infty} f(t)e^{-st} dt$. Another example for a polygon's angle sum: $(n-2) \\times 180^{\\circ}$.
    *   **ILLUSTRATIVE EXAMPLES (for the {{{studentAudience}}}):** Offer multiple examples with fully worked-out solutions, meticulously explaining the reasoning behind each step of the solution, using scenarios familiar to the {{{studentAudience}}}.
    *   **Wolfram Alpha Tool Usage**: If you need to perform a specific calculation, verify a formula, get properties of a mathematical function, obtain a step-by-step solution for an equation, or generate data for a plot to include in the explanation, consider using the 'askWolframAlpha' tool. Phrase your query to the tool clearly (e.g., "derivative of x^3 * sin(x)", "solve x^2 + 5x + 6 = 0 for x", "plot y = x^2 from x = -5 to 5"). Incorporate the tool's textual output meaningfully into your explanation. If the tool provides a placeholder message indicating it's not fully implemented, acknowledge this briefly if it makes sense in the flow of explanation, or simply proceed with your best general explanation.

-   **For Technical Drawing or Engineering Drawing topics (e.g., Orthographic Projection, Isometric Drawing, Dimensioning, CAD basics - always tailor to {{{studentAudience}}}):**
    *   Provide detailed, easy-to-follow descriptions of visual elements, components, or drawing conventions, explaining their purpose *within the context of the {{{studentAudience}}}'s field* (e.g., explain dimensioning rules with examples of mechanical parts for mechanical students, or circuit board layouts for electrical students if applicable).
    *   Explain principles (e.g., types of lines, projection methods, sectioning) with utmost clarity, using simple terms and visualizable examples relevant to their domain.
    *   Outline steps for creating specific types of drawings or using particular techniques in a very structured, easy-to-reproduce manner, focusing on applications relevant to the {{{studentAudience}}}.
    *   Suggest practical exercises or examples pertinent to their field (e.g., for automotive students: "Describe, step-by-step, how to draw a first-angle orthographic projection of a simple engine component, explaining what each view represents," or for electrical students: "Explain the fundamental rules for dimensioning a PCB layout, as if to a beginner, and why these rules are important for manufacturing.").

-   **For All Other Subjects (including general theoretical, humanities, social sciences, arts, conceptual sciences, etc.):**
    *   Your primary goal remains to produce **exceptionally comprehensive, detailed, conceptually accurate, and profoundly human-friendly** lesson notes. The "General Instructions for Explanations" provided above are critical here.
    *   Adapt the level of detail, examples, analogies, and explanations to the complexity of the specific topic and the particular needs and background of the {{{studentAudience}}}.
    *   For abstract or conceptual subjects, ensure you break down complex ideas into manageable parts. Define key terminology clearly and simply.
    *   Explore different perspectives, schools of thought, or theories if relevant to the topic. Explain their main arguments and, if appropriate, how they compare or contrast.
    *   Provide illustrative examples, case studies, scenarios, or thought experiments that make the concepts tangible and relatable to the {{{studentAudience}}}. For example, if discussing economic theories for business students, use business case studies. If discussing pedagogical theories for trainee teachers, use classroom scenarios.
    *   Prioritize critical thinking and deep understanding. Encourage the development of arguments, analysis of concepts, or application of theories to practical situations (if applicable).
    *   Always aim for exceptional clarity, accuracy, and intuitive understanding, tailored for *them*. The notes should be directly usable by a trainer to teach a comprehensive lesson.

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
        studentAudience: input.studentAudience?.trim() ? input.studentAudience.trim() : "a general technical audience (e.g., first-year college students or vocational trainees)",
    };

    const {output} = await prompt(processedInput);
    return output!;
  }
);

