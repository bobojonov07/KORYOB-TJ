'use server';
/**
 * @fileOverview A Genkit flow for generating friendly greetings or positive messages.
 *
 * - generateGreetingMessage - A function that handles the greeting message generation process.
 * - GenerateGreetingMessageInput - The input type for the generateGreetingMessage function.
 * - GenerateGreetingMessageOutput - The return type for the generateGreetingMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGreetingMessageInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'A short prompt to guide the greeting or positive message generation.'
    ),
});
export type GenerateGreetingMessageInput = z.infer<
  typeof GenerateGreetingMessageInputSchema
>;

const GenerateGreetingMessageOutputSchema = z.object({
  message: z.string().describe('The generated friendly greeting or positive message.'),
});
export type GenerateGreetingMessageOutput = z.infer<
  typeof GenerateGreetingMessageOutputSchema
>;

export async function generateGreetingMessage(
  input: GenerateGreetingMessageInput
): Promise<GenerateGreetingMessageOutput> {
  return generateGreetingMessageFlow(input);
}

const generateGreetingMessagePrompt = ai.definePrompt({
  name: 'generateGreetingMessagePrompt',
  input: {schema: GenerateGreetingMessageInputSchema},
  output: {schema: GenerateGreetingMessageOutputSchema},
  prompt: `Generate a friendly greeting or a positive, uplifting message based on the following context:

Context: {{{prompt}}}`,
});

const generateGreetingMessageFlow = ai.defineFlow(
  {
    name: 'generateGreetingMessageFlow',
    inputSchema: GenerateGreetingMessageInputSchema,
    outputSchema: GenerateGreetingMessageOutputSchema,
  },
  async input => {
    const {output} = await generateGreetingMessagePrompt(input);
    return output!;
  }
);
