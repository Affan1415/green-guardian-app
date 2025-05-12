
"use client";
import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSensorHistory, database } from '@/config/firebase'; 
import type { FirebaseRootData, ActuatorScheduleEntry, FullActuatorSchedule, ActuatorState } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, CalendarClock, Edit3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateActuatorSchedule,
  GenerateActuatorScheduleInput,
  GenerateActuatorScheduleOutput
} from '@/ai/flows/generate-actuator-schedule';

const FIXED_CROP_TYPE = 'Coriander';
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

  const [weatherForecastSummary, setWeatherForecastSummary] = useState<string>(MOCK_WEATHER_FORECAST_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [scheduleDurationDays, setScheduleDurationDays] = useState<number>(1);
  const [activeUiDayIndex, setActiveUiDayIndex] = useState<number>(0); // 0-indexed
  const [actuatorSchedules, setActuatorSchedules] = useState<(FullActuatorSchedule | null)[]>([]);

  useEffect(() => {
    // Initialize schedules array when duration changes
    setActuatorSchedules(Array(scheduleDurationDays).fill(null));
    setActiveUiDayIndex(0); // Reset to first day
  }, [scheduleDurationDays]);


  const preprocessSensorData = (history: Partial<FirebaseRootData>[]): Omit<GenerateActuatorScheduleInput, 'cropType' | 'weatherForecastSummary'> => {
    if (history.length === 0) {
      return { averageSoilMoistureDrop: 10, averageTemperature: 25, averageHumidity: 60 };
    }

    const avgTemp = history.reduce((sum, data) => sum + (data.V1 || 25), 0) / history.length;
    const avgHumidity = history.reduce((sum, data) => sum + (data.V2 || 60), 0) / history.length;
    
    let totalMoistureDrop = 0;
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const prevMoisture = history[i-1].V3 || 50;
        const currentMoisture = history[i].V3 || 50;
        const drop = prevMoisture - currentMoisture;
        totalMoistureDrop += Math.max(0, drop);
      }
    }
    const avgDailyMoistureDrop = history.length > 1 ? totalMoistureDrop / (history.length - 1) : 10;

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
    setIsLoading(true);
    const newInitialSchedules: (FullActuatorSchedule | null)[] = Array(scheduleDurationDays).fill(null);
    setActuatorSchedules(newInitialSchedules);
    setActiveUiDayIndex(0);

    try {
      const sensorHistory: Partial<FirebaseRootData>[] = await getSensorHistory(7);
      const processedSensorData = preprocessSensorData(sensorHistory);
      
      const input: GenerateActuatorScheduleInput = {
        ...processedSensorData,
        cropType: FIXED_CROP_TYPE,
        weatherForecastSummary,
      };
      
      console.log("AI Input for Actuator Schedule (Day 1):", input);
      toast({ title: "Generating Actuator Schedule for Day 1...", description: `Crop: ${FIXED_CROP_TYPE}. Weather context provided.` });

      const result: GenerateActuatorScheduleOutput = await generateActuatorSchedule(input);
      
      const generatedDayOneSchedule = (result.schedule && result.schedule.length === 96) ? result.schedule : [...FALLBACK_SCHEDULE.map(entry => ({...entry}))]; // Deep copy fallback

      const updatedSchedules = [...newInitialSchedules];
      updatedSchedules[0] = generatedDayOneSchedule;

      for (let i = 1; i < scheduleDurationDays; i++) {
        updatedSchedules[i] = [...generatedDayOneSchedule.map(entry => ({...entry}))]; // Deep copy for subsequent days
      }
      setActuatorSchedules(updatedSchedules);
      toast({ title: "Actuator Schedules Initialized!", variant: "default", description: `Day 1 based on AI, subsequent ${scheduleDurationDays > 1 ? scheduleDurationDays -1 : ''} days copied. Review each day.` });

    } catch (err: any) {
      console.error("Error generating actuator schedule:", err);
      const errorSchedules = Array(scheduleDurationDays).fill(null).map(() => [...FALLBACK_SCHEDULE.map(entry => ({...entry}))] ); // Deep copy fallback
      setActuatorSchedules(errorSchedules);
      toast({ variant: "destructive", title: "Generation Failed", description: err.message || `Could not generate schedule. Using fallback for all ${scheduleDurationDays} days.` });
    } finally {
      setIsLoading(false);
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
      // Path for saving is /schedules/{uid}/day-{dayNumber} (1-indexed)
      const dayNumber = activeUiDayIndex + 1;
      await database.set(database.ref(`schedules/${currentUser.uid}/day-${dayNumber}`), scheduleToSave);
      toast({ title: `Schedule for Day ${dayNumber} Saved!`, description: `Actuator schedule for Day ${dayNumber} has been saved successfully.` });
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message || `Could not save the schedule for Day ${activeUiDayIndex + 1}.` });
    } finally {
      setIsSaving(false);
    }
  };

  const currentScheduleForTable = actuatorSchedules[activeUiDayIndex];

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
                  max="7" // Example max, adjust as needed
                  className="bg-input/30"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weatherForecast">7-Day Weather Forecast Summary (Context for AI)</Label>
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
                Provide a summary including temperature, humidity, and rain expectations for the next 7 days. AI will use this to generate Day 1's schedule.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Schedules...
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
              <TabsList className="grid w-full grid-cols-min(7, scheduleDurationDays) md:flex md:flex-wrap">
                {Array.from({ length: scheduleDurationDays }, (_, i) => (
                  <TabsTrigger key={`day-tab-${i}`} value={String(i)}>Day {i + 1}</TabsTrigger>
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
                    <div className="mt-4 p-4 text-center text-muted-foreground">Schedule for Day {i + 1} has not been generated or is empty.</div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex-col items-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-4">
            <p className="text-xs text-muted-foreground">
              Note: AI generates Day 1. Other days are copies. Adjust based on real-world observations.
            </p>
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
                  Save Schedule for Day {activeUiDayIndex + 1}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
