'use server';
/**
 * @fileOverview Predicts pest and disease risks for Coriander based on environmental data and forecasts.
 *
 * - predictPestDisease - A function that analyzes inputs and returns potential risks and preventative actions.
 * - PredictPestDiseaseInput - The input type for the predictPestDisease function.
 * - PredictPestDiseaseOutput - The return type for the predictPestDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantGrowthStageSchema = z.enum([
  "Seedling", 
  "Vegetative", 
  "Mature", 
  "Flowering/Bolting", 
  "Not Specified"
]).describe("The current growth stage of the coriander plants.");

const PredictPestDiseaseInputSchema = z.object({
  cropType: z.string().default("Coriander").describe("The type of crop, fixed to Coriander for this flow."),
  averageTemperatureC: z.number().describe("The average current or recent temperature in Celsius."),
  averageHumidityPercent: z.number().describe("The average current or recent humidity percentage."),
  sevenDayWeatherForecastSummary: z.string().describe("A 7-day weather forecast summary, including temperature, humidity, and rain expectations."),
  recentPestActivityNotes: z.string().optional().default("No specific observations noted.").describe("Optional user notes on any observed pest activity or unusual plant symptoms recently."),
  plantGrowthStage: PlantGrowthStageSchema.optional().default("Not Specified"),
});
export type PredictPestDiseaseInput = z.infer<typeof PredictPestDiseaseInputSchema>;

const PestDiseasePredictionDetailSchema = z.object({
  pestOrDiseaseName: z.string().describe("Common name of the predicted pest or disease."),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Very High', 'Negligible']).describe("Assessed risk level for this pest/disease given the inputs."),
  scientificName: z.string().optional().describe("Scientific name of the pest or disease, if applicable."),
  description: z.string().describe("A brief description of the pest or disease and its impact on coriander."),
  symptoms: z.array(z.string()).describe("Common symptoms to look for on coriander plants."),
  contributingFactors: z.array(z.string()).describe("Factors from the provided data (temp, humidity, forecast) that contribute to this risk."),
  preventativeActions: z.array(z.string()).describe("Actionable preventative measures to mitigate the risk."),
  organicTreatmentOptions: z.array(z.string()).optional().describe("Suggested organic treatment options if the pest/disease occurs."),
  chemicalTreatmentOptions: z.array(z.string()).optional().describe("Suggested chemical treatment options, if applicable. Include a note about careful use."),
});

const PredictPestDiseaseOutputSchema = z.object({
  predictions: z.array(PestDiseasePredictionDetailSchema).describe("An array of predictions for common coriander pests and diseases."),
  overallOutlook: z.string().describe("A general summary of the pest and disease outlook for coriander based on the analysis."),
  criticalWarnings: z.array(z.string()).optional().describe("Any critical, high-risk warnings that require immediate attention."),
  predictionMethodologyExplanation: z.string().describe("A general explanation of how the AI arrives at its predictions, focusing on the types of knowledge (botanical, environmental impact on pests/diseases, agricultural practices) it synthesizes, rather than specific cited sources."),
  disclaimer: z.string().default("This is an AI-generated prediction and should be used as a guide. Always consult with local agricultural experts or conduct thorough research for definitive diagnosis and treatment plans. Follow all product label instructions for any treatments applied."),
});
export type PredictPestDiseaseOutput = z.infer<typeof PredictPestDiseaseOutputSchema>;

export async function predictPestDisease(
  input: PredictPestDiseaseInput
): Promise<PredictPestDiseaseOutput> {
  // Ensure cropType is always Coriander for this specific flow
  const validatedInput = { ...input, cropType: "Coriander" };
  return predictPestDiseaseFlow(validatedInput);
}

const prompt = ai.definePrompt({
  name: 'predictPestDiseasePrompt',
  input: {schema: PredictPestDiseaseInputSchema},
  output: {schema: PredictPestDiseaseOutputSchema},
  prompt: `You are an expert plant pathologist and entomologist specializing in Coriander (Coriandrum sativum), also known as Dhania or Cilantro.
Your task is to analyze the provided environmental data, weather forecast, plant growth stage, and any user observations to predict potential pest and disease risks for Coriander.
Provide a detailed and actionable assessment.

Crop: {{cropType}}
Average Temperature: {{averageTemperatureC}}°C
Average Humidity: {{averageHumidityPercent}}%
Plant Growth Stage: {{plantGrowthStage}}
User's Recent Observations: {{{recentPestActivityNotes}}}
7-Day Weather Forecast:
{{{sevenDayWeatherForecastSummary}}}

Based on this information, generate a JSON output according to the defined schema.
Key considerations:
- Identify 2-4 common Coriander pests and diseases relevant to the provided conditions. Examples include: Aphids, Powdery Mildew, Damping Off (especially if 'Seedling' stage), Bacterial Leaf Spot, Fusarium Wilt, Root Rot.
- For each identified pest/disease:
    - Assess the riskLevel (Negligible, Low, Medium, High, Very High) based on how the input data (temperature, humidity, forecast, stage) aligns with conditions favorable for it.
    - Provide a brief description of the pest/disease.
    - List common symptoms observable on Coriander.
    - Detail the contributingFactors from the input data that elevate or decrease its risk.
    - Suggest specific, actionable preventativeActions.
    - If applicable, list organicTreatmentOptions.
    - If applicable, list chemicalTreatmentOptions and include a standard caution about following label instructions and safety.
- Generate a concise overallOutlook summarizing the findings.
- If any risks are 'High' or 'Very High', list them as criticalWarnings.
- Populate the 'predictionMethodologyExplanation' field: Provide a brief paragraph. Start by stating that this analysis is derived from a broad understanding of plant science, including botany and horticulture. Then, explain that the predictions consider how common coriander pests and diseases typically respond to various environmental conditions (such as temperature, humidity, weather patterns like rain) and how the plant's growth stage can influence its susceptibility. Conclude by mentioning that the advice also incorporates general agricultural best practices for coriander cultivation. It's important to clarify this is a synthesis of information, not a real-time search of specific documents or research papers.
- Always include the standard disclaimer.

Focus on providing practical advice. For example, if high humidity is a factor, suggest improving air circulation as a preventative action.
If the weather forecast indicates upcoming rain and high humidity, this might increase fungal disease risk.
If the plant stage is 'Seedling' and conditions are damp, 'Damping Off' risk is higher.
If 'No specific observations noted' by user, rely solely on environmental data.
Ensure the scientificName is accurate if provided.
If conditions are generally unfavorable for most common pests/diseases, reflect this in 'Negligible' or 'Low' risk levels and a positive overallOutlook.
`,
  config: {
    temperature: 0.4, // Slightly lower temperature for more deterministic diagnostic-style output
    // safetySettings: [ // Example safety settings
    //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' } // Might be needed if discussing pesticides
    // ]
  }
});

const predictPestDiseaseFlow = ai.defineFlow(
  {
    name: 'predictPestDiseaseFlow',
    inputSchema: PredictPestDiseaseInputSchema,
    outputSchema: PredictPestDiseaseOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a pest and disease prediction.");
    }
    // Ensure predictions array is present, even if empty
    if (!output.predictions) {
        output.predictions = [];
    }
    // Ensure disclaimer is present
    if (!output.disclaimer) {
        output.disclaimer = "This is an AI-generated prediction and should be used as a guide. Always consult with local agricultural experts or conduct thorough research for definitive diagnosis and treatment plans. Follow all product label instructions for any treatments applied.";
    }
    // Ensure predictionMethodologyExplanation is present, provide a fallback if necessary
     if (!output.predictionMethodologyExplanation) {
        output.predictionMethodologyExplanation = "The AI prediction is based on a synthesis of general botanical knowledge, typical pest/disease responses to environmental factors, and common agricultural best practices. It does not involve real-time searching of specific research papers.";
    }
    return output;
  }
);

