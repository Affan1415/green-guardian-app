
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/config/firebase';
import type { FirebaseRootData, DeviceFirebaseKey, ActuatorFirebaseKey } from '@/types';
import SensorCard from '@/components/SensorCard';
import ActuatorCard from '@/components/ActuatorCard';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Sprout, Sun, Fan as FanIcon, Workflow, ChevronsUpDown, LightbulbIcon, Brain, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Helpe to get a user-friendly name for Firebase keys
const getDeviceName = (key: DeviceFirebaseKey): string => {
  switch (key) {
    case 'B2': return 'Bulb';
    case 'B3': return 'Water Pump';
    case 'B4': return 'Fan';
    case 'B5': return 'Lid Motor';
    case 'Mode': return 'System Mode';
    default: return key;
  }
};

export default function DashboardPage() {
  const { isAdmin } = useAuth(); // isAdmin might still be useful for other UI elements
  const { toast } = useToast();

  const [firebaseData, setFirebaseData] = useState<FirebaseRootData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const dataRef = database.ref('/'); // Listen to the root path
    const unsubscribe = database.onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFirebaseData(data as FirebaseRootData);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleDevice = async (key: DeviceFirebaseKey, currentValue: "0" | "1" | undefined) => {
    if (currentValue === undefined) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `${getDeviceName(key)} data not available.`,
      });
      return;
    }

    const newValue = currentValue === "0" ? "1" : "0";
    
    try {
      await database.set(database.ref(`/${key}`), newValue);
      // The onValue listener will update the state
      toast({
        title: `${getDeviceName(key)} Updated`,
        description: `${getDeviceName(key)} has been set to ${key === 'Mode' ? (newValue === "1" ? "AI Mode" : "Manual Mode") : (newValue === "1" ? "ON" : "OFF")}.`,
      });
    } catch (error) {
      console.error(`Failed to toggle ${key}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${getDeviceName(key)}.`,
      });
    }
  };
  
  const sensorCardsConfig = [
    { title: "Temperature", firebaseKey: "V1", unit: "°C", icon: <Thermometer className="h-6 w-6" /> },
    { title: "Humidity", firebaseKey: "V2", unit: "%", icon: <Droplets className="h-6 w-6" /> },
    { title: "Soil Moisture", firebaseKey: "V3", unit: "%", icon: <Sprout className="h-6 w-6" /> },
    { title: "Light Intensity", firebaseKey: "V4", unit: "lux", icon: <Sun className="h-6 w-6" /> },
  ];

  const actuatorCardsConfig: { title: string; firebaseKey: ActuatorFirebaseKey; icon: JSX.Element }[] = [
    { title: "Fan Control", firebaseKey: "B4", icon: <FanIcon className="h-6 w-6" /> },
    { title: "Water Pump", firebaseKey: "B3", icon: <Workflow className="h-6 w-6" /> },
    { title: "Lid Motor", firebaseKey: "B5", icon: <ChevronsUpDown className="h-6 w-6" /> },
    { title: "Grow Light", firebaseKey: "B2", icon: <LightbulbIcon className="h-6 w-6" /> },
  ];

  const isLoading = loadingData || firebaseData === null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Green Guardian Dashboard</h1>
        {isLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <Button
            onClick={() => handleToggleDevice("Mode", firebaseData?.Mode)}
            disabled={firebaseData?.Mode === undefined}
            variant={firebaseData?.Mode === "1" ? "default" : "secondary"}
            className={cn(
              "w-full sm:w-auto text-white",
              firebaseData?.Mode === "1" ? "bg-primary hover:bg-primary/90" : "bg-accent hover:bg-accent/90 "
            )}
          >
            {firebaseData?.Mode === "1" ? <Brain className="mr-2 h-5 w-5" /> : <UserCog className="mr-2 h-5 w-5" />}
            {firebaseData?.Mode === "1" ? "Switch to Manual Mode" : "Switch to AI Mode"}
          </Button>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Sensor Modules</h2>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SensorCard key={i} title="" value={null} unit="" icon={<div/>} isLoading={true} />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sensorCardsConfig.map(card => (
              <SensorCard
                key={card.title}
                title={card.title}
                value={firebaseData?.[card.firebaseKey] as number | undefined}
                unit={card.unit}
                icon={card.icon}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Actuator Modules</h2>
         {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             {[...Array(4)].map((_, i) => <ActuatorCard key={i} title="" status={undefined} icon={<div/>} onToggle={()=>{}} isAdmin={false} isLoading={true} />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {actuatorCardsConfig.map(card => {
              const currentStatus = firebaseData?.[card.firebaseKey];
              const statusProp = currentStatus === "1" ? 'on' : currentStatus === "0" ? 'off' : undefined;
              return (
                <ActuatorCard
                  key={card.title}
                  title={card.title}
                  status={statusProp}
                  icon={card.icon}
                  onToggle={() => handleToggleDevice(card.firebaseKey, currentStatus)}
                  isAdmin={isAdmin} 
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
