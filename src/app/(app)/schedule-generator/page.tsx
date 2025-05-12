
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateIrrigationSchedule, GenerateIrrigationScheduleInput } from '@/ai/flows/generate-irrigation-schedule';
import { getSensorHistory } from '@/config/firebase'; // Mocked Firebase utility
import type { SensorData } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

export default function ScheduleGeneratorPage() {
  const [crop, setCrop] = useState('Tomato');
  const [rainyDaysInput, setRainyDaysInput] = useState<number[]>([]); // Days 1-7
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRainyDayChange = (day: number, checked: boolean) => {
    setRainyDaysInput(prev => 
      checked ? [...prev, day] : prev.filter(d => d !== day)
    );
  };

  const preprocessSensorData = (history: Partial<SensorData>[]): Omit<GenerateIrrigationScheduleInput, 'crop' | 'rainyDays'> => {
    if (history.length === 0) {
      return { averageDailyMoistureDrop: 10, averageTemperature: 25, averageHumidity: 60 }; // Defaults
    }

    const avgTemp = history.reduce((sum, data) => sum + (data.temperature || 25), 0) / history.length;
    const avgHumidity = history.reduce((sum, data) => sum + (data.humidity || 60), 0) / history.length;
    
    // Simulate moisture drop calculation
    let totalMoistureDrop = 0;
    for (let i = 1; i < history.length; i++) {
      const drop = (history[i-1].soilMoisture || 50) - (history[i].soilMoisture || 50);
      totalMoistureDrop += Math.max(0, drop); // Only positive drops
    }
    const avgDailyMoistureDrop = history.length > 1 ? totalMoistureDrop / (history.length -1) : 10;


    return {
      averageDailyMoistureDrop: parseFloat(avgDailyMoistureDrop.toFixed(1)) || 10,
      averageTemperature: parseFloat(avgTemp.toFixed(1)) || 25,
      averageHumidity: parseFloat(avgHumidity.toFixed(1)) || 60,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSchedule(null);

    try {
      const sensorHistory = await getSensorHistory(7); // Fetch last 7 days data
      const processedData = preprocessSensorData(sensorHistory);
      
      const input: GenerateIrrigationScheduleInput = {
        ...processedData,
        crop,
        rainyDays: rainyDaysInput.sort((a,b) => a-b),
      };
      
      // Log input for debugging
      console.log("AI Input:", input);

      const summary = `Average soil moisture drop: ${input.averageDailyMoistureDrop}% per day. Avg temperature: ${input.averageTemperature}°C. Humidity: ${input.averageHumidity}%. Crop: ${input.crop}. Rain on Day(s): ${input.rainyDays.length > 0 ? input.rainyDays.join(', ') : 'None'}.`;
      toast({ title: "Generating Schedule...", description: summary });

      const result = await generateIrrigationSchedule(input);
      setSchedule(result.schedule);
      toast({ title: "Schedule Generated Successfully!", variant: "default" });

    } catch (err: any) {
      console.error("Error generating schedule:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: err.message || 'Could not generate schedule.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Irrigation Schedule Generator</CardTitle>
          <CardDescription>
            Generate a 7-day irrigation plan based on sensor trends and forecasts.
            This uses a mock AI model for demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="crop">Crop Type</Label>
              <Input
                id="crop"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="e.g., Tomato, Lettuce"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rain Forecast (Next 7 Days)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div key={day} className="flex items-center space-x-2 p-2 border rounded-md bg-input/30">
                    <Checkbox
                      id={`rain-day-${day}`}
                      checked={rainyDaysInput.includes(day)}
                      onCheckedChange={(checked) => handleRainyDayChange(day, !!checked)}
                    />
                    <Label htmlFor={`rain-day-${day}`} className="text-sm font-normal">Day {day}</Label>
                  </div>
                ))}
              </div>
               <p className="text-xs text-muted-foreground">Select days where rain is expected.</p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Schedule'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {schedule && (
        <Card className="mt-8 bg-secondary/50">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Generated 7-Day Irrigation Schedule</CardTitle>
            <CardDescription>Based on the provided data and AI model.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={schedule}
              className="min-h-[200px] text-sm bg-background font-mono"
              rows={10}
            />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: This schedule is a suggestion. Adjust based on real-world observations.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
