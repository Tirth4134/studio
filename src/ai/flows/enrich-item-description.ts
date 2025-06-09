'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating item descriptions based on item name, category, and price.
 *
 * - generateItemDescription - A function that takes item details as input and returns an enriched item description.
 * - GenerateItemDescriptionInput - The input type for the generateItemDescription function.
 * - GenerateItemDescriptionOutput - The return type for the generateItemDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItemDescriptionInputSchema = z.object({
  category: z.string().describe('The category of the item (e.g., Mobile, Laptop).'),
  itemName: z.string().describe('The name of the item (e.g., iPhone 15, MacBook Pro).'),
  price: z.number().describe('The price of the item.'),
});

export type GenerateItemDescriptionInput = z.infer<typeof GenerateItemDescriptionInputSchema>;

const GenerateItemDescriptionOutputSchema = z.object({
  description: z.string().describe('An enriched description of the item, incorporating details and relevant attributes.'),
});

export type GenerateItemDescriptionOutput = z.infer<typeof GenerateItemDescriptionOutputSchema>;

export async function generateItemDescription(input: GenerateItemDescriptionInput): Promise<GenerateItemDescriptionOutput> {
  return generateItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItemDescriptionPrompt',
  input: {schema: GenerateItemDescriptionInputSchema},
  output: {schema: GenerateItemDescriptionOutputSchema},
  prompt: `You are an expert product description writer for an electronic shop.
  Given the item's category, name, and price, generate a detailed and engaging description.
  Incorporate relevant details, specifications, and attractive attributes to entice customers.

  Category: {{{category}}}
  Item Name: {{{itemName}}}
  Price: {{{price}}}

  Description:`,
});

const generateItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateItemDescriptionFlow',
    inputSchema: GenerateItemDescriptionInputSchema,
    outputSchema: GenerateItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
