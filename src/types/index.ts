
export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
  displayName?: string | null;
}

// New Firebase data structure from the root
export interface FirebaseRootData {
  V1?: number; // Temperature
  V2?: number; // Humidity
  V3?: number; // Soil Moisture
  V4?: number; // Light Intensity (assuming this is the mapping)
  B2?: "0" | "1"; // Bulb
  B3?: "0" | "1"; // Pump
  B4?: "0" | "1"; // Fan
  B5?: "0" | "1"; // Lid
  Mode?: "0" | "1"; // AI/Manual Mode
  // Allow other potential keys that might exist at the root
  [key: string]: number | string | undefined;
}

// Keys for specific actuators in FirebaseRootData
export type ActuatorFirebaseKey = "B2" | "B3" | "B4" | "B5";
export type ModeFirebaseKey = "Mode";
export type DeviceFirebaseKey = ActuatorFirebaseKey | ModeFirebaseKey;


// --- Types for Schedule Generator (can remain as they are, inputs to AI flow) ---
export type ActuatorState = 'ON' | 'OFF' | 'Idle';

export interface ActuatorScheduleEntry {
  time: string; // HH:MM format
  fan: ActuatorState;
  pump: ActuatorState;
  lid: ActuatorState;
  bulb: ActuatorState;
}

export type FullActuatorSchedule = ActuatorScheduleEntry[];

// --- Type for Historical Data Visualization ---
export interface HistoricalDataPoint {
  timestamp: number; // Unix timestamp
  V1?: number; // Temperature
  V2?: number; // Humidity
  V3?: number; // Soil Moisture
  V4?: number; // Light Intensity
}


// --- Old types, commented out for clarity or if they need to be removed/updated ---
/*
export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
}

export interface ActuatorData {
  fan: 'on' | 'off';
  waterPump: 'on' | 'off';
  lidMotor: 'on' | 'off';
  bulb: 'on' | 'off';
}

export type ActuatorName = keyof ActuatorData; // This would need to change if ActuatorData changes
*/

