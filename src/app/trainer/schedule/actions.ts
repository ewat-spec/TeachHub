
'use server';

import { 
  analyzeTimetable as genkitAnalyzeTimetable,
  type AnalyzeTimetableInput,
  type AnalyzeTimetableOutput
} from '@/ai/flows/analyze-timetable-flow';

import { 
  analyzeTrainerPerformance as genkitAnalyzeTrainerPerformance,
  type AnalyzeTrainerPerformanceInput,
  type AnalyzeTrainerPerformanceOutput
} from '@/ai/flows/analyze-trainer-performance-flow';

export async function getAiTimetableAnalysis(input: AnalyzeTimetableInput): Promise<AnalyzeTimetableOutput> {
  try {
    const result = await genkitAnalyzeTimetable(input);
    return result;
  } catch (error) {
    console.error("Error getting AI timetable analysis:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get AI timetable analysis: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching AI timetable analysis.");
  }
}


export async function getAiPerformanceAnalysis(input: AnalyzeTrainerPerformanceInput): Promise<AnalyzeTrainerPerformanceOutput> {
  try {
    const result = await genkitAnalyzeTrainerPerformance(input);
    return result;
  } catch (error) {
    console.error("Error getting AI performance analysis:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get AI performance analysis: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching AI performance analysis.");
  }
}
