
'use server';
/**
 * @fileOverview An AI flow for a business coach chatbot.
 *
 * - chatWithBusinessCoach - A function that handles the AI chat interaction.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Calculation } from '@/components/dashboard/CalculationHistory';

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
      data: z.any().optional(),
    })
  ),
});

const ChatInputSchema = z.object({
  history: z.array(HistoryMessageSchema),
  message: z.string().optional(),
  imageUrl: z.string().optional(),
  calculation: z.any().optional(), // Using z.any() for the complex Calculation type
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

When the user provides an HPP calculation, analyze it thoroughly. Look at the material costs, labor, overhead, and profit margin. Provide specific, actionable insights. For example, suggest alternative materials, efficiency improvements, or pricing strategies. Reference the product name in your analysis. Your response should be in markdown format.

When a user provides an image, analyze it in the context of a product. Give feedback on photo quality, presentation, and marketability.

Always be encouraging and break down complex topics into easy-to-understand steps.

User's calculation data will be provided as a JSON object.
User's image will be provided via a media url.`;

const businessCoachFlow = ai.defineFlow(
  {
    name: 'businessCoachFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message, imageUrl, calculation } = input;

    const userContent: any[] = [];
    if (message) {
      userContent.push({ text: message });
    }
    if (imageUrl) {
      userContent.push({ media: { url: imageUrl } });
    }
    if (calculation) {
        const calcText = `
Here is my HPP calculation data for analysis:
Product Name: ${calculation.productName}
Total HPP: ${calculation.totalHPP}
Suggested Price: ${calculation.suggestedPrice}
Margin: ${calculation.margin}%
---
Full Data:
${"```json"}
${JSON.stringify(calculation, null, 2)}
${"```"}
`;
      userContent.push({ text: calcText });
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      history: history.map(h => ({
          role: h.role,
          content: h.content.map(c => {
            if (c.data?.type === 'calculation') {
                return { text: `Here is my HPP calculation data for analysis: ${"```json"}\n${JSON.stringify(c.data, null, 2)}\n${"```"}` };
            }
            return c;
          })
      })),
      prompt: {
        role: 'user',
        content: userContent
      }
    });

    return output.text;
  }
);
