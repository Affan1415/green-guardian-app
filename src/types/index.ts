export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
  displayName?: string | null;
}

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

export type ActuatorName = keyof ActuatorData;
