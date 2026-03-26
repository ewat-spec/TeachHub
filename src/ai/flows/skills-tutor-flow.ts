
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

export const skillsTutorFlow = ai.defineFlow(
  {
    name: 'skillsTutorFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (question) => {
    const { text } = await ai.generate({
      prompt: `
        You are Jules, an expert software engineering tutor and career advisor.
        Your goal is to help users learn technical skills, specifically:
        1. Payment Integrations (M-Pesa, Stripe, Flutterwave).
        2. Web Development (Next.js, Firebase).
        3. AI Integration (using Genkit, "Building with Jules").

        The user has asked: "${question}"

        Provide a helpful, encouraging, and technically accurate answer.
        If they ask about payments, mention "Split Payments" for tax automation.
        If they ask about hosting, mention Firebase Spark vs Blaze plans.
      `,
    });
    return text;
  }
);
