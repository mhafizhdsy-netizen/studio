
/**
 * @fileOverview Schemas and types for the product description generation flow.
 */

import { z } from 'zod';

export const ProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});
export type ProductDescriptionInput = z.infer<
  typeof ProductDescriptionInputSchema
>;

export const ProductDescriptionOutputSchema = z.object({
  instagram: z
    .string()
    .describe(
      'A product description suitable for an Instagram post, including hashtags.'
    ),
  tiktok: z
    .string()
    .describe(
      'A short, punchy script for a TikTok video, including a sound suggestion.'
    ),
  marketplace: z
    .string()
    .describe(
      'A structured and informative description for a marketplace listing (e.g., Shopee, Tokopedia).'
    ),
});
export type ProductDescriptionOutput = z.infer<
  typeof ProductDescriptionOutputSchema
>;
