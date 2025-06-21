
'use server';
/**
 * @fileOverview A Genkit flow for answering student academic questions.
 * This flow can use tools like Monte Carlo simulation to answer complex questions.
 *
 * - askAcademicQuestion - The main function to trigger the flow.
 * - AskAcademicQuestionInput - The input type for the askAcademicQuestion function.
 * - AskAcademicQuestionOutput - The output type for the askAcademicQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runMonteCarloIntegration } from '@/ai/tools/monteCarloTool';

const AskAcademicQuestionInputSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters.')
    .describe('The academic question asked by the student.'),
  studentContext: z // Optional context about the student or course for better answers
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
    .describe('The AI-generated answer to the student\'s question. The answer should be clear, concise, and helpful. For mathematical content, LaTeX syntax (e.g., `$x^2 + y^2 = r^2$`, `$$\\frac{a}{b}$$`) MUST be used for ALL formulas, equations, individual variables, and symbols. If a tool was used (like Monte Carlo simulation), the answer should present the tool\'s result as part of a comprehensive explanation.'),
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
  tools: [runMonteCarloIntegration], // Make the tool available to the AI
  prompt: `You are a friendly and knowledgeable AI academic assistant for students. Your goal is to help students understand concepts by providing clear, concise, and accurate explanations.
Address the student directly and maintain a supportive tone.

Student's Question:
"{{{question}}}"

{{#if studentContext}}
Additional Context:
{{#if studentContext.course}}
- Student's Course: {{{studentContext.course}}}
{{/if}}
{{#if studentContext.topic}}
- Related Topic: {{{studentContext.topic}}}
  (If the question seems related to this topic, try to provide context or examples relevant to it.)
{{/if}}
{{/if}}

Please provide an answer to the student's question.
- Break down complex ideas into smaller, understandable parts.
- Use simple language where possible, but define technical terms if they are necessary.
- If the question involves calculations or mathematical formulas, explain the steps and use LaTeX for all mathematical notation (e.g., $E=mc^2$, variables like $x$, or display equations like $$\\sum_{i=1}^n x_i$$).
- **Tool Usage**: If the question involves estimating the area under a curve or requires numerical integration, use the 'runMonteCarloIntegration' tool. When you use a tool, present the result clearly within your explanation (e.g., "Using a Monte Carlo simulation with 100,000 points, the estimated area is..."). Do not just state the answer; explain the concept and how the tool helps find the solution.
- If the question is ambiguous, you can ask clarifying questions or provide an answer based on the most likely interpretation, stating your assumption.
- If the question is outside of a typical academic scope (e.g., personal advice, non-educational topics), politely decline to answer or redirect.
- Encourage the student to verify critical information with their instructor or textbooks.

Answer:
`,
});

const askAcademicQuestionFlow = ai.defineFlow(
  {
    name: 'askAcademicQuestionFlow',
    inputSchema: AskAcademicQuestionInputSchema,
    outputSchema: AskAcademicQuestionOutputSchema,
  },
  async (input: AskAcademicQuestionInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI assistant did not provide an answer.");
    }
    return output;
  }
);
