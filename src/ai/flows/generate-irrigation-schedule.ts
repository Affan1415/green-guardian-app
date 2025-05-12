'use server';
/**
 * @fileOverview Generates a 7-day irrigation schedule based on sensor data and weather trends.
 *
 * - generateIrrigationSchedule - A function that generates the irrigation schedule.
 * - GenerateIrrigationScheduleInput - The input type for the generateIrrigationSchedule function.
 * - GenerateIrrigationScheduleOutput - The return type for the generateIrrigationSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIrrigationScheduleInputSchema = z.object({
  averageDailyMoistureDrop: z
    .number()
    .describe('The average daily percentage drop in soil moisture.'),
  averageTemperature: z.number().describe('The average temperature in Celsius.'),
  averageHumidity: z.number().describe('The average humidity percentage.'),
  crop: z.string().describe('The type of crop being grown.'),
  rainyDays: z.array(z.number()).describe('The days on which rain is expected (1-7).'),
});
export type GenerateIrrigationScheduleInput = z.infer<
  typeof GenerateIrrigationScheduleInputSchema
>;

const GenerateIrrigationScheduleOutputSchema = z.object({
  schedule: z.string().describe('A 7-day irrigation schedule including day, time, and amount.'),
});
export type GenerateIrrigationScheduleOutput = z.infer<
  typeof GenerateIrrigationScheduleOutputSchema
>;

export async function generateIrrigationSchedule(
  input: GenerateIrrigationScheduleInput
): Promise<GenerateIrrigationScheduleOutput> {
  return generateIrrigationScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIrrigationSchedulePrompt',
  input: {schema: GenerateIrrigationScheduleInputSchema},
  output: {schema: GenerateIrrigationScheduleOutputSchema},
  prompt: `Based on the following data, generate a 7-day irrigation schedule including:\n\nDay\nTime (HH:MM)\nAmount (in ml)\n\nAverage soil moisture drop: {{averageDailyMoistureDrop}}% per day. Avg temperature: {{averageTemperature}}°C. Humidity: {{averageHumidity}}%. Crop: {{crop}}. Rainy days: {{rainyDays}}\n`,
});

const generateIrrigationScheduleFlow = ai.defineFlow(
  {
    name: 'generateIrrigationScheduleFlow',
    inputSchema: GenerateIrrigationScheduleInputSchema,
    outputSchema: GenerateIrrigationScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
