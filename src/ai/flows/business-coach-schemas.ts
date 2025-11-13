
/**
 * @fileOverview Schemas and types for the business coach flow.
 */
import { z } from 'zod';

// Defines the schema for a single part of a message (text, image, or structured data)
const MessagePartSchema = z.object({
  text: z.string().optional(),
  media: z
    .object({
      url: z.string().describe("A data URI of an image (e.g., data:image/jpeg;base64,...)."),
      contentType: z.string().optional(),
    })
    .optional(),
  data: z.any().optional(), // Can contain structured data like a calculation
});

// Defines a single message in the chat history
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(MessagePartSchema),
});

// Defines the overall input for the flow, which is the chat history
export const ChatInputSchema = z.object({
  history: z.array(HistoryMessageSchema),
});

// Defines the output, which is just the AI's text response
export const ChatOutputSchema = z.string();

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
