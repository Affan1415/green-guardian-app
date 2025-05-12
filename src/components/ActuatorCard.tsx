
"use client";
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

interface ActuatorCardProps {
  title: string;
  status: 'on' | 'off' | null | undefined;
  icon: ReactNode;
  onToggle: () => void;
  isLoading?: boolean;
  isAiModeActive: boolean; // New prop to indicate if AI mode is active
}

export default function ActuatorCard({ title, status, icon, onToggle, isLoading = false, isAiModeActive }: ActuatorCardProps) {
  const currentStatus = status ?? 'unknown';
  
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-6 w-16 mb-1" />
        ) : (
          <Badge 
            variant={currentStatus === 'on' ? 'default' : currentStatus === 'off' ? 'secondary' : 'outline'}
            className={cn(
              "text-sm capitalize",
              currentStatus === 'on' && "bg-green-500 hover:bg-green-600 text-white",
              currentStatus === 'off' && "bg-red-500 hover:bg-red-600 text-white",
              currentStatus === 'unknown' && "bg-gray-400 text-white"
            )}
          >
            {currentStatus}
          </Badge>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Current status {isAiModeActive && "(AI Controlled)"}
        </p>
      </CardContent>
      <CardFooter>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Button 
            onClick={onToggle} 
            disabled={status === null || status === undefined || isAiModeActive} // Disable if status unknown OR AI mode is active
            className="w-full"
            variant={status === 'on' ? 'destructive' : 'default'}
            title={isAiModeActive ? "Manual control disabled in AI Mode" : (status === 'on' ? 'Turn OFF' : 'Turn ON')}
          >
            {isAiModeActive ? "AI Controlled" : (status === 'on' ? 'Turn OFF' : 'Turn ON')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
