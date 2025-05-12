"use client";
import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSensorHistory, database } from '@/config/firebase'; // Using mocked Firebase
import type { SensorData, ActuatorScheduleEntry, FullActuatorSchedule, ActuatorState } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, CalendarClock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  generateActuatorSchedule,
  GenerateActuatorScheduleInput,
  GenerateActuatorScheduleOutput
} from '@/ai/flows/generate-actuator-schedule';

const CROP_TYPES = ['Tomato', 'Lettuce', 'Strawberry', 'Bell Pepper', 'Cucumber', 'Wheat', 'Corn'];
const ACTUATOR_KEYS: (keyof Omit<ActuatorScheduleEntry, 'time'>)[] = ['fan', 'pump', 'lid', 'bulb'];
const ACTUATOR_STATES: ActuatorState[] = ['ON', 'OFF', 'Idle'];

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


export default function ScheduleGeneratorPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [cropType, setCropType] = useState<string>(CROP_TYPES[0]);
  const [weatherForecastSummary, setWeatherForecastSummary] = useState<string>(MOCK_WEATHER_FORECAST_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actuatorSchedule, setActuatorSchedule] = useState<FullActuatorSchedule | null>(null);

  const preprocessSensorData = (history: Partial<SensorData>[]): Omit<GenerateActuatorScheduleInput, 'cropType' | 'weatherForecastSummary'> => {
    if (history.length === 0) {
      return { averageSoilMoistureDrop: 10, averageTemperature: 25, averageHumidity: 60 }; // Defaults
    }

    const avgTemp = history.reduce((sum, data) => sum + (data.temperature || 25), 0) / history.length;
    const avgHumidity = history.reduce((sum, data) => sum + (data.humidity || 60), 0) / history.length;
    
    let totalMoistureDrop = 0;
    for (let i = 1; i < history.length; i++) {
      const drop = (history[i-1].soilMoisture || 50) - (history[i].soilMoisture || 50);
      totalMoistureDrop += Math.max(0, drop);
    }
    const avgDailyMoistureDrop = history.length > 1 ? totalMoistureDrop / (history.length -1) : 10;

    return {
      averageSoilMoistureDrop: parseFloat(avgDailyMoistureDrop.toFixed(1)) || 10,
      averageTemperature: parseFloat(avgTemp.toFixed(1)) || 25,
      averageHumidity: parseFloat(avgHumidity.toFixed(1)) || 60,
    };
  };

  const handleGenerateSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActuatorSchedule(null);

    try {
      const sensorHistory = await getSensorHistory(7);
      const processedSensorData = preprocessSensorData(sensorHistory);
      
      const input: GenerateActuatorScheduleInput = {
        ...processedSensorData,
        cropType,
        weatherForecastSummary,
      };
      
      console.log("AI Input for Actuator Schedule:", input);
      toast({ title: "Generating Actuator Schedule...", description: `Crop: ${cropType}. Weather: ${weatherForecastSummary.substring(0,50)}...` });

      const result: GenerateActuatorScheduleOutput = await generateActuatorSchedule(input);
      
      if (result.schedule && result.schedule.length > 0) {
        // Ensure schedule has 96 entries for a full day
        if (result.schedule.length === 96) {
            setActuatorSchedule(result.schedule);
            toast({ title: "Actuator Schedule Generated Successfully!", variant: "default" });
        } else {
            console.warn(`AI returned ${result.schedule.length} entries, expected 96. Using fallback.`);
            setActuatorSchedule(FALLBACK_SCHEDULE); // Or a padded version of result.schedule
            toast({ title: "Partial Schedule Generated", description: "AI returned an incomplete schedule. Displaying fallback. You may need to adjust it.", variant: "default" });
        }
      } else {
        throw new Error("AI returned an empty or invalid schedule.");
      }

    } catch (err: any) {
      console.error("Error generating actuator schedule:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: err.message || 'Could not generate schedule. Using fallback.' });
      setActuatorSchedule(FALLBACK_SCHEDULE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleEdit = (rowIndex: number, actuatorKey: keyof Omit<ActuatorScheduleEntry, 'time'>, value: ActuatorState) => {
    setActuatorSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = [...prevSchedule];
      newSchedule[rowIndex] = { ...newSchedule[rowIndex], [actuatorKey]: value };
      return newSchedule;
    });
  };

  const handleSaveSchedule = async () => {
    if (!actuatorSchedule || !currentUser?.uid) {
      toast({ variant: "destructive", title: "Cannot Save", description: "No schedule to save or user not logged in." });
      return;
    }
    setIsSaving(true);
    try {
      await database.set(database.ref(`schedules/${currentUser.uid}/today`), actuatorSchedule);
      toast({ title: "Schedule Saved!", description: "Today's actuator schedule has been saved successfully." });
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save the schedule." });
    } finally {
      setIsSaving(false);
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
            Generate a 24-hour actuator control plan for today based on crop type, sensor trends, and weather forecasts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateSchedule} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="cropType">
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map(crop => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weatherForecast">7-Day Weather Forecast Summary</Label>
              <Textarea
                id="weatherForecast"
                value={weatherForecastSummary}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setWeatherForecastSummary(e.target.value)}
                placeholder="Enter 7-day weather forecast summary..."
                rows={5}
                className="bg-input/30"
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide a summary including temperature, humidity, and rain expectations for the next 7 days.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                'Generate 24-Hour Schedule'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {actuatorSchedule && (
        <Card className="mt-8 bg-secondary/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Generated 24-Hour Actuator Schedule</CardTitle>
            <CardDescription>Review and edit the schedule below. Values are ON, OFF, or Idle.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border bg-background">
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
                  {actuatorSchedule.map((entry, rowIndex) => (
                    <TableRow key={entry.time}>
                      <TableCell className="font-medium">{entry.time}</TableCell>
                      {ACTUATOR_KEYS.map(actuatorKey => (
                        <TableCell key={actuatorKey}>
                          <Select
                            value={entry[actuatorKey]}
                            onValueChange={(value: ActuatorState) => handleScheduleEdit(rowIndex, actuatorKey, value)}
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
          </CardContent>
          <CardFooter className="flex-col items-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <p className="text-xs text-muted-foreground">
              Note: This schedule is a suggestion. Adjust based on real-world observations.
            </p>
            <Button onClick={handleSaveSchedule} disabled={isSaving || !currentUser} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Today&apos;s Schedule
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
