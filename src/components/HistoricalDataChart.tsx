
"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { HistoricalDataPoint } from '@/types';
import { format } from 'date-fns';

interface HistoricalDataChartProps {
  title: string;
  description?: string;
  data: HistoricalDataPoint[];
  dataKey: keyof Omit<HistoricalDataPoint, 'timestamp'>;
  name: string; // Name for the line in legend/tooltip
  unit: string;
  strokeColor: string; // e.g., "hsl(var(--chart-1))"
}

const HistoricalDataChart: React.FC<HistoricalDataChartProps> = ({
  title,
  description,
  data,
  dataKey,
  name,
  unit,
  strokeColor,
}) => {
  const formattedData = data.map(point => ({
    ...point,
    // Format timestamp for XAxis display (e.g., "May 15")
    formattedTimestamp: format(new Date(point.timestamp), 'MMM d'),
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const fullDate = format(new Date(dataPoint.timestamp), 'MMM d, yyyy HH:mm');
      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg text-sm">
          <p className="font-semibold">{`${name}: ${payload[0].value}${unit}`}</p>
          <p className="text-muted-foreground">{fullDate}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for this period.
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{
                  top: 5,
                  right: 20, // Adjusted right margin for YAxis labels
                  left: 0,  // Adjusted left margin
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedTimestamp" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}${unit}`} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  domain={['auto', 'auto']} // Or specify min/max like [0, 'dataMax + 10']
                  allowDataOverflow={true}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={strokeColor} 
                  strokeWidth={2}
                  name={name}
                  dot={{ r: 3, fill: strokeColor, strokeWidth: 1, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalDataChart;
