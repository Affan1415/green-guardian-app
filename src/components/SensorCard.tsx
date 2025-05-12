
"use client";
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SensorCardProps {
  title: string;
  value: number | string | null | undefined;
  unit: string;
  icon: ReactNode;
  isLoading?: boolean;
}

export default function SensorCard({ title, value, unit, icon, isLoading = false }: SensorCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-foreground">
            {value ?? 'N/A'} {value !== null && value !== undefined && unit}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Real-time reading
        </p>
      </CardContent>
    </Card>
  );
}
