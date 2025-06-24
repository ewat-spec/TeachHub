
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing student performance data.
 *
 * - analyzeStudentPerformance - The main function to trigger the flow.
 * - AnalyzeStudentPerformanceInput - The input type for the flow.
 * - AnalyzeStudentPerformanceOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStudentPerformanceInputSchema = z.object({
  studentDataCsv: z
    .string()
    .min(10, "Student data must be provided as a CSV string with at least one student.")
    .describe(
      'A CSV string representing student performance data. Must include columns: ' +
      '"StudentName", "Course", "Mark", "TotalMarks". The AI will analyze this data.'
    ),
  analysisContext: z.string().optional().describe("Optional context for the analysis, such as 'This is for the mid-term review' or 'Focus on identifying students for the advanced program'.")
});

export type AnalyzeStudentPerformanceInput = z.infer<typeof AnalyzeStudentPerformanceInputSchema>;

const StudentHighlightSchema = z.object({
    studentName: z.string().describe("The name of the student."),
    course: z.string().describe("The course the student is enrolled in."),
    mark: z.number().describe("The mark the student achieved."),
    totalMarks: z.number().describe("The total possible marks for the assessment."),
    reason: z.string().describe("A brief, insightful reason why this student was highlighted (e.g., 'Highest percentile in a difficult course', 'Significant drop from previous performance trends')."),
});

const AnalyzeStudentPerformanceOutputSchema = z.object({
  topPerformers: z
    .array(StudentHighlightSchema)
    .describe("A list of students who are performing exceptionally well."),
  studentsToWatch: z
    .array(StudentHighlightSchema)
    .describe("A list of students who may be struggling, at risk, or showing unexpected performance drops that warrant attention."),
  overallTrends: z
    .array(z.string())
    .describe("A list of observed overall trends across all provided student data (e.g., 'General difficulty in the 'Advanced Calculus' course', 'High performance in practical assessments')."),
  summary: z.string().describe("A concise summary of the key findings and actionable insights for the Head of Department."),
});

export type AnalyzeStudentPerformanceOutput = z.infer<typeof AnalyzeStudentPerformanceOutputSchema>;

export async function analyzeStudentPerformance(
  input: AnalyzeStudentPerformanceInput
): Promise<AnalyzeStudentPerformanceOutput> {
  return analyzeStudentPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStudentPerformancePrompt',
  input: {schema: AnalyzeStudentPerformanceInputSchema},
  output: {schema: AnalyzeStudentPerformanceOutputSchema},
  prompt: `You are an expert AI Educational Data Analyst. Your role is to assist a Head of Department (HOD) by analyzing student performance data to identify key insights.
The data is provided in a simple CSV format.

**Your Task:**
Analyze the following student performance data. Your goal is to identify top-performing students, students who might need support, and any notable trends in the data. Provide a concise, actionable summary for the HOD.

{{#if analysisContext}}
**Analysis Context/Goal:** {{{analysisContext}}}
(Use this context to tailor your analysis and recommendations.)
{{/if}}

**Student Performance Data (CSV):**
\`\`\`csv
{{{studentDataCsv}}}
\`\`\`

**Analysis Structure:**

1.  **Top Performers**:
    *   Identify students who have scored exceptionally high, especially in challenging courses or those showing remarkable aptitude.
    *   For each, provide their name, course, mark, and a brief reason for highlighting them.

2.  **Students to Watch**:
    *   Identify students who are underperforming, have scores that are outliers (low), or whose performance might indicate they are struggling or at risk. This could also include students with passing-but-borderline grades that need a check-in.
    *   For each, provide their name, course, mark, and a brief reason why they need attention.

3.  **Overall Trends**:
    *   Analyze the data as a whole. Are there specific courses where students are consistently scoring low or high? Is there a noticeable difference between different types of assessments?
    *   Provide a list of 3-5 key trend observations.

4.  **Summary for HOD**:
    *   Write a brief, professional summary of your findings. Conclude with actionable insights. For example, suggest which departments might need more resources, which students could mentor others, or where curriculum adjustments might be beneficial.

Please be analytical and insightful in your response. The HOD relies on your analysis to make informed decisions.
`,
});

const analyzeStudentPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeStudentPerformanceFlow',
    inputSchema: AnalyzeStudentPerformanceInputSchema,
    outputSchema: AnalyzeStudentPerformanceOutputSchema,
  },
  async (input: AnalyzeStudentPerformanceInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not produce a valid output.");
    }
    return output;
  }
);
