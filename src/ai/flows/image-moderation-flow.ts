
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
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
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
          reason: `Gambar ditolak karena mengandung unsur: ${reason}.`,
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

      // 3. If not blocked and no "unsafe" flag, we can consider it safe.
      // This handles cases where the AI might not return a structured output but the image is fine.
      return { isSafe: true };

    } catch (error) {
      console.error('Image moderation flow error:', error);
      // If the moderation flow itself fails for any reason, default to flagging as unsafe.
      return {
        isSafe: false,
        reason: 'Gagal menganalisis gambar. Silakan coba gambar lain.',
      };
    }
  }
);
