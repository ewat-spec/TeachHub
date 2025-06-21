
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import '@/ai/flows/suggest-lesson-plan-elements.ts';
import '@/ai/flows/generate-lesson-notes-flow.ts';
import '@/ai/flows/analyze-timetable-flow.ts';
import '@/ai/tools/monteCarloTool.ts'; // Import the new tool
import '@/ai/flows/ask-academic-question-flow.ts';
