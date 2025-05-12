
"use client";

import React, { useEffect, useState } from 'react';
import { getSensorHistory } from '@/config/firebase';
import type { HistoricalDataPoint } from '@/types';
import HistoricalDataChart from '@/components/HistoricalDataChart';
import { LineChart as LineChartIcon, Loader2, Thermometer, Droplets, Sprout, Sun } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const CHART_CONFIG = [
  {
    title: "Temperature History",
    dataKey: "V1",
    name: "Temperature",
    unit: "°C",
    strokeColor: "hsl(var(--chart-1))",
    icon: <Thermometer className="h-5 w-5 mr-2" />
  },
  {
    title: "Humidity History",
    dataKey: "V2",
    name: "Humidity",
    unit: "%",
    strokeColor: "hsl(var(--chart-2))",
    icon: <Droplets className="h-5 w-5 mr-2" />
  },
  {
    title: "Soil Moisture History",
    dataKey: "V3",
    name: "Soil Moisture",
    unit: "%",
    strokeColor: "hsl(var(--chart-3))",
    icon: <Sprout className="h-5 w-5 mr-2" />
  },
  {
    title: "Light Intensity History",
    dataKey: "V4",
    name: "Light Intensity",
    unit: "lux",
    strokeColor: "hsl(var(--chart-4))",
    icon: <Sun className="h-5 w-5 mr-2" />
  },
] as const; // Use "as const" for stricter typing of dataKey


export default function HistoricalDataPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string>("7"); // Default to 7 days

  const fetchHistory = async (days: number) => {
    setLoading(true);
    setHistoricalData(null); // Clear previous data
    try {
      const data = await getSensorHistory(days);
      setHistoricalData(data);
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
      // Optionally, set an error state and display a message to the user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(parseInt(selectedDays, 10));
  }, [selectedDays]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <LineChartIcon className="h-8 w-8 mr-3" />
          Historical Sensor Data
        </h1>
        <div className="flex items-center gap-4">
          <Label htmlFor="days-select" className="text-sm font-medium text-foreground">
            View Data For:
          </Label>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger id="days-select" className="w-[180px] bg-background">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="3">Last 3 Days</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96 text-primary">
          <Loader2 className="h-12 w-12 animate-spin mr-3" />
          <p className="text-xl">Loading historical data...</p>
        </div>
      )}

      {!loading && (!historicalData || historicalData.length === 0) && (
         <div className="text-center py-10 text-muted-foreground">
           <p className="text-xl mb-2">No historical data found for the selected period.</p>
           <p>Sensor data might not have been recorded yet or there was an issue fetching it.</p>
         </div>
      )}

      {!loading && historicalData && historicalData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHART_CONFIG.map((config) => (
            <HistoricalDataChart
              key={config.dataKey}
              title={config.title}
              data={historicalData}
              // @ts-ignore dataKey will be one of "V1", "V2", "V3", "V4"
              dataKey={config.dataKey} 
              name={config.name}
              unit={config.unit}
              strokeColor={config.strokeColor}
              description={`Showing ${config.name.toLowerCase()} readings for the last ${selectedDays} day(s).`}
            />
          ))}
        </div>
      )}
       <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">About This Data</h3>
        <p className="text-sm text-muted-foreground">
          The charts above display simulated historical sensor readings for demonstration purposes. In a real-world scenario, this data would be pulled from your actual sensor logs stored in Firebase Realtime Database.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
          <li>The X-axis represents time (days).</li>
          <li>The Y-axis represents the sensor reading in its respective unit.</li>
          <li>Hover over the lines to see specific data points and exact timestamps.</li>
          <li>Use the dropdown to select different time periods for analysis.</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Analyzing historical trends can help you understand your greenhouse environment better, identify patterns, and make more informed decisions for optimizing crop growth and resource usage.
        </p>
      </div>
    </div>
  );
}
