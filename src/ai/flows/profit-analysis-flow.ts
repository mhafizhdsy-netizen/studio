
'use server';
/**
 * @fileOverview An AI flow for analyzing profit margins and providing suggestions.
 *
 * - analyzeProfitMargin - A function that handles the profit margin analysis.
 */

import { ai } from '@/ai/genkit';
import {
  ProfitAnalysisInputSchema,
  ProfitAnalysisOutputSchema,
  type ProfitAnalysisInput,
  type ProfitAnalysisOutput,
} from './profit-analysis-schemas';

export async function analyzeProfitMargin(
  input: ProfitAnalysisInput
): Promise<ProfitAnalysisOutput> {
  return profitAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitAnalysisPrompt',
  input: { schema: ProfitAnalysisInputSchema },
  output: { schema: ProfitAnalysisOutputSchema },
  prompt: `You are an expert business consultant for Indonesian entrepreneurs. Your tone is encouraging, smart, and friendly, using a mix of formal Indonesian and modern slang (bahasa gaul anak muda).

A user wants to analyze their product, "{{productName}}", to reach a target profit margin of {{targetMargin}}%. Their current margin is {{currentMargin}}%.

Here is their current cost breakdown (HPP is {{totalHPP}}):
- Materials: {{#each materials}}- {{name}}: {{cost}} (qty: {{qty}}){{/each}}
- Labor Cost: {{laborCost}}
- Overhead: {{overhead}}
- Packaging: {{packaging}}

Your task is to provide actionable advice. The goal is to bridge the gap between {{currentMargin}}% and {{targetMargin}}%.

Generate a JSON object with the following structure:
- "insights.summary": Berikan ringkasan singkat dan memotivasi.
- "insights.marketPriceBenchmark": Based on the product name and materials, provide a realistic market price benchmark range for a similar product in Indonesian Rupiah (e.g., "Rp 95.000 - Rp 120.000").
- "insights.materialSuggestions": Berikan 2-3 saran konkret untuk mengurangi biaya bahan baku. Jadilah spesifik.
- "insights.efficiencySuggestions": Berikan 1-2 saran untuk efisiensi produksi (tenaga kerja, overhead).
- "insights.pricingStrategy": Berikan saran tentang penyesuaian harga jual, dengan mempertimbangkan saran-saran lainnya.

IMPORTANT: Respond ONLY with the valid JSON object. Do not include any other text or markdown formatting.`,
});

const profitAnalysisFlow = ai.defineFlow(
  {
    name: 'profitAnalysisFlow',
    inputSchema: ProfitAnalysisInputSchema,
    outputSchema: ProfitAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get analysis from AI');
    }
    return output;
  }
);
