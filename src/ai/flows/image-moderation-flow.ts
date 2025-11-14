
'use server';
/**
 * @fileOverview An AI flow for moderating uploaded images.
 *
 * - moderateImage - A function that checks if an image is safe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ImageModerationInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be moderated, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageModerationInput = z.infer<typeof ImageModerationInputSchema>;

export const ImageModerationOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe('Whether the image is considered safe for a general audience.'),
  reason: z
    .string()
    .optional()
    .describe('The reason why the image was flagged as not safe.'),
});
export type ImageModerationOutput = z.infer<
  typeof ImageModerationOutputSchema
>;

export async function moderateImage(
  input: ImageModerationInput
): Promise<ImageModerationOutput> {
  return imageModerationFlow(input);
}

const prompt = ai.definePrompt(
  {
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
  }
);

const imageModerationFlow = ai.defineFlow(
  {
    name: 'imageModerationFlow',
    inputSchema: ImageModerationInputSchema,
    outputSchema: ImageModerationOutputSchema,
  },
  async (input) => {
    try {
        const { candidates, safetyFeedback } = await prompt.run(input);

        // Check if the model's response was blocked by Google's safety filters
        if (!candidates?.length && safetyFeedback) {
            const blockedReasons = safetyFeedback
                .filter(fb => fb.rating.severity === 'HIGH')
                .map(fb => fb.rating.category)
                .join(', ');
            
            return {
                isSafe: false,
                reason: `Gambar ditolak karena melanggar kebijakan konten: ${blockedReasons}.`,
            };
        }

        const output = candidates[0].output;

        if (!output) {
          throw new Error('Failed to get a valid response from the AI model.');
        }

        // Check the structured response from our prompt
        if (output.isSafe === false) {
          return {
            isSafe: false,
            reason: output.reason || 'Gambar mengandung konten yang tidak pantas.',
          };
        }

        return { isSafe: true };
    } catch (error) {
        console.error("Image moderation flow error:", error);
        // If the moderation flow itself fails, we default to flagging as unsafe to be cautious.
        return {
            isSafe: false,
            reason: "Gagal menganalisis gambar. Silakan coba gambar lain."
        };
    }
  }
);
