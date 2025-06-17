
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating lesson notes based on a topic, key points, desired format, student audience, language style, and optional CBC alignment.
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
    .describe('A description of the target student audience, e.g., "Second-year electrical engineering students", "Automotive apprentice mechanics", "Level 4 Food Technology students", "Water Engineering trainees". This helps tailor examples and depth.'),
  languageOutputStyle: z
    .enum(['standard', 'simplified-english'])
    .optional()
    .default('standard')
    .describe("The desired language style for the notes. 'simplified-english' aims for easier comprehension."),
  isCbcCurriculum: z
    .boolean()
    .optional()
    .default(false)
    .describe("Set to true if the lesson plan should align with the Kenyan Competency-Based Curriculum (CBC)."),
});

export type GenerateLessonNotesInput = z.infer<
  typeof GenerateLessonNotesInputSchema
>;

const GenerateLessonNotesOutputSchema = z.object({
  lessonNotes: z
    .string()
    .describe('The generated lesson notes in Markdown format. For mathematical content, LaTeX syntax (e.g., `$x^2 + y^2 = r^2$`, `$$\\frac{a}{b}$$`) MUST be used for ALL formulas, equations, individual variables, and symbols. For technical drawing, detailed descriptions of visual elements or drawing steps should be provided. For other technical/vocational subjects, practical steps, safety considerations, and industry-relevant examples should be included where appropriate. If CBC alignment is requested, notes should reflect CBC principles.'),
});

export type GenerateLessonNotesOutput = z.infer<
  typeof GenerateLessonNotesOutputSchema
>;

export async function generateLessonNotes(
  input: GenerateLessonNotesInput
): Promise<GenerateLessonNotesOutput> {
  const flowName = 'generateLessonNotesFlow';
  console.log(`[${flowName}] Called with topic: ${input.lessonTopic}, format: ${input.noteFormat}, audience: ${input.studentAudience || 'general'}, language: ${input.languageOutputStyle}, CBC: ${input.isCbcCurriculum}`);
  const startTime = Date.now();

  try {
    const result = await generateLessonNotesFlow(input);
    const duration = Date.now() - startTime;
    console.log(`[${flowName}] Successfully completed in ${duration}ms.`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${flowName}] Failed after ${duration}ms. Error:`, error);
    console.error(`[${flowName}] Input that caused failure:`, {
      lessonTopic: input.lessonTopic,
      noteFormat: input.noteFormat,
      studentAudience: input.studentAudience,
      languageOutputStyle: input.languageOutputStyle,
      isCbcCurriculum: input.isCbcCurriculum,
      keyPointsCount: input.keyPoints?.length || 0,
    });
    if (error instanceof Error) {
        throw new Error(`AI lesson note generation failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during AI lesson note generation.');
  }
}

const prompt = ai.definePrompt({
  name: 'generateLessonNotesPrompt',
  input: {schema: GenerateLessonNotesInputSchema},
  output: {schema: GenerateLessonNotesOutputSchema},
  prompt: `You are an expert AI assistant tasked with creating **exceptionally comprehensive, detailed, technically accurate, and profoundly human-friendly** lesson notes for trainers.
Your goal is to produce notes that are thorough, informative, directly usable for teaching, and remarkably easy to understand.
The output MUST be in Markdown format, well-structured with clear headings, subheadings, bullet points, and bold text for emphasis on key terms.

Lesson Topic: {{{lessonTopic}}}

{{#if studentAudience}}
Student Audience: {{{studentAudience}}}
**Crucially, tailor all explanations, examples, analogies, and the depth of discussion to be highly relevant, relatable, and appropriate for this specific student audience.**
{{else}}
Student Audience: Assume a general technical audience (e.g., first-year college students in a technical field or vocational training).
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
Desired Language Output Style: {{{languageOutputStyle}}}

{{#if (eq languageOutputStyle "simplified-english")}}
**IMPORTANT LANGUAGE STYLE INSTRUCTION: Use Simplified English.**
This means:
- Employ clear and straightforward vocabulary. Avoid complex or rare words if simpler alternatives exist.
- Use shorter sentences and simpler sentence structures. Break down long, complex sentences into multiple shorter ones.
- Define any necessary technical jargon or specialized terms immediately and in very plain language.
- Prefer active voice over passive voice.
- Use concrete examples and analogies, especially those relevant to the {{{studentAudience}}}, to illustrate abstract concepts.
- Ensure explanations are direct and to the point, minimizing ambiguity.
- Organize information with very clear headings, subheadings, bullet points, and numbered lists to aid readability.
{{/if}}

**General Instructions for Explanations (Applicable to ALL subjects, apply these rigorously):**
1.  **Start with the 'Why' and 'What':** Before diving into details, formulas, or procedures, always explain the core concept in simple terms. Why is this topic important for the {{{studentAudience}}}? What problem does it solve for them in their field? What is the main idea in plain language?
2.  **Use Analogies:** For abstract or complex concepts, use relatable analogies tailored to the {{{studentAudience}}}.
3.  **Define Terms Clearly:** If a technical, vocational, or specialized term or jargon is unavoidable, define it immediately in simple, clear language.
4.  **Build from Simple to Complex:** Introduce concepts in a logical sequence. Start with foundational ideas and gradually build up to more complex aspects.
5.  **Step-by-Step for Processes/Arguments/Procedures:** For procedures, problem-solving techniques, derivations, or arguments, provide extremely clear, granular, step-by-step explanations. Explain the reasoning behind *each step*.
6.  **Illustrative Examples:** Provide concrete examples that demonstrate the concept or procedure. These examples should be highly relevant to the {{{studentAudience}}}'s field of study or common experiences. Work through examples fully.
7.  **Human-Friendly Tone:** Write as if you are a patient, knowledgeable, and enthusiastic teacher.

**Specific Instructions for Different Subject Categories (always tailor to {{{studentAudience}}} and apply {{{languageOutputStyle}}} if 'simplified-english' is chosen):**
-   **For Mathematics-related topics (e.g., Algebra, Calculus, Geometry, Trigonometry, Laplace Transforms, Fourier Series, Differential Equations):**
    *   **PRIORITIZE INTUITIVE UNDERSTANDING FOR THE SPECIFIED AUDIENCE ABOVE ALL ELSE.** Before presenting any complex formula or mathematical procedure, you *must* first explain the *'why'* (the purpose, the problem it solves *for them*) and the *'what'* (the core idea) in simple, relatable terms. Use analogies and real-world examples appropriate for the {{{studentAudience}}}.
    *   **EXPLAIN THE PURPOSE FIRST (for the {{{studentAudience}}}):** For any mathematical tool, transformation, or formula, clearly state what problem it helps *them* solve or what insight it provides *before* showing the formula itself.
    *   **DECONSTRUCT FORMULAS (for the {{{studentAudience}}}):** When a formula is introduced, explain *each part* of the formula conceptually, in plain language relevant to their field.
    *   **USE LATEX FOR ALL MATH:** **ALL** mathematical formulas, equations, expressions, individual variables (e.g., $x$, $y$, $s$, $t$), and symbols (e.g., $\\alpha$, $\\beta$, $\\int$, $\\sum$) **MUST** use LaTeX syntax. For inline math, use $...$. For display/block math, use $$...$$. Example: $F(s) = \\mathcal{L} \\{f(t)\\} = \\int_0^{\\infty} f(t)e^{-st} dt$.
    *   **ILLUSTRATIVE EXAMPLES (for the {{{studentAudience}}}):** Offer multiple examples with fully worked-out solutions, meticulously explaining the reasoning behind each step.
-   **For Technical Drawing or Engineering Drawing topics:**
    *   Provide detailed, easy-to-follow descriptions of visual elements, components, or drawing conventions, explaining their purpose *within the context of the {{{studentAudience}}}'s field*.
    *   Explain principles (e.g., types of lines, projection methods, sectioning) with utmost clarity.
    *   Outline steps for creating specific types of drawings or using particular techniques in a very structured manner.
-   **For All Other Technical, Vocational, and Theoretical Subjects:**
    *   **Practical Relevance and Application (especially for vocational/technical):** Emphasize practical application in real-world industry settings.
    *   **Procedures and Processes (especially for vocational/technical):** Provide clear, step-by-step instructions for specific procedures or techniques. Explain the 'why' behind each step.
    *   **Safety and Standards (especially for vocational/technical):** Incorporate information about safety protocols, industry standards, and regulations.
    *   **Tools and Equipment (especially for vocational/technical):** Describe specific tools, equipment, or materials and their use.
    *   **Problem-Solving Focus:** Frame content around solving problems relevant to the field.
    *   **Explore Perspectives (for theoretical/humanities):** Break down complex ideas, define key terminology, and explore different perspectives or theories.
    *   **Illustrative Scenarios:** Provide examples, case studies, or scenarios that make concepts tangible.

{{#if isCbcCurriculum}}
**KENYAN COMPETENCY-BASED CURRICULUM (CBC) ALIGNMENT:**
This lesson should be structured and detailed according to CBC principles. The notes should help a trainer deliver a CBC-aligned lesson.

**CBC Core Competencies (Kenya):**
1.  Communication and Collaboration
2.  Critical Thinking and Problem Solving
3.  Imagination and Creativity
4.  Citizenship
5.  Digital Literacy
6.  Learning to Learn
7.  Self-Efficacy

**CBC Core Values (Kenya):**
1.  Love
2.  Responsibility
3.  Respect
4.  Unity
5.  Patriotism
6.  Integrity

**CBC Lesson Note Structure and Content - Please ensure your output includes these sections clearly, tailored to the {{{lessonTopic}}} and {{{studentAudience}}}:**
*   **A. Lesson Title:** (Reiterate the {{{lessonTopic}}})
*   **B. Learning Area / Subject:** (Infer from {{{lessonTopic}}})
*   **C. Grade Level / Student Group:** (Based on {{{studentAudience}}})
*   **D. Learning Outcomes:**
    *   Define 2-4 specific, measurable, achievable, relevant, and time-bound (SMART) learning outcomes.
    *   Focus on what learners will be able to *do* (demonstrating competency) by the end of the lesson.
*   **E. Key Competency Focus:**
    *   Identify 1-2 primary CBC core competencies that this lesson will develop.
    *   Briefly explain how these competencies will be nurtured through the lesson activities.
*   **F. Values Integration:**
    *   Identify 1-2 CBC core values relevant to the lesson.
    *   Suggest how these values can be fostered during the lesson.
*   **G. Pertinent and Contemporary Issues (PCIs) Linkage:**
    *   Suggest 1-2 PCIs (e.g., Health, Environment, Financial Literacy, Safety, Digital Citizenship) that can be naturally integrated into the lesson. Explain the link.
*   **H. Learning Resources:**
    *   List a variety of resources: e.g., specific textbook pages, charts, models, realia (real objects), ICT tools/apps, videos, community resources. Be specific if possible.
*   **I. Lesson Introduction (Engage Phase - approx. X minutes):**
    *   Suggest an activity to capture learners' attention, arouse curiosity, and link to prior knowledge or experiences relevant to the {{{studentAudience}}}.
*   **J. Lesson Development (Explore, Explain, Elaborate Phases - approx. Y minutes):**
    *   Propose 2-3 learner-centered activities. These MUST promote active learning. Examples:
        *   Group discussions, pair work, think-pair-share.
        *   Practical hands-on tasks, experiments, demonstrations (especially for technical/vocational {{{studentAudience}}}).
        *   Inquiry-based projects, research tasks.
        *   Role-playing, simulations, case studies.
        *   Problem-solving activities.
    *   For each activity, explain:
        *   The procedure or steps.
        *   How it helps achieve the learning outcomes and develop the targeted competencies.
        *   The trainer's role (facilitator, guide) and learners' roles.
    *   **Detailed Content/Explanation:** Provide the core knowledge, concepts, skills, or procedures related to the {{{lessonTopic}}} and key points. Ensure this is comprehensive and accurate, applying the "General Instructions for Explanations" and "Specific Instructions for Different Subject Categories" from above. This is where the bulk of the technical information, mathematical derivations (using LaTeX), drawing steps, etc., should be.
*   **K. Lesson Conclusion (Evaluate/Extend Phase - approx. Z minutes):**
    *   Suggest ways to summarize key learning points.
    *   Include a brief activity or questions to consolidate understanding.
    *   Suggest a link to the next lesson or a take-away task if appropriate.
*   **L. Formative Assessment Strategies:**
    *   Suggest 1-2 specific formative assessment methods aligned with CBC to monitor learning and competency development *during or after* the lesson. Examples:
        *   Observation of learners during activities (using a simple checklist).
        *   Oral questioning (open-ended questions).
        *   Portfolio entries (e.g., student work samples, reflections).
        *   Short practical tasks or presentations.
        *   Peer or self-assessment based on simple criteria.
*   **M. Inclusive Practices:**
    *   Suggest 1-2 brief, practical strategies to accommodate diverse learners (e.g., varied activities, visual aids, peer support, flexible grouping).
*   **N. Extended Activities / Further Learning (Optional):**
    *   Suggest 1-2 optional activities or resources for learners who want to explore the topic further.

**Remember to apply the "General Instructions for Explanations" and "Specific Instructions for Different Subject Categories" throughout all relevant sections of the CBC lesson notes.**
The output should be well-structured Markdown. Use headings like "A. Lesson Title", "B. Learning Area", etc.

{{else}}
**STANDARD LESSON NOTES (Non-CBC):**
Please generate comprehensive lesson notes according to the following structure, applying the "General Instructions for Explanations" and "Specific Instructions for Different Subject Categories" as appropriate.
*   **Lesson Introduction:**
    *   Hook/Engaging start.
    *   Statement of learning objectives.
*   **Main Content / Key Concepts:**
    *   Detailed explanation of each key point from the input or identified by you.
    *   Incorporate examples, mathematical formulas (LaTeX), technical details, procedural steps as needed for the {{{lessonTopic}}} and {{{studentAudience}}}.
*   **Learning Activities / Practical Applications:**
    *   Suggestions for activities, exercises, or practical tasks.
*   **Summary / Conclusion:**
    *   Recap of main points.
*   **Assessment Ideas (Optional):**
    *   Suggestions for checking understanding.
*   **Required Materials/Resources:**
    *   List of materials needed.

Ensure the content is rich and covers the topic and key points in significant depth according to the guidelines above, especially tailoring for the {{{studentAudience}}} and adhering to the requested {{{languageOutputStyle}}}.
The notes should be formatted in valid Markdown with clear structure.
{{/if}}

Please generate the lesson notes now.
`,
});

const generateLessonNotesFlow = ai.defineFlow(
  {
    name: 'generateLessonNotesInternalFlow', // Renamed for clarity from the exported wrapper
    inputSchema: GenerateLessonNotesInputSchema,
    outputSchema: GenerateLessonNotesOutputSchema,
  },
  async input => {
    const processedInput = {
        ...input,
        keyPoints: input.keyPoints?.filter(kp => kp.trim() !== "").length > 0 ? input.keyPoints.filter(kp => kp.trim() !== "") : undefined,
        studentAudience: input.studentAudience?.trim() ? input.studentAudience.trim() : "a general technical audience (e.g., first-year college students or vocational trainees)",
        languageOutputStyle: input.languageOutputStyle || 'standard',
        isCbcCurriculum: input.isCbcCurriculum || false,
    };

    const {output} = await prompt(processedInput);
    if (!output) { 
        throw new Error("AI prompt did not produce an output for lesson notes.");
    }
    return output;
  }
);

