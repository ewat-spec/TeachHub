
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a timetable based on curriculum guidelines and scheduled classes,
 * with special attention to common courses.
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
  isCommonCourse: z.boolean().optional().describe("Set to true if this is a common course attended by students from multiple departments/groups."),
});

const AnalyzeTimetableInputSchema = z.object({
  curriculumGuidelines: z
    .string()
    .min(10, "Curriculum guidelines must be at least 10 characters.")
    .describe(
      'Text description of curriculum guidelines. This should include subject priorities, ' +
      'total recommended hours per subject (e.g., per week or term), preferred/discouraged time slots for certain subjects, ' +
      'any known constraints like teacher availability or fixed events. ' +
      '**For common courses, specify which student groups (e.g., "all Level 4 students", "Engineering and Business Year 1 students") must attend and any specific scheduling rules for them.**'
    ),
  scheduledClasses: z
    .array(ScheduledClassSchema)
    .min(1, "At least one scheduled class is required for analysis.")
    .describe('The list of currently scheduled classes to analyze.'),
});

export type AnalyzeTimetableInput = z.infer<typeof AnalyzeTimetableInputSchema>;

const ClashDetailSchema = z.object({
  description: z.string().describe("A clear description of the clash (e.g., 'Trainer John Smith is double-booked', 'Venue Room 101 is double-booked', 'Level 4 Engineering students have a clash between Common Course COM101 and Core ENG402')."),
  conflictingItems: z.array(z.string()).describe("Details of the conflicting items, e.g., list of class topics, trainer name, venue, or student group involved."),
  involvedClasses: z.array(
    z.object({
      topic: z.string(),
      day: z.string(),
      time: z.string(),
      isCommon: z.boolean().optional(),
    })
  ).describe("Specific classes involved in the clash, including their topic, day, time, and whether it's a common course.")
});

const AnalyzeTimetableOutputSchema = z.object({
  identifiedClashes: z
    .array(ClashDetailSchema)
    .describe('List of identified scheduling clashes (trainer, venue, student groups, etc.).'),
  timeAllocationFeedback: z
    .array(z.string())
    .describe('Feedback on subject time allocations compared to curriculum guidelines (e.g., "Maths seems under-allocated by 2 hours per week based on guidelines.").'),
  generalSuggestions: z
    .array(z.string())
    .describe('Other suggestions for improving the timetable, such as better sequencing of subjects, adherence to preferred time slots, or strategies for common course scheduling.'),
  overallAssessment: z.string().describe("A brief overall assessment of the timetable's adherence to guidelines and potential issues.")
});

export type AnalyzeTimetableOutput = z.infer<typeof AnalyzeTimetableOutputSchema>;

export async function analyzeTimetable(
  input: AnalyzeTimetableInput
): Promise<AnalyzeTimetableOutput> {
  return analyzeTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTimetablePrompt',
  input: {schema: AnalyzeTimetableInputSchema},
  output: {schema: AnalyzeTimetableOutputSchema},
  prompt: `You are an expert AI assistant for school/training center timetabling.
Your task is to analyze a list of scheduled classes against provided curriculum guidelines, with special attention to common courses.

Curriculum Guidelines:
{{{curriculumGuidelines}}}
(Pay close attention to any rules specified here for common courses, including which student groups must attend them, and any preferred scheduling patterns or constraints for these common courses.)

Scheduled Classes:
{{#each scheduledClasses}}
- Subject/Topic: {{{topic}}}
  Trainer: {{#if trainerName}}{{{trainerName}}}{{else}}N/A{{/if}}
  Day: {{{dayOfWeek}}}
  Time: {{{startTime}}}
  Duration: {{{durationHours}}} hours
  Venue: {{#if venue}}{{{venue}}}{{else}}N/A{{/if}}
  {{#if isCommonCourse}}**This is a COMMON COURSE.**{{/if}}
{{/each}}

Based on the above information, please provide a detailed analysis. Your analysis should include:
1.  **Identified Clashes**:
    *   Check for trainers scheduled for multiple classes at the same time.
    *   Check for venues used for multiple classes at the same time.
    *   **Common Course Clashes**: Critically, identify if students who are required to attend a common course (as indicated by the 'isCommonCourse' flag or described in the curriculum guidelines) are also scheduled for another class (e.g., a departmental core subject) at the same time. The guidelines should specify which student groups are affected by common courses. Clearly state the student group and the clashing courses.
    *   List each clash with a clear description and the specific classes/details involved (including whether a class is common).

2.  **Time Allocation Feedback**:
    *   Evaluate if the time allocated to subjects (derived from topics) aligns with the curriculum guidelines (e.g., total hours per week/term).
    *   Mention subjects that seem over-allocated or under-allocated.

3.  **General Suggestions**:
    *   Provide suggestions for resolving clashes, especially those involving common courses. This might include suggesting alternative time slots that are free for all required student groups.
    *   Suggest improvements based on any preferences mentioned in the guidelines (e.g., "Maths should be in the morning", "Common courses should be on Wednesday afternoons").
    *   Comment on the scheduling of common courses: Are they scheduled effectively for all intended student groups? Do they adhere to specific common course rules from the guidelines?
    *   Comment on the overall balance and structure of the timetable.

4.  **Overall Assessment**:
    *   Provide a brief summary of how well the timetable meets the guidelines, highlighting key areas for improvement, especially concerning common courses.

Focus on providing actionable and clear feedback. When reporting clashes, be specific about which classes (noting if common), trainers, venues, or student groups (if discernable from guidelines for common courses) are involved, and at what day/time the clash occurs.
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
    // Add isCommon to involvedClasses in output if the input class was common
    const processedOutput = {
        ...output,
        identifiedClashes: output.identifiedClashes.map(clash => ({
            ...clash,
            involvedClasses: clash.involvedClasses.map(involvedClass => {
                const originalClass = input.scheduledClasses.find(sc =>
                    sc.topic === involvedClass.topic &&
                    sc.dayOfWeek === involvedClass.day &&
                    sc.startTime === involvedClass.time
                );
                return {
                    ...involvedClass,
                    isCommon: originalClass?.isCommonCourse
                };
            })
        }))
    };
    return processedOutput;
  }
);

    