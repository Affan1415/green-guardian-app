
"use client";

import React, { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSensorHistory } from '@/config/firebase';
import type { FirebaseRootData, HistoricalDataPoint } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bug, ShieldAlert, Leaf, Info, Thermometer, Droplets, CircleHelpIcon, BookOpenCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  predictPestDisease,
  type PredictPestDiseaseInput,
  type PredictPestDiseaseOutput,
} from '@/ai/flows/predict-pest-disease-flow';
// Explicitly type PDPSchema for clarity, though it's inferred from PredictPestDiseaseOutput
import type { PestDiseasePredictionDetailSchema as PDPSchemaType } from '@/ai/flows/predict-pest-disease-flow'; 
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'e5016b764c7140f792d214117251205'; 
const WEATHER_API_LOCATION = 'Lahore'; // Default location

async function fetchAndFormatWeather(apiKey: string, location: string, days: number = 7): Promise<string | null> {
  if (!apiKey) {
    console.warn("Weather API key not provided. Cannot fetch live weather.");
    return "Mock Weather: Sunny, 25-30°C, Humidity 50-60%, No rain expected for next 7 days."; 
  }
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=${days}&aqi=no&alerts=no`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`WeatherAPI request failed with status ${response.status}`, errorData);
      return `Error: WeatherAPI request failed. ${errorData?.error?.message || response.statusText}. Using mock data instead.`;
    }
    const data = await response.json();
    
    if (!data.forecast || !data.forecast.forecastday || data.forecast.forecastday.length === 0) {
      console.warn("WeatherAPI response did not contain valid forecast data.");
      return "Warning: WeatherAPI response invalid. Using mock data instead.";
    }

    let summary = "";
    data.forecast.forecastday.forEach((item: any, index: number) => {
      const dayLabel = index === 0 ? "Day 1 (Today)" : `Day ${index + 1}`;
      const dateObj = new Date(item.date + 'T00:00:00');
      summary += `${dayLabel} (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })}): ${item.day.condition.text}, Max Temp: ${item.day.maxtemp_c}°C, Min Temp: ${item.day.mintemp_c}°C, Avg Humidity: ${item.day.avghumidity}%, Chance of Rain: ${item.day.daily_chance_of_rain}%. \n`;
    });
    return summary.trim();
  } catch (error: any) {
    console.error("Error fetching or formatting weather data:", error);
    return `Error: Could not fetch weather. ${error.message}. Using mock data instead.`;
  }
}

const GROWTH_STAGES = ["Seedling", "Vegetative", "Mature", "Flowering/Bolting", "Not Specified"] as const;
type GrowthStageType = typeof GROWTH_STAGES[number];

const DEFAULT_RECENT_PEST_NOTES = "No specific observations noted.";
const DEFAULT_PLANT_GROWTH_STAGE: GrowthStageType = "Not Specified";
const DEFAULT_WEATHER_SUMMARY_FALLBACK = "Default weather summary due to error.";


export default function PestDiseaseOutlookPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [averageTemperatureC, setAverageTemperatureC] = useState<number>(25);
  const [averageHumidityPercent, setAverageHumidityPercent] = useState<number>(60);
  const [weatherForecastSummary, setWeatherForecastSummary] = useState<string>("");
  const [recentPestActivityNotes, setRecentPestActivityNotes] = useState<string>("");
  const [plantGrowthStage, setPlantGrowthStage] = useState<GrowthStageType>(DEFAULT_PLANT_GROWTH_STAGE);
  
  const [predictionOutput, setPredictionOutput] = useState<PredictPestDiseaseOutput | null>(null);

  const preprocessSensorData = (history: Partial<FirebaseRootData>[]) => {
    if (history.length === 0) {
      toast({ title: "No Sensor History", description: "Using default sensor averages for prediction (Temp: 25°C, Humidity: 60%). Generate data on dashboard first.", variant: "default" });
      return { avgTemp: 25, avgHumidity: 60 };
    }
    const avgTemp = history.reduce((sum, data) => sum + (data.V1 ?? 25), 0) / history.length;
    const avgHumidity = history.reduce((sum, data) => sum + (data.V2 ?? 60), 0) / history.length;
    return { 
      avgTemp: parseFloat(avgTemp.toFixed(1)) || 25, 
      avgHumidity: parseFloat(avgHumidity.toFixed(1)) || 60 
    };
  };

  useEffect(() => {
    const fetchInitial = async () => {
      setIsFetchingInitialData(true);
      setError(null);
      try {
        const sensorHistory: Partial<FirebaseRootData>[] = await getSensorHistory(7);
        const { avgTemp, avgHumidity } = preprocessSensorData(sensorHistory);
        setAverageTemperatureC(avgTemp);
        setAverageHumidityPercent(avgHumidity);

        const forecast = await fetchAndFormatWeather(WEATHER_API_KEY, WEATHER_API_LOCATION, 7);
        setWeatherForecastSummary(forecast || "Could not fetch weather. Using default summary.");

      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load initial sensor or weather data. Please try refreshing.");
        toast({ variant: "destructive", title: "Data Load Error", description: err.message });
        setWeatherForecastSummary(DEFAULT_WEATHER_SUMMARY_FALLBACK);
      } finally {
        setIsFetchingInitialData(false);
      }
    };
    fetchInitial();
  }, [toast]);

  const handleAnalyzeRisk = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPredictionOutput(null);

    try {
      const input: PredictPestDiseaseInput = {
        cropType: "Coriander", 
        averageTemperatureC,
        averageHumidityPercent,
        sevenDayWeatherForecastSummary: weatherForecastSummary,
        recentPestActivityNotes: recentPestActivityNotes || DEFAULT_RECENT_PEST_NOTES,
        plantGrowthStage: plantGrowthStage || DEFAULT_PLANT_GROWTH_STAGE,
      };
      
      toast({ title: "Analyzing Risks...", description: "Green Guardian AI is processing the data." });
      const result = await predictPestDisease(input);
      setPredictionOutput(result);
      toast({ title: "Analysis Complete!", description: "Pest and disease outlook generated." });

    } catch (err: any) {
      console.error("Error generating pest/disease prediction:", err);
      setError(err.message || "An unknown error occurred during analysis.");
      toast({ variant: "destructive", title: "Analysis Failed", description: err.message || "Could not generate prediction." });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeVariant = (riskLevel: PDPSchemaType['riskLevel']): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'Very High':
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary'; 
      case 'Low':
      case 'Negligible':
        return 'default'; 
      default:
        return 'outline';
    }
  };


  if (isFetchingInitialData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
          <p className="text-xl text-primary">Loading initial data...</p>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <Bug className="h-7 w-7" /> Coriander Pest & Disease Outlook
          </CardTitle>
          <CardDescription>
            Analyze potential pest and disease risks for your Coriander crop based on current conditions and forecasts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyzeRisk} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="avgTemp" className="flex items-center gap-1"><Thermometer size={16}/>Average Temperature (°C)</Label>
                <Input id="avgTemp" type="number" value={averageTemperatureC} onChange={(e) => setAverageTemperatureC(parseFloat(e.target.value))} className="bg-input/30" required step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgHumidity" className="flex items-center gap-1"><Droplets size={16}/>Average Humidity (%)</Label>
                <Input id="avgHumidity" type="number" value={averageHumidityPercent} onChange={(e) => setAverageHumidityPercent(parseFloat(e.target.value))} className="bg-input/30" required step="0.1" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plantGrowthStage">Plant Growth Stage</Label>
              <Select value={plantGrowthStage} onValueChange={(value: GrowthStageType) => setPlantGrowthStage(value)}>
                <SelectTrigger id="plantGrowthStage" className="bg-input/30">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {GROWTH_STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weatherForecastSummary">7-Day Weather Forecast Summary</Label>
              <Textarea id="weatherForecastSummary" value={weatherForecastSummary} onChange={(e) => setWeatherForecastSummary(e.target.value)} rows={5} className="bg-muted/50 text-sm" readOnly />
               <p className="text-xs text-muted-foreground">Weather data is automatically fetched. Displayed as read-only for context.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recentPestActivityNotes">Recent Pest/Disease Observations (Optional)</Label>
              <Textarea
                id="recentPestActivityNotes"
                value={recentPestActivityNotes}
                onChange={(e) => setRecentPestActivityNotes(e.target.value)}
                placeholder="e.g., Noticed yellow spots on lower leaves, some wilting on new seedlings..."
                rows={3}
                className="bg-input/30"
              />
            </div>
            
            {error && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetchingInitialData}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Analyze Pest & Disease Risk'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && !predictionOutput && (
        <div className="mt-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Green Guardian AI is thinking hard about your coriander...</p>
        </div>
      )}

      {predictionOutput && (
        <Card className="mt-8 bg-secondary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2"><Leaf className="h-6 w-6" /> AI Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {predictionOutput.criticalWarnings && predictionOutput.criticalWarnings.length > 0 && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-700 font-semibold">Critical Warnings!</AlertTitle>
                <AlertDescription className="text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {predictionOutput.criticalWarnings.map((warning, i) => <li key={i}>{warning}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="p-4 bg-muted/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Overall Outlook</h3>
              <p className="text-sm text-muted-foreground">{predictionOutput.overallOutlook}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" /> Basis of AI Prediction
              </h3>
              <p className="text-sm text-muted-foreground italic">
                {predictionOutput.predictionMethodologyExplanation}
              </p>
            </div>


            <Accordion type="multiple" className="w-full">
              {predictionOutput.predictions.map((pred, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b border-border/50">
                  <AccordionTrigger className="hover:bg-muted/30 px-2 py-3 rounded-md text-left">
                    <div className="flex items-center justify-between w-full">
                       <span className="font-medium text-foreground flex items-center gap-2">
                         {pred.pestOrDiseaseName} 
                         {pred.scientificName && <i className="text-xs text-muted-foreground">({pred.scientificName})</i>}
                       </span>
                       <Badge variant={getRiskBadgeVariant(pred.riskLevel as PDPSchemaType['riskLevel'])} className="ml-auto mr-2 capitalize text-xs px-2 py-0.5 h-5">
                         {pred.riskLevel} Risk
                       </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 px-2 space-y-3 bg-background/30 rounded-b-md">
                    <p className="text-sm text-muted-foreground"><strong>Description:</strong> {pred.description}</p>
                    
                    <div className="space-y-1">
                      <strong className="text-sm text-foreground">Common Symptoms:</strong>
                      <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-0.5">
                        {pred.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-sm text-foreground">Contributing Factors from Data:</strong>
                      <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-0.5">
                        {pred.contributingFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <strong className="text-sm text-foreground">Preventative Actions:</strong>
                       <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-0.5">
                        {pred.preventativeActions.map((action, i) => <li key={i}>{action}</li>)}
                      </ul>
                    </div>

                    {pred.organicTreatmentOptions && pred.organicTreatmentOptions.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-sm text-foreground">Organic Treatments:</strong>
                        <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-0.5">
                          {pred.organicTreatmentOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                        </ul>
                      </div>
                    )}

                    {pred.chemicalTreatmentOptions && pred.chemicalTreatmentOptions.length > 0 && (
                       <div className="space-y-1">
                        <strong className="text-sm text-foreground">Chemical Treatments:</strong>
                         <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-0.5">
                          {pred.chemicalTreatmentOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {predictionOutput.predictions.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No specific pest or disease risks were identified with high confidence based on the current data.</p>
            )}

          </CardContent>
          <CardFooter>
            <div className="w-full p-3 bg-muted/30 border border-dashed border-amber-600/50 rounded-md text-xs text-amber-700 flex items-start gap-2">
                <CircleHelpIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <span className="font-semibold">Disclaimer:</span> {predictionOutput.disclaimer}
                </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

