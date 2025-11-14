
'use server';
/**
 * @fileOverview An AI flow for moderating uploaded images.
 *
 * - moderateImage - A function that checks if an image is safe.
 */

import { ai } from '@/ai/genkit';
import {
  ImageModerationInputSchema,
  ImageModerationOutputSchema,
  type ImageModerationInput,
  type ImageModerationOutput,
} from './image-moderation-schemas';

export async function moderateImage(
  input: ImageModerationInput
): Promise<ImageModerationOutput> {
  return imageModerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageModerationPrompt',
  input: { schema: ImageModerationInputSchema },
  output: { schema: ImageModerationOutputSchema },
  prompt: `Analyze the following image. Determine if it is safe for a general audience website. The website's policy prohibits sexually explicit content, hate speech, harassment, and dangerous content.

If the image is NOT safe, set "isSafe" to false and provide a brief, user-friendly reason (in Bahasa Indonesia) why it was rejected (e.g., "Gambar mengandung konten tidak pantas.").
If the image is safe, set "isSafe" to true.

Image: {{media url=imageDataUri}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const imageModerationFlow = ai.defineFlow(
  {
    name: 'imageModerationFlow',
    inputSchema: ImageModerationInputSchema,
    outputSchema: ImageModerationOutputSchema,
  },
  async (input) => {
    try {
      const response = await prompt(input);

      // 1. Check if the content was blocked by Google's safety filters.
      if (response.blocked) {
        const reason = response.safetyFeedback
          ?.map(fb => fb.rating.category.replace('HARM_CATEGORY_', ''))
          .join(', ');
          
        return {
          isSafe: false,
          reason: `Gambar ditolak karena mengandung unsur: ${reason || 'Tidak Pantas'}.`,
        };
      }
      
      const output = response.output;

      // 2. Check if the AI returned a specific "unsafe" flag in the structured output.
      if (output?.isSafe === false) {
        return {
          isSafe: false,
          reason:
            output.reason || 'Gambar mengandung konten yang tidak pantas.',
        };
      }

      // 3. If not blocked and no "unsafe" flag from the LLM, consider it safe.
      return { isSafe: true };

    } catch (error) {
      console.error('Image moderation flow error:', error);
      // This catch block will now mostly handle network errors or other unexpected issues.
      return {
        isSafe: false,
        reason: 'Gagal menganalisis gambar karena masalah teknis. Silakan coba gambar lain.',
      };
    }
  }
);
