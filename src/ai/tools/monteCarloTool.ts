
'use server';
/**
 * @fileOverview A Genkit tool for performing Monte Carlo simulations.
 *
 * - runMonteCarloIntegration - A tool to estimate the definite integral (area under a curve) of a function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MonteCarloIntegrationInputSchema = z.object({
  functionBody: z.string().describe('The body of the JavaScript function to integrate, e.g., "x*x", "Math.sin(x)". The function will be evaluated as `new Function(\'x\', \'return \' + functionBody)`.'),
  xMin: z.number().describe('The lower bound of the integration range (e.g., 0).'),
  xMax: z.number().describe('The upper bound of the integration range (e.g., 1).'),
  simulations: z.number().min(1000).max(1000000).optional().default(100000).describe('The number of simulation points to use. Defaults to 100,000.'),
});
type MonteCarloIntegrationInput = z.infer<typeof MonteCarloIntegrationInputSchema>;

const MonteCarloIntegrationOutputSchema = z.object({
    estimatedArea: z.number().describe('The estimated area under the curve.'),
    pointsTotal: z.number().describe('The total number of points used in the simulation.'),
    pointsUnderCurve: z.number().describe('The number of random points that fell under the function\'s curve.'),
});
type MonteCarloIntegrationOutput = z.infer<typeof MonteCarloIntegrationOutputSchema>;


/**
 * A Genkit tool to estimate the area under a curve (definite integral) using a Monte Carlo simulation.
 */
export const runMonteCarloIntegration = ai.defineTool(
  {
    name: 'runMonteCarloIntegration',
    description: 'Estimates the definite integral of a single-variable function using a Monte Carlo simulation. Use this for problems asking to find the area under a curve when an analytical solution is difficult or when a numerical estimation is requested.',
    inputSchema: MonteCarloIntegrationInputSchema,
    outputSchema: MonteCarloIntegrationOutputSchema,
  },
  async (input: MonteCarloIntegrationInput): Promise<MonteCarloIntegrationOutput> => {
    const { functionBody, xMin, xMax, simulations } = input;

    let fn: (x: number) => number;
    try {
        // Create a function from the string body. This is safer than direct eval().
        fn = new Function('x', `return ${functionBody}`) as (x: number) => number;
    } catch (error: any) {
        throw new Error(`Invalid function body provided: "${functionBody}". Error: ${error.message}`);
    }

    // To set the bounding box, we need to find the approximate max value of the function in the range.
    // We can do this by sampling some points.
    let yMax = -Infinity;
    const samplePoints = 1000;
    for (let i = 0; i < samplePoints; i++) {
        const x = xMin + (xMax - xMin) * (i / (samplePoints - 1));
        const y = fn(x);
        if (isFinite(y) && y > yMax) {
            yMax = y;
        }
    }

    // If the function is constant and negative, yMax might still be -Infinity. Let's handle this.
    // Also, add a small buffer.
    if (!isFinite(yMax)) {
        const testVal = fn(xMin);
        if (!isFinite(testVal)) throw new Error(`Function returned non-finite value at x=${xMin}. Cannot determine bounds.`);
        yMax = testVal;
    }
     yMax = Math.max(yMax, 0) * 1.1; // Ensure yMax is at least 0 and add a 10% buffer.


    let pointsUnderCurve = 0;
    const xRange = xMax - xMin;

    for (let i = 0; i < simulations; i++) {
        const randomX = xMin + Math.random() * xRange;
        const randomY = Math.random() * yMax;
        
        const functionY = fn(randomX);

        if (randomY < functionY) {
            pointsUnderCurve++;
        }
    }
    
    const boundingBoxArea = xRange * yMax;
    const estimatedArea = (pointsUnderCurve / simulations) * boundingBoxArea;

    return {
        estimatedArea,
        pointsTotal: simulations,
        pointsUnderCurve,
    };
  }
);
