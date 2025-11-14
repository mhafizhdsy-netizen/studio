/**
 * @fileOverview Schemas and types for the image moderation flow.
 */

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
