
'use server';
/**
 * @fileOverview A Genkit tool for querying Wolfram Alpha.
 *
 * - askWolframAlpha - A tool that allows querying Wolfram Alpha.
 * - WolframAlphaQueryInput - Input schema for the tool.
 * - WolframAlphaQueryOutput - Output schema for the tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const WolframAlphaQueryInputSchema = z.object({
  query: z.string().describe('The query to send to Wolfram Alpha (e.g., "derivative of x^3 * sin(x)", "plot sin(x) from -pi to pi", "integrate 1/(x^2+1) dx from 0 to 1").'),
});
export type WolframAlphaQueryInput = z.infer<typeof WolframAlphaQueryInputSchema>;

export const WolframAlphaQueryOutputSchema = z.string().describe("The result from Wolfram Alpha, typically plain text or a description of an image/plot. If the query is for a plot, this might describe the plot or provide a placeholder for where plot data would go.");
export type WolframAlphaQueryOutput = z.infer<typeof WolframAlphaQueryOutputSchema>;

/**
 * A Genkit tool to query Wolfram Alpha.
 * This tool requires a Wolfram Alpha AppID to be set in the environment variables
 * as WOLFRAM_ALPHA_APPID.
 */
export const askWolframAlpha = ai.defineTool(
  {
    name: 'askWolframAlpha',
    description: 'Queries the Wolfram Alpha computational knowledge engine for mathematical computations, formula information, step-by-step solutions, or plot data. Use for specific, well-defined mathematical or factual questions.',
    inputSchema: WolframAlphaQueryInputSchema,
    outputSchema: WolframAlphaQueryOutputSchema,
  },
  async (input: WolframAlphaQueryInput): Promise<WolframAlphaQueryOutput> => {
    const apiKey = process.env.WOLFRAM_ALPHA_APPID;

    if (!apiKey) {
      const errorMessage = `Wolfram Alpha tool called with query: "${input.query}". ` +
        `However, the WOLFRAM_ALPHA_APPID environment variable is not set. The tool cannot function without it.`;
      console.warn(errorMessage);
      // Inform the calling LLM that the tool is configured incorrectly.
      return `[Tool Execution Error: The Wolfram Alpha API key (WOLFRAM_ALPHA_APPID) is not configured in the environment. Please ask the user to configure it.]`;
    }

    // Using the Short Answers API, which is designed to return a single line of text.
    try {
      const encodedQuery = encodeURIComponent(input.query);
      const response = await fetch(`https://api.wolframalpha.com/v1/result?appid=${apiKey}&i=${encodedQuery}`);

      if (!response.ok) {
        const errorText = await response.text();
        // Handle specific Wolfram Alpha non-understanding cases gracefully.
        if (response.status === 501 && errorText.includes("did not understand")) {
            return `[Wolfram Alpha did not understand the query: "${input.query}"]`;
        }
        console.error(`Wolfram Alpha API error for query "${input.query}": ${response.status} ${response.statusText}`, errorText);
        return `[Error querying Wolfram Alpha for "${input.query}": ${response.statusText}. Details: ${errorText}]`;
      }

      const resultText = await response.text();
      return resultText;

    } catch (error: any) {
      console.error(`Error calling Wolfram Alpha API for query "${input.query}":`, error);
      return `[Exception while querying Wolfram Alpha for "${input.query}": ${error.message}]`;
    }
  }
);
