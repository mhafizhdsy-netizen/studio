
'use server';

/**
 * @fileOverview An AI flow for a business consultant chatbot.
 */

import { ai } from '@/ai/genkit';
import {
  type ConsultantInput,
  type ConsultantOutput,
} from './consultant-schemas';

export async function consultAI(
  input: ConsultantInput
): Promise<ConsultantOutput> {
  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: input.prompt,
    history: input.history,
    system: `You are an expert business consultant for Indonesian entrepreneurs, named "Konsultan AI". Your tone is encouraging, smart, and friendly, using a mix of formal Indonesian and modern slang (bahasa gaul anak muda). You are creative, provide actionable advice, and always try to be helpful.

    Your main tasks are:
    1.  Answer user questions about business, marketing, operations, and finance.
    2.  Provide creative ideas for products, branding, and promotions.
    3.  Give practical, step-by-step advice.
    4.  Never refuse to answer a question, even if it's outside of business topics, but always try to gently steer the conversation back to business.
    5.  Keep your answers concise and easy to understand. Use lists, bullet points, and bold text to format your answers for better readability.
    6.  Always respond in Bahasa Indonesia.`,
  });

  return llmResponse.text;
}
