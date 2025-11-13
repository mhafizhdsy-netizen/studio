
/**
 * @fileOverview Schemas and types for the consultant AI flow.
 */

import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const ConsultantInputSchema = z.object({
  prompt: z.string().describe('The user\'s latest message or question.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
});
export type ConsultantInput = z.infer<typeof ConsultantInputSchema>;

export const ConsultantOutputSchema = z.string().describe('The AI\'s response text.');
export type ConsultantOutput = z.infer<typeof ConsultantOutputSchema>;
