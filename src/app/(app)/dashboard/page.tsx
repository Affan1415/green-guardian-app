
"use client";
import { useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
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

// Helper to get a user-friendly name for Firebase keys
const getDeviceName = (key: DeviceFirebaseKey): string => {
  switch (key) {
    case 'B2': return 'Grow Light';
    case 'B3': return 'Water Pump';
    case 'B4': return 'Fan';
    case 'B5': return 'Lid Motor';
    case 'Mode': return 'System Mode';
    default: return key;
  }
};

// Define thresholds for Coriander (can be adjusted)
const CORIANDER_THRESHOLDS = {
  TEMP_HIGH: 28, // Celsius, Fan ON if above
  TEMP_LOW_FAN_OFF: 24, // Celsius, Fan OFF if below (unless humidity requires it)
  HUMIDITY_HIGH_LID_OPEN: 70, // %, Lid OPEN if Fan is ON and humidity is above
  HUMIDITY_LOW_LID_CLOSE: 50, // %, Lid CLOSE if below (or Fan is OFF)
  HUMIDITY_HIGH_FAN_ON: 75, // %, Fan ON if humidity is high
  SOIL_MOISTURE_LOW_PUMP_ON: 35, // %, Pump ON if below
  SOIL_MOISTURE_HIGH_PUMP_OFF: 55, // %, Pump OFF if above
  LIGHT_LOW_BULB_ON: 4000, // lux, Bulb ON if below (during "daytime" - simplified for now)
  LIGHT_HIGH_BULB_OFF: 8000, // lux, Bulb OFF if above
};


export default function DashboardPage() {
  const { currentUser } = useAuth(); 
  const { toast } = useToast();

  const [firebaseData, setFirebaseData] = useState<FirebaseRootData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const dataRef = database.ref('/'); 
    const unsubscribe = database.onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFirebaseData(data as FirebaseRootData);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  const穩定UpdateFirebaseDevice = useCallback(async (key: ActuatorFirebaseKey, desiredValue: "0" | "1", currentFirebaseValue: "0" | "1" | undefined) => {
    if (currentFirebaseValue !== desiredValue) {
      try {
        await database.set(database.ref(`/${key}`), desiredValue);
        // console.log(`AI Mode: Successfully set ${getDeviceName(key)} to ${desiredValue === "1" ? "ON" : "OFF"}`);
        // Toasting for every AI change can be noisy, consider a general "AI Active" indicator
      } catch (error) {
        console.error(`AI Mode: Failed to set ${key} to ${desiredValue}`, error);
        toast({
          variant: "destructive",
          title: "AI Control Error",
          description: `Failed to update ${getDeviceName(key)}.`,
        });
      }
    }
  }, [toast]);


  // AI Mode Logic Effect
  useEffect(() => {
    if (firebaseData?.Mode === "1" && currentUser && !loadingData) {
      const temp = typeof firebaseData.V1 === 'number' ? firebaseData.V1 : null;
      const humidity = typeof firebaseData.V2 === 'number' ? firebaseData.V2 : null;
      const soilMoisture = typeof firebaseData.V3 === 'number' ? firebaseData.V3 : null;
      const light = typeof firebaseData.V4 === 'number' ? firebaseData.V4 : null;

      let desiredFanState: "0" | "1" = firebaseData.B4 ?? "0"; // Default to current or OFF
      let desiredLidState: "0" | "1" = firebaseData.B5 ?? "0";
      let desiredPumpState: "0" | "1" = firebaseData.B3 ?? "0";
      let desiredBulbState: "0" | "1" = firebaseData.B2 ?? "0";

      // Fan (B4) logic based on Temperature
      if (temp !== null) {
        if (temp > CORIANDER_THRESHOLDS.TEMP_HIGH) {
          desiredFanState = "1"; // Too hot, turn fan ON
        } else if (temp < CORIANDER_THRESHOLDS.TEMP_LOW_FAN_OFF) {
          desiredFanState = "0"; // Cool enough, turn fan OFF (unless humidity is high)
        }
      }
      // Fan (B4) override by Humidity
      if (humidity !== null && humidity > CORIANDER_THRESHOLDS.HUMIDITY_HIGH_FAN_ON) {
         desiredFanState = "1"; // Too humid, turn fan ON
      }


      // Lid (B5) logic based on Humidity and Fan state
      if (humidity !== null) {
        if (humidity > CORIANDER_THRESHOLDS.HUMIDITY_HIGH_LID_OPEN && desiredFanState === "1") {
          desiredLidState = "1"; // High humidity and fan is on, open lid
        } else if (humidity < CORIANDER_THRESHOLDS.HUMIDITY_LOW_LID_CLOSE || desiredFanState === "0") {
          desiredLidState = "0"; // Low humidity or fan is off, close lid
        }
      }

      // Pump (B3) logic based on Soil Moisture
      // Note: This is a simple ON/OFF. Real systems might pulse the pump.
      // For this implementation, 'ON' means the signal is high until condition changes.
      if (soilMoisture !== null) {
        if (soilMoisture < CORIANDER_THRESHOLDS.SOIL_MOISTURE_LOW_PUMP_ON) {
          desiredPumpState = "1"; // Too dry, turn pump ON
        } else if (soilMoisture > CORIANDER_THRESHOLDS.SOIL_MOISTURE_HIGH_PUMP_OFF) {
          desiredPumpState = "0"; // Wet enough, turn pump OFF
        }
        // If in the dead-band and pump is on, it stays on until > HIGH_PUMP_OFF
        // If in the dead-band and pump is off, it stays off until < LOW_PUMP_ON
      }

      // Bulb (B2) logic based on Light Intensity (simplified, no time-of-day check)
      if (light !== null) {
        if (light < CORIANDER_THRESHOLDS.LIGHT_LOW_BULB_ON) {
          desiredBulbState = "1"; // Too dark, turn bulb ON
        } else if (light > CORIANDER_THRESHOLDS.LIGHT_HIGH_BULB_OFF) {
          desiredBulbState = "0"; // Bright enough, turn bulb OFF
        }
      }
      
      // Update actuators
      穩定UpdateFirebaseDevice("B2", desiredBulbState, firebaseData.B2);
      穩定UpdateFirebaseDevice("B3", desiredPumpState, firebaseData.B3);
      穩定UpdateFirebaseDevice("B4", desiredFanState, firebaseData.B4);
      穩定UpdateFirebaseDevice("B5", desiredLidState, firebaseData.B5);
    }
  }, [firebaseData, currentUser, loadingData, 穩定UpdateFirebaseDevice, toast]);


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
  const isAiModeActive = firebaseData?.Mode === "1";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Green Guardian Dashboard</h1>
        {isLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <Button
            onClick={() => handleToggleDevice("Mode", firebaseData?.Mode)}
            disabled={firebaseData?.Mode === undefined} // Only disable if Mode data is not yet loaded
            variant={isAiModeActive ? "default" : "secondary"}
            className={cn(
              "w-full sm:w-auto text-white",
              isAiModeActive ? "bg-primary hover:bg-primary/90" : "bg-accent hover:bg-accent/90 "
            )}
          >
            {isAiModeActive ? <Brain className="mr-2 h-5 w-5" /> : <UserCog className="mr-2 h-5 w-5" />}
            {isAiModeActive ? "Switch to Manual Mode" : "Switch to AI Mode"}
          </Button>
        )}
      </div>
       {isAiModeActive && (
        <div className="p-4 mb-6 bg-secondary/50 border border-primary/30 rounded-lg text-center">
          <p className="font-semibold text-primary flex items-center justify-center gap-2">
            <Brain className="h-5 w-5" /> AI Mode is Active
          </p>
          <p className="text-sm text-muted-foreground">System is automatically managing actuators based on sensor readings and thresholds.</p>
        </div>
      )}


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
                value={firebaseData?.[card.firebaseKey] as number | string | undefined} // Allow string for potential future non-numeric sensors
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
             {[...Array(4)].map((_, i) => <ActuatorCard key={i} title="" status={undefined} icon={<div/>} onToggle={()=>{}} isLoading={true} isAiModeActive={false} />)}
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
                  isLoading={isLoading}
                  isAiModeActive={isAiModeActive}
                />
              );
            })}
          </div>
        )}
      </div>
       <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">AI Mode Information</h3>
        <p className="text-sm text-muted-foreground">
          When AI Mode is active, Green Guardian automatically controls the actuators based on the following simplified thresholds for Coriander:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
          <li><strong>Fan:</strong> ON if Temp &gt; {CORIANDER_THRESHOLDS.TEMP_HIGH}°C or Humidity &gt; {CORIANDER_THRESHOLDS.HUMIDITY_HIGH_FAN_ON}%. OFF if Temp &lt; {CORIANDER_THRESHOLDS.TEMP_LOW_FAN_OFF}°C (and humidity permits).</li>
          <li><strong>Lid:</strong> OPEN if Humidity &gt; {CORIANDER_THRESHOLDS.HUMIDITY_HIGH_LID_OPEN}% and Fan is ON. CLOSE if Humidity &lt; {CORIANDER_THRESHOLDS.HUMIDITY_LOW_LID_CLOSE}% or Fan is OFF.</li>
          <li><strong>Water Pump:</strong> ON if Soil Moisture &lt; {CORIANDER_THRESHOLDS.SOIL_MOISTURE_LOW_PUMP_ON}%. OFF if Soil Moisture &gt; {CORIANDER_THRESHOLDS.SOIL_MOISTURE_HIGH_PUMP_OFF}%.</li>
          <li><strong>Grow Light:</strong> ON if Light Intensity &lt; {CORIANDER_THRESHOLDS.LIGHT_LOW_BULB_ON} lux. OFF if Light Intensity &gt; {CORIANDER_THRESHOLDS.LIGHT_HIGH_BULB_OFF} lux.</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Note: This is a simplified AI logic. For more robust control, especially for critical operations like pumping, timed actions or more advanced algorithms (e.g., PID controllers, machine learning models trained on historical data) are recommended in a production environment. The current AI mode directly sets actuators ON/OFF based on thresholds.
        </p>
      </div>
    </div>
  );
}
