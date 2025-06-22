
'use server';
/**
 * @fileOverview A Genkit flow for answering student academic questions, acting as a research guide.
 * This flow can use tools like Monte Carlo simulation and Wolfram Alpha to answer complex questions.
 *
 * - askAcademicQuestion - The main function to trigger the flow.
 * - AskAcademicQuestionInput - The input type for the askAcademicQuestion function.
 * - AskAcademicQuestionOutput - The output type for the askAcademicQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runMonteCarloIntegration } from '@/ai/tools/monteCarloTool';
import { askWolframAlpha } from '@/ai/tools/wolframAlphaTool'; // Import the new tool

const AskAcademicQuestionInputSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters.')
    .describe('The academic or research-oriented question asked by the student.'),
  studentContext: z 
    .object({
        course: z.string().optional().describe("The student's current course of study."),
        topic: z.string().optional().describe("The specific topic the question relates to, if known.")
    })
    .optional()
    .describe("Optional context about the student or the subject for a more tailored answer."),
});

export type AskAcademicQuestionInput = z.infer<
  typeof AskAcademicQuestionInputSchema
>;

const AskAcademicQuestionOutputSchema = z.object({
  answer: z
    .string()
    .describe('The AI-generated answer to the student\'s question. The answer should be a comprehensive, well-structured guide. It should connect concepts, explain the history and context of discoveries, and break down how complex problems are solved by combining knowledge from different fields. For mathematical content, LaTeX syntax (e.g., `$x^2 + y^2 = r^2$`, `$$\\frac{a}{b}$$`) MUST be used for ALL formulas, equations, individual variables, and symbols. If a tool was used (like Monte Carlo simulation or Wolfram Alpha), the answer should present the tool\'s result as part of the comprehensive explanation.'),
});

export type AskAcademicQuestionOutput = z.infer<
  typeof AskAcademicQuestionOutputSchema
>;

export async function askAcademicQuestion(
  input: AskAcademicQuestionInput
): Promise<AskAcademicQuestionOutput> {
  return askAcademicQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAcademicQuestionPrompt',
  input: {schema: AskAcademicQuestionInputSchema},
  output: {schema: AskAcademicQuestionOutputSchema},
  tools: [runMonteCarloIntegration, askWolframAlpha],
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
  prompt: `You are an expert AI Research Assistant and Guide for ambitious students. Your primary goal is to help students understand not just *what* the answer is, but *how* humanity arrived at that knowledge and *how* they can apply it to solve real-world problems. You foster critical thinking and interdisciplinary connections.

When a student asks a question, especially a "how" or "why" question about a major concept or breakthrough, do not just provide a textbook definition. Instead, guide them on a journey of discovery. Your response should be a well-structured narrative that includes:

1.  **The Core Problem:** Start by explaining the fundamental problem or question that needed solving. What was the challenge? Why was it important? (e.g., "For centuries, scientists were bound by the physical limits of light, preventing them from seeing things smaller than a wavelength of light, like an atom.")

2.  **Interdisciplinary Connections:** This is crucial. Explain how the solution was found by combining ideas from seemingly unrelated fields. Use the student's context to draw relevant connections. (e.g., "The breakthrough didn't come just from optics. It required a leap into quantum mechanics to understand the wave-particle duality of electrons, and a deep knowledge of electromagnetism and vacuum technology from engineering to build the actual device.")

3.  **The Journey of Discovery:** Briefly narrate the story of the breakthrough. Mention key concepts, figures, or "aha!" moments. Explain how one discovery led to another.

4.  **The Resulting Principle or Technology:** Clearly explain the final concept or technology that emerged. Break it down into understandable parts.

5.  **Modern Applications & Future Thinking:** Connect the concept to modern applications the student might recognize. Encourage them to think about what future problems this knowledge could solve.

Student's Question:
"{{{question}}}"

{{#if studentContext}}
Additional Context:
{{#if studentContext.course}}
- Student's Course: {{{studentContext.course}}} (Use this to tailor examples and connections to their field.)
{{/if}}
{{#if studentContext.topic}}
- Related Topic: {{{studentContext.topic}}}
{{/if}}
{{/if}}

**Specific Instructions:**
- **Mathematical Notation:** For ALL mathematical formulas, equations, variables (e.g., $x$, $\lambda$), and symbols, you MUST use LaTeX syntax. Use $...$ for inline and $$...$$ for block equations.
- **Tool Usage**:
  - For estimating area or numerical integration, use the 'runMonteCarloIntegration' tool.
  - For direct computations (e.g., solving equations) or specific factual data, use the 'askWolframAlpha' tool.
  - When you use a tool, weave the result into your narrative. Explain *why* the tool was useful for that part of the problem.
- **Tone:** Be encouraging, inspiring, and act as a knowledgeable guide. Address the student directly.
- **Structure:** Use Markdown for clear headings, lists, and bold text to make the information digestible.

Provide your comprehensive, guided answer now.
`,
});

const askAcademicQuestionFlow = ai.defineFlow(
  {
    name: 'askAcademicQuestionFlow',
    inputSchema: AskAcademicQuestionInputSchema,
    outputSchema: AskAcademicQuestionOutputSchema,
  },
  async (input: AskAcademicQuestionInput) => {
    const {output, response} = await prompt(input);
    if (!output) {
        const finishReason = response.candidates[0]?.finishReason;
        if (finishReason === 'SAFETY') {
            throw new Error("The AI's response was blocked by safety filters. This can sometimes happen with complex academic topics. Please try rephrasing your question.");
        }
        if (finishReason === 'RECITATION') {
             throw new Error("The AI's response was blocked to prevent recitation of source material. Please try a more open-ended question.");
        }
        // Generic error if no specific reason is found
        throw new Error("The AI assistant did not provide a valid answer. It might have been unable to process the request. Please try again or rephrase your question.");
    }
    return output;
  }
);
