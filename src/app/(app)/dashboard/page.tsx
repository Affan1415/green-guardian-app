
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/config/firebase'; // Mocked Firebase
import type { SensorData, ActuatorData, ActuatorName } from '@/types';
import SensorCard from '@/components/SensorCard';
import ActuatorCard from '@/components/ActuatorCard';
import { Thermometer, Droplets, Sprout, Sun, Fan as FanIcon, Workflow, ChevronsUpDown, LightbulbIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { isAdmin } = useAuth(); // isAdmin might still be useful for other UI elements, but not for toggling
  const { toast } = useToast();

  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [actuatorData, setActuatorData] = useState<ActuatorData | null>(null);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [loadingActuators, setLoadingActuators] = useState(true);

  useEffect(() => {
    const sensorsRef = database.ref('sensors');
    const unsubscribeSensors = database.onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(data as SensorData);
      }
      setLoadingSensors(false);
    });

    const actuatorsRef = database.ref('actuators');
    const unsubscribeActuators = database.onValue(actuatorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActuatorData(data as ActuatorData);
      }
      setLoadingActuators(false);
    });

    return () => {
      unsubscribeSensors();
      unsubscribeActuators();
    };
  }, []);

  const handleToggleActuator = async (actuatorName: ActuatorName) => {
    if (!actuatorData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Actuator data not available.",
      });
      return;
    }

    const currentStatus = actuatorData[actuatorName];
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    
    try {
      await database.set(database.ref(`actuators/${actuatorName}`), newStatus);
      // The onValue listener will update the state, no need to setActuatorData here
      toast({
        title: `${actuatorName.charAt(0).toUpperCase() + actuatorName.slice(1)} updated`,
        description: `${actuatorName.charAt(0).toUpperCase() + actuatorName.slice(1)} turned ${newStatus.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Failed to toggle actuator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${actuatorName}.`,
      });
    }
  };
  
  const sensorCards = [
    { title: "Temperature", dataKey: "temperature", unit: "°C", icon: <Thermometer className="h-6 w-6" />, value: sensorData?.temperature },
    { title: "Humidity", dataKey: "humidity", unit: "%", icon: <Droplets className="h-6 w-6" />, value: sensorData?.humidity },
    { title: "Soil Moisture", dataKey: "soilMoisture", unit: "%", icon: <Sprout className="h-6 w-6" />, value: sensorData?.soilMoisture },
    { title: "Light Intensity", dataKey: "light", unit: "lux", icon: <Sun className="h-6 w-6" />, value: sensorData?.light },
  ];

  const actuatorCards = [
    { title: "Fan Control", actuatorName: "fan" as ActuatorName, icon: <FanIcon className="h-6 w-6" />, status: actuatorData?.fan },
    { title: "Water Pump", actuatorName: "waterPump" as ActuatorName, icon: <Workflow className="h-6 w-6" />, status: actuatorData?.waterPump },
    { title: "Lid Motor", actuatorName: "lidMotor" as ActuatorName, icon: <ChevronsUpDown className="h-6 w-6" />, status: actuatorData?.lidMotor },
    { title: "Grow Light", actuatorName: "bulb" as ActuatorName, icon: <LightbulbIcon className="h-6 w-6" />, status: actuatorData?.bulb },
  ];


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Sensor Modules</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sensorCards.map(card => (
            <SensorCard
              key={card.title}
              title={card.title}
              value={card.value}
              unit={card.unit}
              icon={card.icon}
              isLoading={loadingSensors}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Actuator Modules</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {actuatorCards.map(card => (
             <ActuatorCard
              key={card.title}
              title={card.title}
              status={card.status}
              icon={card.icon}
              onToggle={() => handleToggleActuator(card.actuatorName)}
              // isAdmin prop is still passed but its usage within ActuatorCard is changed
              isAdmin={isAdmin} 
              isLoading={loadingActuators}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

