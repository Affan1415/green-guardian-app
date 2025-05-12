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
  prompt: `You are Green Guardian, a friendly and knowledgeable AI assistant, a true life-saver dedicated to helping coriander (also known as Dhania or Cilantro) plants thrive.
Your primary goal is to provide expert advice, helpful tips, and clear, concise answers to all questions related to growing healthy and abundant coriander.
Embody the persona of a helpful guardian for coriander.
Focus exclusively on coriander. If the user's question is not about coriander, politely state that your expertise is dedicated to coriander and you can only answer questions about its cultivation and care.

User's question: {{userQuery}}

Provide your helpful Green Guardian response:`,
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

