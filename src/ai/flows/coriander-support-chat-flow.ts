'use server';
/**
 * @fileOverview A chatbot flow to answer questions about coriander cultivation.
 *
 * - corianderSupportChat - A function that handles user queries about coriander.
 * - CorianderSupportChatInput - The input type for the corianderSupportChat function.
 * - CorianderSupportChatOutput - The return type for the corianderSupportChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorianderSupportChatInputSchema = z.object({
  userQuery: z.string().describe("The user's question about coriander cultivation."),
});
export type CorianderSupportChatInput = z.infer<typeof CorianderSupportChatInputSchema>;

const CorianderSupportChatOutputSchema = z.object({
  botResponse: z.string().describe("The AI assistant's answer to the user's query."),
});
export type CorianderSupportChatOutput = z.infer<typeof CorianderSupportChatOutputSchema>;

export async function corianderSupportChat(
  input: CorianderSupportChatInput
): Promise<CorianderSupportChatOutput> {
  return corianderSupportChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'corianderSupportChatPrompt',
  input: {schema: CorianderSupportChatInputSchema},
  output: {schema: CorianderSupportChatOutputSchema},
  prompt: `You are an expert AI assistant specializing in coriander (also known as Dhania or Cilantro) cultivation and care.
Your goal is to provide helpful, accurate, and concise answers to the user's questions about growing coriander.
Focus only on coriander. If the question is not about coriander, politely state that you can only answer questions about coriander.

User's question: {{userQuery}}

Provide your answer:`,
  // Example safety settings (adjust as needed)
  // config: {
  //   safetySettings: [
  //     {
  //       category: 'HARM_CATEGORY_HARASSMENT',
  //       threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  //     },
  //   ],
  // },
});

const corianderSupportChatFlow = ai.defineFlow(
  {
    name: 'corianderSupportChatFlow',
    inputSchema: CorianderSupportChatInputSchema,
    outputSchema: CorianderSupportChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || typeof output.botResponse !== 'string' || output.botResponse.trim() === "") {
      // Fallback response if AI doesn't generate a valid or empty response
      return { botResponse: "I'm sorry, I couldn't process that request at the moment. Could you try rephrasing or asking again later?" };
    }
    return output;
  }
);
