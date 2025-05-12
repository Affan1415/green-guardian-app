
// This is a mock Firebase setup. In a real application, you would initialize Firebase App here.
// For demonstration purposes, we'll simulate Firebase behavior.

import type { UserProfile, FirebaseRootData, FullActuatorSchedule } from '@/types';

// Mock User Database
const mockUsers: Record<string, Omit<UserProfile, 'uid'>> = {
  'admin@agricontrol.com': { email: 'admin@agricontrol.com', role: 'admin', displayName: 'Admin User' },
  'user@agricontrol.com': { email: 'user@agricontrol.com', role: 'user', displayName: 'Regular User' },
};

const mockUserPasswords: Record<string, string> = {
  'admin@agricontrol.com': 'admin123',
  'user@agricontrol.com': 'user123',
}

// Mock Realtime Database with flat structure
let mockDatabase: FirebaseRootData & {
  users: Record<string, Omit<UserProfile, 'uid' | 'email'>>;
  schedules?: Record<string, Record<string, FullActuatorSchedule>>; // For schedule generator
} = {
  V1: 25.0, // Temperature
  V2: 60,   // Humidity
  V3: 50,   // Soil Moisture
  V4: 1000, // Light Intensity
  B2: "0",  // Bulb (0: OFF, 1: ON)
  B3: "0",  // Pump
  B4: "0",  // Fan
  B5: "0",  // Lid
  Mode: "0", // System Mode (0: Manual, 1: AI)
  users: { 
    'admin-uid': { role: 'admin', displayName: 'Admin User'},
    'user-uid': { role: 'user', displayName: 'Regular User'},
  }
};

// Simulate real-time updates for sensors (V keys)
if (typeof window !== 'undefined') { 
  setInterval(() => {
    mockDatabase.V1 = parseFloat((20 + Math.random() * 10).toFixed(1));
    mockDatabase.V2 = Math.floor(50 + Math.random() * 30);
    mockDatabase.V3 = Math.floor(40 + Math.random() * 40);
    mockDatabase.V4 = Math.floor(500 + Math.random() * 1000);
    
    // Notify root listeners
    if (rootListeners['/']) {
      rootListeners['/']({ val: () => ({ ...mockDatabase }) }); // Send a copy
    }
  }, 5000); 
}


// --- Mock Firebase Auth ---
let currentUser: UserProfile | null = null;
const authListeners: Array<(user: UserProfile | null) => void> = [];

export const auth = {
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    authListeners.push(callback);
    Promise.resolve().then(() => callback(currentUser)); 
    return () => { 
      const index = authListeners.indexOf(callback);
      if (index > -1) authListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (email: string, password?: string): Promise<{ user: UserProfile }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userDetails = mockUsers[email];
        if (userDetails && password && mockUserPasswords[email] === password) {
          const uid = email === 'admin@agricontrol.com' ? 'admin-uid' : 'user-uid';
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
const rootListeners: Record<string, (snapshot: { val: () => any }) => void> = {};
const userRoleListeners: Record<string, (data: {role: 'admin' | 'user'} | null) => void> = {}; // For user roles

export const database = {
  ref: (path: string) => ({ path }), 
  onValue: (
    dbRef: { path: string }, 
    callback: (snapshot: { val: () => any }) => void
  ) => {
    const path = dbRef.path;
    setTimeout(() => { 
      if (path === '/') { // Listener for the root
        rootListeners[path] = callback;
        callback({ val: () => ({ ...mockDatabase }) }); // Send a copy
      } else if (path.startsWith('users/') && path.endsWith('/role')) {
        const uid = path.split('/')[1];
        userRoleListeners[uid] = callback as any;
        callback({ val: () => mockDatabase.users[uid] ? {role: mockDatabase.users[uid].role} : null });
      } else if (path.startsWith('users/')) {
        const uid = path.split('/')[1];
        callback({ val: () => mockDatabase.users[uid] || null });
      } else {
        // For any other specific path, try to resolve it from mockDatabase
        const pathParts = path.split('/').filter(p => p);
        let data = mockDatabase as any;
        for (const part of pathParts) {
            if (data && typeof data === 'object' && data.hasOwnProperty(part)) {
                data = data[part];
            } else {
                data = null;
                break;
            }
        }
        callback({ val: () => data });
      }
    }, 100);

    return () => { 
      if (path === '/') delete rootListeners[path];
      if (path.startsWith('users/') && path.endsWith('/role')) {
        const uid = path.split('/')[1];
        delete userRoleListeners[uid];
      }
    };
  },
  set: async (dbRef: { path: string }, value: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pathKey = dbRef.path.startsWith('/') ? dbRef.path.substring(1) : dbRef.path;
        
        // Update root level keys directly
        if (mockDatabase.hasOwnProperty(pathKey)) {
          (mockDatabase as any)[pathKey] = value;
           // Notify root listeners if a root key changed
           if (rootListeners['/'] && (pathKey === 'Mode' || pathKey.startsWith('B'))) {
             rootListeners['/']({ val: () => ({ ...mockDatabase }) }); // Send a copy
           }
        } else if (pathKey.startsWith('users/')) {
          const parts = pathKey.split('/');
          if (parts.length === 3 && mockDatabase.users[parts[1]]) { // users/uid/role or users/uid/displayName
            (mockDatabase.users[parts[1]] as any)[parts[2]] = value;
            if (parts[2] === 'role' && userRoleListeners[parts[1]]) {
                userRoleListeners[parts[1]]({role: value});
            }
          } else if (parts.length === 2) { 
            mockDatabase.users[parts[1]] = {...(mockDatabase.users[parts[1]] || {}), ...value};
          }
        } else if (pathKey.startsWith('schedules/')) {
            const parts = pathKey.split('/'); // schedules/{uid}/today
            if (parts.length === 3) {
                const [, uid, day] = parts;
                if (!mockDatabase.schedules) mockDatabase.schedules = {};
                if (!mockDatabase.schedules[uid]) mockDatabase.schedules[uid] = {};
                mockDatabase.schedules[uid][day] = value;
            }
        }
        resolve();
      }, 100);
    });
  },
  getUserRole: async (uid: string): Promise<'admin' | 'user' | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDatabase.users[uid]?.role || null);
      }, 50);
    });
  }
};

export const app = {
  name: '[mock]',
  options: {},
  automaticDataCollectionEnabled: false,
};

// Updated to return Partial<FirebaseRootData> with new keys
export const getSensorHistory = async (days: number): Promise<Partial<FirebaseRootData>[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const history: Partial<FirebaseRootData>[] = [];
      for (let i = 0; i < days; i++) {
        history.push({
          V1: parseFloat((15 + Math.random() * 20).toFixed(1)), // Temperature
          V2: Math.floor(30 + Math.random() * 60),          // Humidity
          V3: Math.floor(20 + Math.random() * 70),          // SoilMoisture
          V4: Math.floor(200 + Math.random() * 1300),         // Light
        });
      }
      resolve(history);
    }, 300);
  });
};
