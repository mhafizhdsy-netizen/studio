
'use server';
/**
 * @fileOverview An AI flow for a business coach chatbot.
 *
 * - chatWithBusinessCoach - A function that handles the AI chat interaction.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(
    z.object({
      text: z.string().optional(),
      media: z
        .object({
          url: z.string(),
          contentType: z.string().optional(),
        })
        .optional(),
      data: z.any().optional(), // Can contain calculation data
    })
  ),
});

const ChatInputSchema = z.object({
  history: z.array(HistoryMessageSchema),
});

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

When a user provides an image, analyze it in the context of a product. Give feedback on photo quality, presentation, and marketability.

Always be encouraging and break down complex topics into easy-to-understand steps.

User's calculation data will be provided as a JSON object inside a message part. You should format it for analysis.
User's image will be provided via a media url.`;


const businessCoachFlow = ai.defineFlow(
  {
    name: 'businessCoachFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history } = input;
    
    // The history from the client now includes the latest user message
    // and is already in the correct format.
    
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      history: history as any,
    });

    return output.text;
  }
);
