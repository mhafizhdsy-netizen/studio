
'use server';
/**
 * @fileOverview An AI flow for a business coach chatbot.
 *
 * - chatWithBusinessCoach - A function that handles the AI chat interaction.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type MessagePart } from '@/components/messages/AIChatView';

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
  message: z.string().optional(),
  imageUrl: z.string().optional(),
  calculation: z.any().optional(), // Can be a plain object
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

User's calculation data will be provided as a JSON object.
User's image will be provided via a media url.`;

const formatCalculationToText = (calculation: any) => {
    return `
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
}

const businessCoachFlow = ai.defineFlow(
  {
    name: 'businessCoachFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message, imageUrl, calculation } = input;

    // Construct the current user message
    const userMessageContent: MessagePart[] = [];
    if (message) {
      userMessageContent.push({ text: message });
    }
    if (imageUrl) {
      userMessageContent.push({ media: { url: imageUrl } });
    }
    if (calculation) {
      userMessageContent.push({ text: formatCalculationToText(calculation) });
    }

    // Process the history to format any calculation data within it
    const processedHistory = history.map(msg => {
      const newContent: MessagePart[] = [];
      msg.content.forEach(part => {
        if (part.data?.type === 'calculation' && part.data) {
          newContent.push({ text: formatCalculationToText(part.data) });
        } else {
          // Pass through other valid parts like text and media
          const validPart: MessagePart = {};
          if (part.text) validPart.text = part.text;
          if (part.media) validPart.media = part.media;
          if (Object.keys(validPart).length > 0) {
              newContent.push(validPart);
          }
        }
      });

      return {
        role: msg.role,
        content: newContent,
      };
    });
    
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      history: processedHistory,
      prompt: {
        role: 'user',
        content: userMessageContent
      }
    });

    return output.text;
  }
);
