
/**
 * @fileOverview Schemas and types for the profit analysis flow.
 *
 * - ProfitAnalysisInputSchema - The Zod schema for the input.
 * - ProfitAnalysisInput - The TypeScript type for the input.
 * - ProfitAnalysisOutputSchema - The Zod schema for the output.
 * - ProfitAnalysisOutput - The TypeScript type for the output.
 */

import { z } from 'zod';

const MaterialSchema = z.object({
  name: z.string(),
  cost: z.number(),
  qty: z.number(),
});

export const ProfitAnalysisInputSchema = z.object({
  productName: z.string(),
  materials: z.array(MaterialSchema),
  laborCost: z.number(),
  overhead: z.number(),
  packaging: z.number(),
  currentMargin: z.number(),
  targetMargin: z.number(),
  totalHPP: z.number(),
  productQuantity: z.number(),
});
export type ProfitAnalysisInput = z.infer<typeof ProfitAnalysisInputSchema>;

export const ProfitAnalysisOutputSchema = z.object({
  insights: z.object({
    summary: z
      .string()
      .describe(
        'A brief, encouraging summary of the feasibility of reaching the target margin and the overall strategy.'
      ),
    materialSuggestions: z
      .array(z.string())
      .describe(
        'Actionable suggestions to reduce material costs. e.g., "Coba cari supplier kain katun alternatif yang lebih murah" or "Beli benang dalam jumlah besar untuk diskon."'
      ),
    efficiencySuggestions: z
      .array(z.string())
      .describe(
        'Actionable suggestions for efficiency gains to lower labor or overhead costs. e.g., "Optimalkan proses jahit untuk mengurangi waktu kerja per kaos."'
      ),
    pricingStrategy: z
      .string()
      .describe(
        'A recommendation on adjusting the final selling price to help meet the margin goal, considering the other suggestions.'
      ),
  }),
});
export type ProfitAnalysisOutput = z.infer<typeof ProfitAnalysisOutputSchema>;
