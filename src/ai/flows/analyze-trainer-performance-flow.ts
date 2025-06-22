
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a trainer's workload and performance.
 *
 * - analyzeTrainerPerformance - The main function to trigger the flow.
 * - AnalyzeTrainerPerformanceInput - The input type for the flow.
 * - AnalyzeTrainerPerformanceOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScheduledClassSchema = z.object({
  topic: z.string().describe("The topic or subject of the class."),
  durationHours: z.number().positive().describe("The duration of the class in hours."),
  isPractical: z.boolean().optional().describe("Whether the class is a practical (long) session or theory (short) session."),
  dayOfWeek: z.string().describe("The day of the week for the class (e.g., Monday, Tuesday)."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe("The start time of the class in HH:MM format."),
});

const AnalyzeTrainerPerformanceInputSchema = z.object({
  trainerName: z.string().describe("The name of the trainer being analyzed."),
  scheduledClasses: z.array(ScheduledClassSchema).min(1, "At least one scheduled class is required.").describe("The trainer's list of scheduled classes for the week."),
  weeklyHourTarget: z.number().positive("Weekly hour target must be a positive number.").describe("The target number of teaching hours for the trainer per week (e.g., 30)."),
  performanceGoals: z.string().optional().describe("Optional text describing specific performance goals or areas of focus for the trainer (e.g., 'Improve student engagement in theory classes', 'Better integration of practical examples')."),
});

export type AnalyzeTrainerPerformanceInput = z.infer<typeof AnalyzeTrainerPerformanceInputSchema>;

const AnalyzeTrainerPerformanceOutputSchema = z.object({
  totalScheduledHours: z.number().describe("The calculated total number of hours scheduled for the trainer for the week."),
  workloadAnalysis: z.string().describe("An analysis of the total scheduled hours compared to the weekly target. Notes if the trainer is under, over, or on target."),
  scheduleBalanceFeedback: z.array(z.string()).describe("Feedback on the balance of the schedule, considering factors like back-to-back classes, mix of practical/theory, and distribution of classes throughout the week."),
  performanceImprovementSuggestions: z.array(z.string()).describe("Actionable suggestions for performance improvement based on the schedule, workload, and provided performance goals. Suggestions should be pedagogical in nature."),
  overallSummary: z.string().describe("A brief overall summary of the trainer's weekly schedule and performance outlook."),
});

export type AnalyzeTrainerPerformanceOutput = z.infer<typeof AnalyzeTrainerPerformanceOutputSchema>;

export async function analyzeTrainerPerformance(
  input: AnalyzeTrainerPerformanceInput
): Promise<AnalyzeTrainerPerformanceOutput> {
  return analyzeTrainerPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTrainerPerformancePrompt',
  input: {schema: AnalyzeTrainerPerformanceInputSchema},
  output: {schema: AnalyzeTrainerPerformanceOutputSchema},
  prompt: `You are an expert AI Pedagogical Coach for vocational and technical trainers.
Your task is to analyze a trainer's weekly schedule and provide feedback on their workload, schedule balance, and potential areas for performance improvement.

Trainer Name: {{{trainerName}}}
Weekly Hour Target: {{{weeklyHourTarget}}} hours

{{#if performanceGoals}}
Trainer's Performance Goals: {{{performanceGoals}}}
{{/if}}

Trainer's Scheduled Classes for the Week:
{{#each scheduledClasses}}
- Topic: {{{topic}}}
  Day: {{{dayOfWeek}}} at {{{startTime}}}
  Duration: {{{durationHours}}} hours
  {{#if isPractical}} (Practical Session) {{else}} (Theory Session) {{/if}}
{{/each}}

Please provide a detailed analysis with the following structure:

1.  **Workload Analysis**:
    *   First, calculate and state the 'totalScheduledHours'.
    *   Compare the total scheduled hours to the 'weeklyHourTarget'. State clearly if the trainer is over, under, or meeting their target and by how many hours.

2.  **Schedule Balance Feedback**:
    *   Analyze the distribution of classes. Are they clustered on certain days?
    *   Look for challenging sequences, like multiple long practical sessions back-to-back or long teaching days without significant breaks.
    *   Comment on the mix between theory (short) and practical (long) sessions. Is there a good balance?
    *   Provide specific, constructive feedback points in the 'scheduleBalanceFeedback' array.

3.  **Performance Improvement Suggestions**:
    *   Based on the schedule and any provided 'performanceGoals', offer actionable advice.
    *   If there are large gaps in the schedule, suggest using that time for lesson preparation, student consultations, or professional development.
    *   If the schedule is very dense, suggest strategies for efficient preparation or time management.
    *   If performance goals are mentioned, link your suggestions directly to them. For example, if the goal is 'student engagement', and you see many theory classes, suggest breaking them into smaller chunks with interactive elements.
    *   Populate the 'performanceImprovementSuggestions' array with these tips.

4.  **Overall Summary**:
    *   Provide a brief, encouraging 'overallSummary' of the schedule analysis.

Adopt a supportive and constructive tone, like a helpful mentor.
`,
});

const analyzeTrainerPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeTrainerPerformanceFlow',
    inputSchema: AnalyzeTrainerPerformanceInputSchema,
    outputSchema: AnalyzeTrainerPerformanceOutputSchema,
  },
  async (input: AnalyzeTrainerPerformanceInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not produce an output.");
    }
    return output;
  }
);
