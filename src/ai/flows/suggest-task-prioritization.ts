'use server';
/**
 * @fileOverview Provides intelligent suggestions for prioritizing tasks based on due date and estimated effort.
 *
 * - suggestTaskPrioritization - A function that generates task prioritization suggestions.
 * - SuggestTaskPrioritizationInput - The input type for the suggestTaskPrioritization function.
 * - SuggestTaskPrioritizationOutput - The return type for the suggestTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPrioritizationInputSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe('The title of the task.'),
      description: z.string().optional().describe('A description of the task.'),
      dueDate: z.string().optional().describe('The due date of the task in ISO format.'),
      estimatedEffort: z
        .string()
        .optional()
        .describe('The estimated effort to complete the task (e.g., low, medium, high).'),
    })
  ).describe('A list of tasks to prioritize.'),
});
export type SuggestTaskPrioritizationInput = z.infer<typeof SuggestTaskPrioritizationInputSchema>;

const SuggestTaskPrioritizationOutputSchema = z.object({
  prioritizationSuggestions: z.array(
    z.object({
      taskId: z.number().describe('The index of the task in the input array.'),
      reason: z.string().describe('The reason for the task prioritization suggestion.'),
    })
  ).describe('A list of prioritization suggestions for the tasks.'),
});
export type SuggestTaskPrioritizationOutput = z.infer<typeof SuggestTaskPrioritizationOutputSchema>;

export async function suggestTaskPrioritization(
  input: SuggestTaskPrioritizationInput
): Promise<SuggestTaskPrioritizationOutput> {
  return suggestTaskPrioritizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPrioritizationPrompt',
  input: {schema: SuggestTaskPrioritizationInputSchema},
  output: {schema: SuggestTaskPrioritizationOutputSchema},
  prompt: `You are an AI assistant designed to provide intelligent suggestions for prioritizing a list of tasks.  Consider the due date and estimated effort of each task.  Provide a prioritization suggestion for each task including the index in the array of tasks that was provided and a short reason why that task should be prioritized. Return a JSON array.

Tasks:
{{#each tasks}}
Task Index: {{@index}}
Title: {{this.title}}
Description: {{this.description}}
Due Date: {{this.dueDate}}
Estimated Effort: {{this.estimatedEffort}}
{{/each}}`,
});

const suggestTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'suggestTaskPrioritizationFlow',
    inputSchema: SuggestTaskPrioritizationInputSchema,
    outputSchema: SuggestTaskPrioritizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
