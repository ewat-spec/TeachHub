'use server';
/**
 * @fileOverview A Genkit tool for performing Monte Carlo simulations safely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { compile, EvalFunction } from 'mathjs';

const MonteCarloIntegrationInputSchema = z.object({
  functionBody: z.string().describe('The body of the mathematical expression to integrate, e.g., "x*x", "sin(x)". Uses mathjs syntax.'),
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

export const runMonteCarloIntegration = ai.defineTool(
  {
    name: 'runMonteCarloIntegration',
    description: 'Estimates the definite integral of a single-variable function using a Monte Carlo simulation. Use this for problems asking to find the area under a curve when an analytical solution is difficult or when a numerical estimation is requested.',
    inputSchema: MonteCarloIntegrationInputSchema,
    outputSchema: MonteCarloIntegrationOutputSchema,
  },
  async (input: MonteCarloIntegrationInput): Promise<MonteCarloIntegrationOutput> => {
    const { functionBody, xMin, xMax, simulations } = input;

    let fn: EvalFunction;
    try {
        fn = compile(functionBody);
    } catch (error: any) {
        throw new Error(`Invalid function body provided: "${functionBody}". Error: ${error.message}`);
    }

    let yMax = -Infinity;
    const samplePoints = 1000;
    for (let i = 0; i < samplePoints; i++) {
        const x = xMin + (xMax - xMin) * (i / (samplePoints - 1));
        const y = fn.evaluate({x: x});
        if (isFinite(y) && y > yMax) {
            yMax = y;
        }
    }

    if (!isFinite(yMax)) {
        const testVal = fn.evaluate({x: xMin});
        if (!isFinite(testVal)) throw new Error(`Function returned non-finite value at x=${xMin}. Cannot determine bounds.`);
        yMax = testVal;
    }
     yMax = Math.max(yMax, 0) * 1.1;

    let pointsUnderCurve = 0;
    const xRange = xMax - xMin;

    for (let i = 0; i < simulations; i++) {
        const randomX = xMin + Math.random() * xRange;
        const randomY = Math.random() * yMax;
        const functionY = fn.evaluate({x: randomX});
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
