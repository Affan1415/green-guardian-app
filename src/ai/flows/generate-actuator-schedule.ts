'use server';
/**
 * @fileOverview Generates a 24-hour actuator control schedule.
 *
 * - generateActuatorSchedule - A function that generates the actuator schedule.
 * - GenerateActuatorScheduleInput - The input type for the generateActuatorSchedule function.
 * - GenerateActuatorScheduleOutput - The return type for the generateActuatorSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActuatorStateSchema = z.enum(['ON', 'OFF', 'Idle']);
const ActuatorScheduleEntrySchema = z.object({
  time: z.string().describe('Time of day in HH:MM format (24-hour).'),
  fan: ActuatorStateSchema.describe('Fan status.'),
  pump: ActuatorStateSchema.describe('Water pump status.'),
  lid: ActuatorStateSchema.describe('Lid motor status.'),
  bulb: ActuatorStateSchema.describe('Grow light/bulb status.'),
});

const GenerateActuatorScheduleInputSchema = z.object({
  cropType: z.string().describe('The type of crop being grown (e.g., Tomato, Wheat, Corn).'),
  averageTemperature: z.number().describe('The average temperature in Celsius over the past 7 days.'),
  averageHumidity: z.number().describe('The average humidity percentage over the past 7 days.'),
  averageSoilMoistureDrop: z.number().describe('The average daily percentage drop in soil moisture over the past 7 days.'),
  weatherForecastSummary: z.string().describe('A 7-day weather forecast summary, including temperature, humidity, and rain expectations (e.g., "Day 1: Sunny, 28C, 60% humidity. Day 2: Cloudy with light rain in afternoon, 25C, 70% humidity...").')
});
export type GenerateActuatorScheduleInput = z.infer<typeof GenerateActuatorScheduleInputSchema>;

const GenerateActuatorScheduleOutputSchema = z.object({
  schedule: z.array(ActuatorScheduleEntrySchema).describe('A 24-hour actuator control schedule in 15-minute intervals.')
});
export type GenerateActuatorScheduleOutput = z.infer<typeof GenerateActuatorScheduleOutputSchema>;

export async function generateActuatorSchedule(
  input: GenerateActuatorScheduleInput
): Promise<GenerateActuatorScheduleOutput> {
  return generateActuatorScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActuatorSchedulePrompt',
  input: {schema: GenerateActuatorScheduleInputSchema},
  output: {schema: GenerateActuatorScheduleOutputSchema},
  prompt: `You are an expert agricultural AI assistant. Based on the provided crop type, sensor data averages, and weather forecast, generate a detailed and sensible 24-hour actuator control schedule.
The schedule must be in 15-minute intervals for the specified crop. The output must be a JSON array of objects. Each object represents a 15-minute interval and must include a "time" field (HH:MM format, 24-hour) and fields for "fan", "pump", "lid", and "bulb".
The value for each actuator ("fan", "pump", "lid", "bulb") must be one of "ON", "OFF", or "Idle".

Key Considerations for a Sensible Schedule:
1. Resource Conservation: Actuators (especially water pump and grow light) should not be "ON" continuously for long periods unless critical for the crop's survival based on the data. Aim for efficiency.
2. Optimal Watering: The water pump ("pump") should operate in intervals or specific times aligned with the crop's needs, considering the average soil moisture drop and rain forecast. Continuous pumping is generally incorrect and wasteful.
3. Climate Control: Use the "fan" for temperature and humidity regulation. The "lid" can assist with ventilation and temperature control.
4. Lighting: The "bulb" (grow light) should supplement natural light or provide light during specific periods beneficial for the crop, not necessarily 24/7.
5. "Idle" State: Use "Idle" for actuators that are not actively ON or OFF but are in a standby or neutral state (e.g., a lid that is neither fully open nor fully closed, or a pump that is not running but ready).

Ensure the schedule covers a full 24-hour period, starting from 00:00 and ending at 23:45, with entries for every 15 minutes.

Crop Type: {{cropType}}
Average Temperature (last 7 days): {{averageTemperature}}°C
Average Humidity (last 7 days): {{averageHumidity}}%
Average Daily Soil Moisture Drop (last 7 days): {{averageSoilMoistureDrop}}%
7-Day Weather Forecast:
{{{weatherForecastSummary}}}

Generate the schedule now, paying close attention to creating a realistic and efficient plan. For example, the water pump should likely be OFF for most of the day, turning ON only for specific irrigation cycles.
  `,
  config: {
    // Loosen safety settings if needed, default should be fine for this task
    // safetySettings: [
    //   {
    //     category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    //     threshold: 'BLOCK_NONE',
    //   },
    // ],
  }
});

const generateActuatorScheduleFlow = ai.defineFlow(
  {
    name: 'generateActuatorScheduleFlow',
    inputSchema: GenerateActuatorScheduleInputSchema,
    outputSchema: GenerateActuatorScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.schedule || output.schedule.length === 0) {
      throw new Error("AI failed to generate a valid schedule.");
    }
    // Validate schedule length (96 entries for 24 hours * 4 intervals/hour)
    if (output.schedule.length !== 96) {
        console.warn(`AI generated schedule with ${output.schedule.length} entries, expected 96.`);
        // Potentially add logic here to pad or truncate, or throw an error
        // For now, we'll let it pass but log a warning.
    }
    return output;
  }
);

