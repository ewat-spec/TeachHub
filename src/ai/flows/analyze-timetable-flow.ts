
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a timetable based on curriculum guidelines and scheduled classes.
 *
 * - analyzeTimetable - The main function to trigger the flow.
 * - AnalyzeTimetableInput - The input type for the analyzeTimetable function.
 * - AnalyzeTimetableOutput - The output type for the analyzeTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScheduledClassSchema = z.object({
  topic: z.string().describe("The topic or subject of the class."),
  trainerName: z.string().optional().describe("The name of the trainer assigned to the class."),
  dayOfWeek: z.string().describe("The day of the week for the class (e.g., Monday, Tuesday)."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time in HH:MM format (e.g., 09:00, 14:30).").describe("The start time of the class in HH:MM format."),
  durationHours: z.number().positive().describe("The duration of the class in hours."),
  venue: z.string().optional().describe("The venue or room for the class."),
});

const AnalyzeTimetableInputSchema = z.object({
  curriculumGuidelines: z
    .string()
    .min(10, "Curriculum guidelines must be at least 10 characters.")
    .describe(
      'Text description of curriculum guidelines. This should include subject priorities, ' +
      'total recommended hours per subject (e.g., per week or term), preferred/discouraged time slots for certain subjects, ' +
      'any known constraints like teacher availability or fixed events.'
    ),
  scheduledClasses: z
    .array(ScheduledClassSchema)
    .min(1, "At least one scheduled class is required for analysis.")
    .describe('The list of currently scheduled classes to analyze.'),
});

export type AnalyzeTimetableInput = z.infer<typeof AnalyzeTimetableInputSchema>;

const ClashDetailSchema = z.object({
  description: z.string().describe("A clear description of the clash (e.g., 'Trainer John Smith is double-booked', 'Venue Room 101 is double-booked')."),
  conflictingItems: z.array(z.string()).describe("Details of the conflicting items, e.g., list of class topics, or trainer name and venue involved."),
  involvedClasses: z.array(
    z.object({
      topic: z.string(),
      day: z.string(),
      time: z.string()
    })
  ).describe("Specific classes involved in the clash, including their topic, day, and time.")
});

const AnalyzeTimetableOutputSchema = z.object({
  identifiedClashes: z
    .array(ClashDetailSchema)
    .describe('List of identified scheduling clashes (trainer, venue, etc.).'),
  timeAllocationFeedback: z
    .array(z.string())
    .describe('Feedback on subject time allocations compared to curriculum guidelines (e.g., "Maths seems under-allocated by 2 hours per week based on guidelines.").'),
  generalSuggestions: z
    .array(z.string())
    .describe('Other suggestions for improving the timetable, such as better sequencing of subjects or adherence to preferred time slots mentioned in guidelines.'),
  overallAssessment: z.string().describe("A brief overall assessment of the timetable's adherence to guidelines and potential issues.")
});

export type AnalyzeTimetableOutput = z.infer<typeof AnalyzeTimetableOutputSchema>;

export async function analyzeTimetable(
  input: AnalyzeTimetableInput
): Promise<AnalyzeTimetableOutput> {
  // Potentially add pre-processing for input if needed, e.g., sorting classes by day/time
  return analyzeTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTimetablePrompt',
  input: {schema: AnalyzeTimetableInputSchema},
  output: {schema: AnalyzeTimetableOutputSchema},
  prompt: `You are an expert AI assistant for school/training center timetabling.
Your task is to analyze a list of scheduled classes against provided curriculum guidelines.

Curriculum Guidelines:
{{{curriculumGuidelines}}}

Scheduled Classes:
{{#each scheduledClasses}}
- Subject/Topic: {{{topic}}}
  Trainer: {{#if trainerName}}{{{trainerName}}}{{else}}N/A{{/if}}
  Day: {{{dayOfWeek}}}
  Time: {{{startTime}}}
  Duration: {{{durationHours}}} hours
  Venue: {{#if venue}}{{{venue}}}{{else}}N/A{{/if}}
{{/each}}

Based on the above information, please provide a detailed analysis. Your analysis should include:
1.  **Identified Clashes**:
    *   Check for trainers scheduled for multiple classes at the same time.
    *   Check for venues used for multiple classes at the same time.
    *   List each clash with a clear description and the specific classes/details involved.
2.  **Time Allocation Feedback**:
    *   Evaluate if the time allocated to subjects (derived from topics) aligns with the curriculum guidelines (e.g., total hours per week/term).
    *   Mention subjects that seem over-allocated or under-allocated.
3.  **General Suggestions**:
    *   Provide suggestions for resolving clashes.
    *   Suggest improvements based on any preferences mentioned in the guidelines (e.g., "Maths should be in the morning").
    *   Comment on the overall balance and structure of the timetable.
4.  **Overall Assessment**:
    *   Provide a brief summary of how well the timetable meets the guidelines and highlights key areas for improvement.

Focus on providing actionable and clear feedback. When reporting clashes, be specific about which classes, trainers, or venues are involved, and at what day/time the clash occurs.
For time allocation, try to quantify discrepancies if possible (e.g., "Subject X needs 2 more hours").
Be precise and thorough in your analysis.
`,
});

const analyzeTimetableFlow = ai.defineFlow(
  {
    name: 'analyzeTimetableFlow',
    inputSchema: AnalyzeTimetableInputSchema,
    outputSchema: AnalyzeTimetableOutputSchema,
  },
  async (input: AnalyzeTimetableInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not produce an output.");
    }
    return output;
  }
);
