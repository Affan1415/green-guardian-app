// This is a mock Firebase setup. In a real application, you would initialize Firebase App here.
// For demonstration purposes, we'll simulate Firebase behavior.

import type { UserProfile, SensorData, ActuatorData, ActuatorName } from '@/types';

// Mock User Database
const mockUsers: Record<string, Omit<UserProfile, 'uid'>> = {
  'admin@agricontrol.com': { email: 'admin@agricontrol.com', role: 'admin', displayName: 'Admin User' },
  'user@agricontrol.com': { email: 'user@agricontrol.com', role: 'user', displayName: 'Regular User' },
};

const mockUserPasswords: Record<string, string> = {
  'admin@agricontrol.com': 'admin123',
  'user@agricontrol.com': 'user123',
}

// Mock Realtime Database
let mockDatabase: {
  sensors: SensorData;
  actuators: ActuatorData;
  users: Record<string, Omit<UserProfile, 'uid' | 'email'>>; // Store role by uid
} = {
  sensors: {
    temperature: 25,
    humidity: 60,
    soilMoisture: 50,
    light: 1000,
  },
  actuators: {
    fan: 'off',
    waterPump: 'off',
    lidMotor: 'off',
    bulb: 'off',
  },
  users: { // uid: role
    'admin-uid': { role: 'admin', displayName: 'Admin User'},
    'user-uid': { role: 'user', displayName: 'Regular User'},
  }
};

// Simulate real-time updates for sensors
if (typeof window !== 'undefined') { // Ensure this only runs in the browser
  setInterval(() => {
    mockDatabase.sensors.temperature = parseFloat((20 + Math.random() * 10).toFixed(1));
    mockDatabase.sensors.humidity = Math.floor(50 + Math.random() * 30);
    mockDatabase.sensors.soilMoisture = Math.floor(40 + Math.random() * 40);
    mockDatabase.sensors.light = Math.floor(500 + Math.random() * 1000);
    
    // Notify listeners - in a real app, Firebase SDK handles this
    Object.values(sensorListeners).forEach(cb => cb(mockDatabase.sensors));
  }, 5000); // Update every 5 seconds
}


// --- Mock Firebase Auth ---
let currentUser: UserProfile | null = null;
const authListeners: Array<(user: UserProfile | null) => void> = [];

export const auth = {
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    authListeners.push(callback);
    // Simulate initial state
    Promise.resolve().then(() => callback(currentUser)); 
    return () => { // Unsubscribe function
      const index = authListeners.indexOf(callback);
      if (index > -1) authListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (email: string, password?: string): Promise<{ user: UserProfile }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userDetails = mockUsers[email];
        if (userDetails && password && mockUserPasswords[email] === password) {
          const uid = email === 'admin@agricontrol.com' ? 'admin-uid' : 'user-uid'; // Simple UID mapping
          currentUser = { ...userDetails, uid };
          if (!mockDatabase.users[uid]) {
             mockDatabase.users[uid] = { role: userDetails.role, displayName: userDetails.displayName || email };
          }
          authListeners.forEach(cb => cb(currentUser));
          resolve({ user: currentUser });
        } else {
          reject(new Error('Invalid credentials or user not found.'));
        }
      }, 500);
    });
  },
  createUserWithEmailAndPassword: async (email: string, password?: string): Promise<{ user: UserProfile }> => {
     return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockUsers[email]) {
          reject(new Error('Email already in use.'));
          return;
        }
        const uid = `new-user-${Date.now()}-uid`;
        const newUserDetails = { email, role: 'user' as const, displayName: email };
        mockUsers[email] = newUserDetails;
        if (password) mockUserPasswords[email] = password;
        
        currentUser = { ...newUserDetails, uid };
        mockDatabase.users[uid] = { role: 'user', displayName: email };
        authListeners.forEach(cb => cb(currentUser));
        resolve({ user: currentUser });
      }, 500);
    });
  },
  signOut: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentUser = null;
        authListeners.forEach(cb => cb(null));
        resolve();
      }, 200);
    });
  },
  getCurrentUser: (): UserProfile | null => currentUser,
};

// --- Mock Firebase Realtime Database ---
const sensorListeners: Record<string, (data: SensorData) => void> = {};
const actuatorListeners: Record<string, (data: ActuatorData) => void> = {};
const userRoleListeners: Record<string, (data: {role: 'admin' | 'user'} | null) => void> = {};


export const database = {
  ref: (path: string) => ({ path }), // Simplified ref
  onValue: (
    dbRef: { path: string }, 
    callback: (snapshot: { val: () => any }) => void
  ) => {
    const path = dbRef.path;
    // Simulate initial data fetch and listen for changes
    setTimeout(() => { // Simulate async fetch
      if (path === 'sensors') {
        sensorListeners[path] = callback as any; // Store for pseudo-realtime updates
        callback({ val: () => mockDatabase.sensors });
      } else if (path === 'actuators') {
        actuatorListeners[path] = callback as any; // Store for pseudo-realtime updates
        callback({ val: () => mockDatabase.actuators });
      } else if (path.startsWith('users/') && path.endsWith('/role')) {
        const uid = path.split('/')[1];
        userRoleListeners[uid] = callback as any;
        callback({ val: () => mockDatabase.users[uid] ? {role: mockDatabase.users[uid].role} : null });
      } else if (path.startsWith('users/')) {
        const uid = path.split('/')[1];
        callback({ val: () => mockDatabase.users[uid] || null });
      }
    }, 100);

    return () => { // Unsubscribe function
      if (path === 'sensors') delete sensorListeners[path];
      if (path === 'actuators') delete actuatorListeners[path];
      if (path.startsWith('users/') && path.endsWith('/role')) {
        const uid = path.split('/')[1];
        delete userRoleListeners[uid];
      }
    };
  },
  set: async (dbRef: { path: string }, value: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const path = dbRef.path;
        if (path.startsWith('actuators/')) {
          const actuatorKey = path.split('/')[1] as ActuatorName;
          if (mockDatabase.actuators.hasOwnProperty(actuatorKey)) {
            (mockDatabase.actuators[actuatorKey] as 'on' | 'off') = value;
            // Notify actuator listeners
            Object.values(actuatorListeners).forEach(cb => cb(mockDatabase.actuators));
          }
        } else if (path.startsWith('users/')) {
          // Example: users/uid/role
          const parts = path.split('/');
          if (parts.length === 3 && mockDatabase.users[parts[1]]) {
            (mockDatabase.users[parts[1]] as any)[parts[2]] = value;
             // Notify specific user role listener
            if (parts[2] === 'role' && userRoleListeners[parts[1]]) {
                userRoleListeners[parts[1]]({role: value});
            }
          } else if (parts.length === 2) { // users/uid
            mockDatabase.users[parts[1]] = {...mockDatabase.users[parts[1]], ...value};
          }
        }
        resolve();
      }, 100);
    });
  },
  // Mock for fetching user role specifically
  getUserRole: async (uid: string): Promise<'admin' | 'user' | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDatabase.users[uid]?.role || null);
      }, 50);
    });
  }
};

// Simulate app initialization (not really needed for mock)
export const app = {
  name: '[mock]',
  options: {},
  automaticDataCollectionEnabled: false,
};

// Export a function to get sensor history (mocked)
export const getSensorHistory = async (days: number): Promise<Partial<SensorData>[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const history: Partial<SensorData>[] = [];
      for (let i = 0; i < days; i++) {
        history.push({
          temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // wider range for history
          humidity: Math.floor(40 + Math.random() * 50),
          soilMoisture: Math.floor(30 + Math.random() * 60),
          light: Math.floor(300 + Math.random() * 1200),
        });
      }
      resolve(history);
    }, 300);
  });
};
