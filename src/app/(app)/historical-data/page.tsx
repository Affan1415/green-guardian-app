"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getSensorHistory } from '@/config/firebase';
import type { HistoricalDataPoint } from '@/types';
import HistoricalDataChart from '@/components/HistoricalDataChart';
import { LineChart as LineChartIcon, Loader2, Thermometer, Droplets, Sprout, Sun, CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

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
] as const;

const generatePeriodOptions = () => {
  const options = [
    { value: "1d", label: "Last 24 Hours" },
    { value: "3d", label: "Last 3 Days" },
    { value: "7d", label: "Last 7 Days" },
    { value: "today", label: "Today" },
  ];
  for (let i = 1; i < 7; i++) {
    const date = subDays(new Date(), i);
    options.push({
      value: `day_ago_${i}`,
      label: i === 1 ? "Yesterday" : `${format(date, 'MMM d')} (${i} days ago)`,
    });
  }
  return options;
};

const PERIOD_OPTIONS = generatePeriodOptions();

export default function HistoricalDataPage() {
  const [rawHistoricalData, setRawHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
  const [displayData, setDisplayData] = useState<HistoricalDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d"); // Default to 7 days

  // Fetch initial 7 days of data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Always fetch the last 7 days of data to enable client-side filtering for all options
        const data = await getSensorHistory(7);
        setRawHistoricalData(data);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
        setRawHistoricalData([]); // Set to empty array on error to avoid null issues
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Filter data based on selectedPeriod
  useEffect(() => {
    if (!rawHistoricalData) {
      setDisplayData(null);
      return;
    }
    setLoading(true);

    let filtered: HistoricalDataPoint[] = [];
    const now = new Date();

    if (selectedPeriod.endsWith('d')) { // "1d", "3d", "7d"
      const days = parseInt(selectedPeriod.replace('d', ''), 10);
      const startTime = subDays(now, days).getTime();
      filtered = rawHistoricalData.filter(point => point.timestamp >= startTime);
    } else if (selectedPeriod === "today") {
      const dayStart = startOfDay(now).getTime();
      const dayEnd = endOfDay(now).getTime();
      filtered = rawHistoricalData.filter(point => point.timestamp >= dayStart && point.timestamp <= dayEnd);
    } else if (selectedPeriod.startsWith("day_ago_")) {
      const daysAgo = parseInt(selectedPeriod.replace('day_ago_', ''), 10);
      const targetDate = subDays(now, daysAgo);
      const dayStart = startOfDay(targetDate).getTime();
      const dayEnd = endOfDay(targetDate).getTime();
      filtered = rawHistoricalData.filter(point => point.timestamp >= dayStart && point.timestamp <= dayEnd);
    }
    
    setDisplayData(filtered);
    setLoading(false);
  }, [rawHistoricalData, selectedPeriod]);

  const currentPeriodLabel = useMemo(() => {
    return PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod)?.label || "Selected Period";
  }, [selectedPeriod]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <LineChartIcon className="h-8 w-8 mr-3" />
          Historical Sensor Data
        </h1>
        <div className="flex items-center gap-4">
          <Label htmlFor="period-select" className="text-sm font-medium text-foreground flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            View Data For:
          </Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger id="period-select" className="w-[220px] bg-background">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96 text-primary">
          <Loader2 className="h-12 w-12 animate-spin mr-3" />
          <p className="text-xl">Loading data for {currentPeriodLabel.toLowerCase()}...</p>
        </div>
      )}

      {!loading && (!displayData || displayData.length === 0) && (
         <div className="text-center py-10 text-muted-foreground bg-muted/30 p-6 rounded-lg border border-dashed">
           <p className="text-xl mb-2 font-semibold">No historical data found for {currentPeriodLabel.toLowerCase()}.</p>
           <p>Sensor data might not have been recorded for this period, or there was an issue fetching it.</p>
           <p className="text-xs mt-2">Try selecting a different time period. Logs are kept for up to 7 days.</p>
         </div>
      )}

      {!loading && displayData && displayData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHART_CONFIG.map((config) => (
            <HistoricalDataChart
              key={config.dataKey}
              title={config.title}
              data={displayData}
              // @ts-ignore dataKey will be one of "V1", "V2", "V3", "V4"
              dataKey={config.dataKey} 
              name={config.name}
              unit={config.unit}
              strokeColor={config.strokeColor}
              description={`Showing ${config.name.toLowerCase()} readings for ${currentPeriodLabel.toLowerCase()}.`}
            />
          ))}
        </div>
      )}
       <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">About This Data</h3>
        <p className="text-sm text-muted-foreground">
          The charts above display sensor readings fetched from the Firebase Realtime Database. The system is configured to show data for up to the last 7 days.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
          <li>The X-axis represents time.</li>
          <li>The Y-axis represents the sensor reading in its respective unit.</li>
          <li>Hover over the lines to see specific data points and exact timestamps.</li>
          <li>Use the dropdown to select different time periods or specific days for analysis.</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          **Data Population &amp; Retention**: To populate with dummy data, you can add entries to the `sensor_logs` path in your Firebase Realtime Database. Each entry should have a `timestamp` (Unix milliseconds) and sensor values (V1, V2, V3, V4). Automatic deletion of data older than 7 days requires a server-side Firebase Cloud Function, which is not part of this client application.
        </p>
      </div>
    </div>
  );
}
