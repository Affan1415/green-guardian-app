
"use client";
import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSensorHistory, database } from '@/config/firebase'; 
import type { HistoricalDataPoint, ActuatorScheduleEntry, FullActuatorSchedule, ActuatorState } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, CalendarClock, Edit3, Download, CloudSun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateActuatorSchedule,
  type GenerateActuatorScheduleInput,
  type GenerateActuatorScheduleOutput
} from '@/ai/flows/generate-actuator-schedule';

const FIXED_CROP_TYPE = 'Coriander';
const ACTUATOR_KEYS: (keyof Omit<ActuatorScheduleEntry, 'time'>)[] = ['fan', 'pump', 'lid', 'bulb'];
const ACTUATOR_STATES: ActuatorState[] = ['ON', 'OFF', 'Idle'];

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'e5016b764c7140f792d214117251205';
const WEATHER_API_LOCATION = 'Lahore'; // Default location, can be made dynamic

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
};

const FALLBACK_SCHEDULE: FullActuatorSchedule = generateTimeSlots().map(time => ({
  time,
  fan: 'OFF',
  pump: 'OFF',
  lid: 'Idle',
  bulb: 'OFF',
}));

const MOCK_WEATHER_FORECAST_SUMMARY = `Day 1 (Today): Sunny, Max Temp: 28°C, Min Temp: 18°C, Humidity: 60%, Chance of Rain: 10%.
Day 2: Partly cloudy, Max Temp: 27°C, Min Temp: 17°C, Humidity: 65%, Chance of Rain: 20%.
Day 3: Cloudy with light rain in afternoon, Max Temp: 25°C, Min Temp: 16°C, Humidity: 75%, Chance of Rain: 60%.
Day 4: Sunny, Max Temp: 29°C, Min Temp: 19°C, Humidity: 55%, Chance of Rain: 5%.
Day 5: Scattered showers, Max Temp: 26°C, Min Temp: 17°C, Humidity: 70%, Chance of Rain: 40%.
Day 6: Mostly sunny, Max Temp: 30°C, Min Temp: 20°C, Humidity: 50%, Chance of Rain: 10%.
Day 7: Cloudy, Max Temp: 27°C, Min Temp: 18°C, Humidity: 68%, Chance of Rain: 30%.`;

interface WeatherApiForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avghumidity: number;
    condition: {
      text: string;
    };
    daily_chance_of_rain: number;
  };
}

interface WeatherApiResponse {
  forecast: {
    forecastday: WeatherApiForecastDay[];
  };
}

async function fetchAndFormatWeather(apiKey: string, location: string, days: number = 7): Promise<string | null> {
  if (!apiKey || apiKey === 'your_weather_api_key_here') { // Check for placeholder or missing key
    console.warn("Weather API key not provided or is a placeholder. Using mock data.");
    return null; 
  }
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=${days}&aqi=no&alerts=no`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`WeatherAPI request failed with status ${response.status}`, errorData);
      throw new Error(`WeatherAPI request failed: ${errorData?.error?.message || response.statusText}. Using mock data instead.`);
    }
    const data: WeatherApiResponse = await response.json();
    
    if (!data.forecast || !data.forecast.forecastday || data.forecast.forecastday.length === 0) {
      console.warn("WeatherAPI response did not contain valid forecast data. Using mock data instead.");
      return null;
    }

    let summary = "";
    data.forecast.forecastday.forEach((item, index) => {
      const dayLabel = index === 0 ? "Day 1 (Today)" : `Day ${index + 1}`;
      const dateObj = new Date(item.date + 'T00:00:00'); // Ensure date is parsed correctly
      summary += `${dayLabel} (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })}): ${item.day.condition.text}, Max Temp: ${item.day.maxtemp_c}°C, Min Temp: ${item.day.mintemp_c}°C, Avg Humidity: ${item.day.avghumidity}%, Chance of Rain: ${item.day.daily_chance_of_rain}%. \n`;
    });
    return summary.trim();
  } catch (error: any) {
    let logMessage = "Error fetching or formatting weather data:";
    if (error.message && error.message.toLowerCase().includes("failed to fetch")) {
        logMessage += " This might be due to a CORS issue (if running locally), an invalid API key, a network problem, or the WeatherAPI service being temporarily unavailable. Please check the browser's Network tab for more details.";
    }
    console.error(logMessage, error);
    return null; // Caller will use mock data
  }
}


export default function ScheduleGeneratorPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [weatherForecastSummary, setWeatherForecastSummary] = useState<string>(MOCK_WEATHER_FORECAST_SUMMARY);
  const [isWeatherLive, setIsWeatherLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [scheduleDurationDays, setScheduleDurationDays] = useState<number>(1);
  const [activeUiDayIndex, setActiveUiDayIndex] = useState<number>(0); // 0-indexed
  const [actuatorSchedules, setActuatorSchedules] = useState<(FullActuatorSchedule | null)[]>([]);

  useEffect(() => {
    setActuatorSchedules(Array(scheduleDurationDays).fill(null));
    setActiveUiDayIndex(0);
  }, [scheduleDurationDays]);


  const preprocessSensorData = (history: HistoricalDataPoint[]): Omit<GenerateActuatorScheduleInput, 'cropType' | 'weatherForecastSummary'> => {
    if (history.length === 0) {
      toast({
        title: "No Sensor History",
        description: "Using default sensor averages (Temp: 25°C, Humidity: 60%, Moisture Drop: 10%). Generate data on dashboard first.",
        variant: "default"
      });
      return { averageSoilMoistureDrop: 10, averageTemperature: 25, averageHumidity: 60 };
    }

    const avgTemp = history.reduce((sum, data) => sum + (data.V1 ?? 25), 0) / history.length;
    const avgHumidity = history.reduce((sum, data) => sum + (data.V2 ?? 60), 0) / history.length;
    
    let totalMoistureDrop = 0;
    let validMoistureReadings = 0;
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const prevMoisture = history[i-1].V3;
        const currentMoisture = history[i].V3;
        if (typeof prevMoisture === 'number' && typeof currentMoisture === 'number') {
          const drop = prevMoisture - currentMoisture;
          totalMoistureDrop += Math.max(0, drop); // Consider only drops, not increases
          validMoistureReadings++;
        }
      }
    }
    // Calculate average daily drop based on the number of valid drop calculations (days -1 or intervals with data)
    // This is a simplification. A more robust way would be to calculate daily averages first.
    const avgDailyMoistureDrop = validMoistureReadings > 0 ? totalMoistureDrop / validMoistureReadings : 10;


    return {
      averageSoilMoistureDrop: parseFloat(avgDailyMoistureDrop.toFixed(1)) || 10,
      averageTemperature: parseFloat(avgTemp.toFixed(1)) || 25,
      averageHumidity: parseFloat(avgHumidity.toFixed(1)) || 60,
    };
  };

  const handleGenerateSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (scheduleDurationDays < 1) {
        toast({ variant: "destructive", title: "Invalid Duration", description: "Number of days must be at least 1." });
        return;
    }
    setIsLoading(true); // Covers both weather fetching and AI generation
    const newInitialSchedules: (FullActuatorSchedule | null)[] = Array(scheduleDurationDays).fill(null);
    setActuatorSchedules(newInitialSchedules);
    setActiveUiDayIndex(0);

    let currentForecastSummary = MOCK_WEATHER_FORECAST_SUMMARY;
    setIsWeatherLive(false); // Assume mock initially

    setIsFetchingWeather(true);
    toast({ title: "Fetching Weather Data...", description: `Attempting to get forecast for ${WEATHER_API_LOCATION}.` });
    try {
      const fetchedWeather = await fetchAndFormatWeather(WEATHER_API_KEY, WEATHER_API_LOCATION, 7);
      if (fetchedWeather) {
        currentForecastSummary = fetchedWeather;
        setWeatherForecastSummary(fetchedWeather); // Update state for UI
        setIsWeatherLive(true);
        toast({ title: "Weather Data Fetched!", description: `Using live forecast for ${WEATHER_API_LOCATION}.` });
      } else {
        setWeatherForecastSummary(MOCK_WEATHER_FORECAST_SUMMARY); // Ensure UI shows mock if fetch failed
        setIsWeatherLive(false);
        toast({ variant: "default", title: "Weather Fetch Failed/Invalid", description: "Using mock weather forecast data. Check API key or network." });
      }
    } catch (weatherError: any) {
        console.error("Weather fetch error during generation process:", weatherError);
        setWeatherForecastSummary(MOCK_WEATHER_FORECAST_SUMMARY);
        setIsWeatherLive(false);
        toast({ variant: "destructive", title: "Weather API Error", description: weatherError.message || "Could not fetch live weather data. Using mock data." });
    } finally {
        setIsFetchingWeather(false);
    }

    try {
      const sensorHistory: HistoricalDataPoint[] = await getSensorHistory(7); 
      const processedSensorData = preprocessSensorData(sensorHistory);
      
      const input: GenerateActuatorScheduleInput = {
        ...processedSensorData,
        cropType: FIXED_CROP_TYPE,
        weatherForecastSummary: currentForecastSummary, // Use the determined forecast
      };
      
      console.log("AI Input for Actuator Schedule (Day 1):", input);
      toast({ title: "Generating Actuator Schedule for Day 1...", description: `Crop: ${FIXED_CROP_TYPE}. Weather context provided (${isWeatherLive ? 'Live' : 'Mock'}).` });

      const result: GenerateActuatorScheduleOutput = await generateActuatorSchedule(input);
      
      const generatedDayOneSchedule = (result.schedule && result.schedule.length === 96) ? result.schedule : [...FALLBACK_SCHEDULE.map(entry => ({...entry}))]; 

      const updatedSchedules = [...newInitialSchedules];
      updatedSchedules[0] = generatedDayOneSchedule;

      for (let i = 1; i < scheduleDurationDays; i++) {
        updatedSchedules[i] = [...generatedDayOneSchedule.map(entry => ({...entry}))]; 
      }
      setActuatorSchedules(updatedSchedules);
      toast({ title: "Actuator Schedules Initialized!", variant: "default", description: `Day 1 based on AI, subsequent ${scheduleDurationDays > 1 ? scheduleDurationDays -1 : ''} days copied. Review each day.` });

    } catch (err: any) {
      console.error("Error generating actuator schedule:", err);
      // Ensure schedules are initialized with fallbacks even if AI fails
      const errorSchedules = Array(scheduleDurationDays).fill(null).map(() => [...FALLBACK_SCHEDULE.map(entry => ({...entry}))] );
      setActuatorSchedules(errorSchedules);
      toast({ variant: "destructive", title: "AI Generation Failed", description: err.message || `Could not generate schedule. Using fallback for all ${scheduleDurationDays} days.` });
    } finally {
      setIsLoading(false); // Overall loading false
    }
  };

  const handleScheduleEdit = (dayIndex: number, rowIndex: number, actuatorKey: keyof Omit<ActuatorScheduleEntry, 'time'>, value: ActuatorState) => {
    setActuatorSchedules(prevSchedules => {
      if (!prevSchedules[dayIndex]) return prevSchedules;
      const newSchedules = [...prevSchedules];
      const dayScheduleToEdit = [...(newSchedules[dayIndex] as FullActuatorSchedule)]; 
      dayScheduleToEdit[rowIndex] = { ...dayScheduleToEdit[rowIndex], [actuatorKey]: value };
      newSchedules[dayIndex] = dayScheduleToEdit;
      return newSchedules;
    });
  };

  const handleSaveSchedule = async () => {
    if (!currentUser?.uid || !actuatorSchedules[activeUiDayIndex]) {
      toast({ variant: "destructive", title: "Cannot Save", description: `No schedule to save for Day ${activeUiDayIndex + 1} or user not logged in.` });
      return;
    }
    setIsSaving(true);
    try {
      const scheduleToSave = actuatorSchedules[activeUiDayIndex];
      const dayNumber = activeUiDayIndex + 1;
      await database.set(database.ref(`schedules/${currentUser.uid}/day-${dayNumber}`), scheduleToSave);
      toast({ title: `Schedule for Day ${dayNumber} Saved!`, description: `Actuator schedule for Day ${dayNumber} has been saved to the database.` });
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message || `Could not save the schedule for Day ${activeUiDayIndex + 1}.` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!currentUser || !actuatorSchedules[activeUiDayIndex]) {
      toast({ variant: "destructive", title: "Cannot Download", description: `No schedule data for Day ${activeUiDayIndex + 1} or user not logged in.` });
      return;
    }

    const schedule = actuatorSchedules[activeUiDayIndex] as FullActuatorSchedule;
    if (!schedule || schedule.length === 0) {
      toast({ variant: "destructive", title: "Empty Schedule", description: `Schedule for Day ${activeUiDayIndex + 1} is empty.` });
      return;
    }

    const headers = "Time,Fan,Pump,Lid,Bulb";
    const csvRows = schedule.map(entry =>
      [entry.time, entry.fan, entry.pump, entry.lid, entry.bulb].join(',')
    );
    const csvString = `${headers}\n${csvRows.join("\n")}`;

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (typeof window !== "undefined") { // Ensure window context for URL.createObjectURL
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `green_guardian_schedule_day_${activeUiDayIndex + 1}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: `CSV Downloaded`, description: `Schedule for Day ${activeUiDayIndex + 1} has been downloaded.` });
    } else {
        toast({ variant: "destructive", title: "Download Error", description: "Cannot initiate download outside browser."})
    }
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <CalendarClock className="h-7 w-7" /> Actuator Schedule Generator
          </CardTitle>
          <CardDescription>
            Generate a 24-hour actuator control plan for {FIXED_CROP_TYPE}, adaptable for multiple days, based on sensor trends and weather forecasts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateSchedule} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type</Label>
                <Input id="cropType" value={FIXED_CROP_TYPE} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleDurationDays">Number of Days for Schedule Plan</Label>
                <Input
                  id="scheduleDurationDays"
                  type="number"
                  value={scheduleDurationDays}
                  onChange={(e) => setScheduleDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  max="7" 
                  className="bg-input/30"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weatherForecast" className="flex items-center gap-2">
                 <CloudSun className="h-5 w-5 text-primary" /> 7-Day Weather Forecast Summary (Context for AI)
              </Label>
              <Textarea
                id="weatherForecast"
                value={weatherForecastSummary}
                readOnly
                placeholder="Weather forecast will be displayed here after fetching..."
                rows={7}
                className="bg-muted/50 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {isFetchingWeather && !isLoading ? "Fetching live weather..." : `Displayed forecast is ${isWeatherLive ? `live for ${WEATHER_API_LOCATION}` : 'mock data'}.`}
                 Ensure NEXT_PUBLIC_WEATHER_API_KEY is set in .env for live data.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetchingWeather}>
              {isLoading || isFetchingWeather ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFetchingWeather && !isLoading ? 'Fetching Weather...' : 'Generating Plan...'}
                </>
              ) : (
                `Generate ${scheduleDurationDays}-Day Plan Base`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {actuatorSchedules.some(s => s !== null) && (
        <Card className="mt-8 bg-secondary/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2"><Edit3 className="h-6 w-6" /> Edit Actuator Schedules</CardTitle>
            <CardDescription>Review and edit the schedule for each day. Values are ON, OFF, or Idle.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={String(activeUiDayIndex)} onValueChange={(val) => setActiveUiDayIndex(Number(val))} className="w-full">
              <TabsList className="grid w-full md:flex md:flex-wrap" style={{gridTemplateColumns: `repeat(${Math.min(scheduleDurationDays, 7)}, minmax(0, 1fr))`}}>
                {Array.from({ length: scheduleDurationDays }, (_, i) => (
                  <TabsTrigger key={`day-tab-${i}`} value={String(i)} className="flex-1 min-w-[80px]">Day {i + 1}</TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: scheduleDurationDays }, (_, i) => (
                <TabsContent key={`day-content-${i}`} value={String(i)}>
                  {actuatorSchedules[i] ? (
                    <ScrollArea className="h-[500px] w-full rounded-md border bg-background mt-4">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted z-10">
                          <TableRow>
                            <TableHead className="w-[100px]">Time</TableHead>
                            {ACTUATOR_KEYS.map(key => (
                              <TableHead key={key} className="capitalize w-[120px]">{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(actuatorSchedules[i] as FullActuatorSchedule).map((entry, rowIndex) => (
                            <TableRow key={`${entry.time}-day-${i}`}>
                              <TableCell className="font-medium">{entry.time}</TableCell>
                              {ACTUATOR_KEYS.map(actuatorKey => (
                                <TableCell key={`${actuatorKey}-day-${i}-${entry.time}`}>
                                  <Select
                                    value={entry[actuatorKey]}
                                    onValueChange={(value: ActuatorState) => handleScheduleEdit(i, rowIndex, actuatorKey, value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ACTUATOR_STATES.map(state => (
                                        <SelectItem key={state} value={state} className="text-xs">{state}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="mt-4 p-4 text-center text-muted-foreground">Schedule for Day {i + 1} has not been generated or is empty. Please click "Generate Plan Base".</div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex-col items-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-4">
            <p className="text-xs text-muted-foreground">
              Note: AI generates Day 1. Other days are initially copies. Adjust based on real-world observations and specific daily forecasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleDownloadCsv} 
                disabled={!currentUser || !actuatorSchedules[activeUiDayIndex]} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV (Day {activeUiDayIndex + 1})
              </Button>
              <Button 
                onClick={handleSaveSchedule} 
                disabled={isSaving || !currentUser || !actuatorSchedules[activeUiDayIndex]} 
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Day {activeUiDayIndex + 1}...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to DB (Day {activeUiDayIndex + 1})
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

