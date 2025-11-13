
'use server';
/**
 * @fileOverview An AI flow for generating product descriptions.
 *
 * - generateDescription - A function that handles product description generation.
 */

import { ai } from '@/ai/genkit';
import {
  ProductDescriptionInputSchema,
  ProductDescriptionOutputSchema,
  type ProductDescriptionInput,
  type ProductDescriptionOutput,
} from './product-description-schemas';

export async function generateDescription(
  input: ProductDescriptionInput
): Promise<ProductDescriptionOutput> {
  return productDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: { schema: ProductDescriptionInputSchema },
  output: { schema: ProductDescriptionOutputSchema },
  prompt: `You are a creative copywriter for Indonesian online businesses, specializing in writing compelling product descriptions for a Gen Z audience. Your tone is trendy, persuasive, and uses popular slang (e.g., 'spill', 'checkout', 'racun', 'outfit', 'dijamin', 'auto').

The user wants a product description for "{{productName}}".

Your task is to generate a JSON object with three description variations:
- "instagram": A description for an Instagram post. Include engaging questions, relevant hashtags (3-5), and a strong call-to-action.
- "tiktok": A short, punchy script for a TikTok video (max 15 seconds). Focus on visual cues and a trending sound suggestion.
- "marketplace": A structured and informative description for a marketplace like Shopee or Tokopedia. Use bullet points for key features and specifications.

IMPORTANT: Respond ONLY with the valid JSON object. Do not include any other text or markdown formatting.`,
});

const productDescriptionFlow = ai.defineFlow(
  {
    name: 'productDescriptionFlow',
    inputSchema: ProductDescriptionInputSchema,
    outputSchema: ProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get description from AI');
    }
    return output;
  }
);
