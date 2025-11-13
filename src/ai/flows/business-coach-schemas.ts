
/**
 * @fileOverview Schemas and types for the business coach flow.
 */
import { z } from 'zod';

// Defines a single message in the chat history, which is now just text.
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Defines the overall input for the flow, which is the chat history
export const ChatInputSchema = z.object({
  history: z.array(HistoryMessageSchema),
});

// Defines the output, which is just the AI's text response
export const ChatOutputSchema = z.string();

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
