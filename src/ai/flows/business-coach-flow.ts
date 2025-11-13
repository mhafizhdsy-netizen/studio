
'use server';
/**
 * @fileOverview An AI flow for a business coach chatbot.
 *
 * - chatWithBusinessCoach - A function that handles the AI chat interaction.
 */
import { ai } from '@/ai/genkit';
import { type ChatInput, ChatInputSchema, ChatOutputSchema } from './business-coach-schemas';
import type { ChatOutput } from './business-coach-schemas';


export async function chatWithBusinessCoach(
  input: ChatInput
): Promise<ChatOutput> {
  return businessCoachFlow(input);
}

const systemPrompt = `You are "Teman Bisnis AI", a friendly, encouraging, and expert business consultant for young Indonesian entrepreneurs. Your tone is a mix of professional, supportive, and modern slang (bahasa gaul).

Your primary goal is to help users develop their business skills by providing actionable business advice based on the text conversation.

Always be encouraging and break down complex topics into easy-to-understand steps.`;


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

    if (!output || !output.text) {
        throw new Error("Failed to get a response from the AI.");
    }
    
    return output.text;
  }
);
