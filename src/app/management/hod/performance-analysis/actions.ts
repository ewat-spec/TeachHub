
'use server';

import { 
  analyzeStudentPerformance as genkitAnalyzeStudentPerformance,
  type AnalyzeStudentPerformanceInput,
  type AnalyzeStudentPerformanceOutput
} from '@/ai/flows/analyze-student-performance-flow';

export async function getAiStudentAnalysis(input: AnalyzeStudentPerformanceInput): Promise<AnalyzeStudentPerformanceOutput> {
  try {
    const result = await genkitAnalyzeStudentPerformance(input);
    return result;
  } catch (error) {
    console.error("Error getting AI student performance analysis:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get AI analysis: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching AI analysis.");
  }
}
