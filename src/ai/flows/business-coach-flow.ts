
'use server';
/**
 * @fileOverview An AI flow for a business coach chatbot.
 *
 * - chatWithBusinessCoach - A function that handles the AI chat interaction.
 */
import { ai } from '@/ai/genkit';
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
const ChatOutputSchema = z.string();

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithBusinessCoach(
  input: ChatInput
): Promise<ChatOutput> {
  return businessCoachFlow(input);
}

const systemPrompt = `You are "Teman Bisnis AI", a friendly, encouraging, and expert business consultant for young Indonesian entrepreneurs. Your tone is a mix of professional, supportive, and modern slang (bahasa gaul).

Your primary goal is to help users develop their business skills. You can analyze their HPP (Harga Pokok Produksi) calculations, give feedback on their product photos, and provide actionable business advice.

When the user provides an HPP calculation, analyze it thoroughly. Look at the material costs, labor, overhead, and profit margin. Provide specific, actionable insights. Reference the product name in your analysis. Your response should be in markdown format.

When a user provides an image (via a data URI), analyze it in the context of a product photo. Give feedback on photo quality, presentation, and marketability.

Always be encouraging and break down complex topics into easy-to-understand steps.

User's calculation data will be provided as a JSON object inside a 'data' part of a message. You should format it for analysis.
User's image will be provided via a 'media' part with a data URI.`;


const businessCoachFlow = ai.defineFlow(
  {
    name: 'businessCoachFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // The history from the client is already in the correct format.
    // We just pass it directly to the AI.
    const { history } = input;
    
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      history: history as any, // Cast to any to match Genkit's expected history type
    });

    return output.text;
  }
);
