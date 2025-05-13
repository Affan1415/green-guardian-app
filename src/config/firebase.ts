import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if needed
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  child,
  query,
  orderByChild,
  startAt,
  endAt, // Added for potential future use, though not strictly needed with current client filter
  limitToLast, // Added for potential future use
  type DatabaseReference,
  type DataSnapshot,
} from "firebase/database";
import type { UserProfile, FirebaseRootData, HistoricalDataPoint } from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let authInstance: ReturnType<typeof getAuth>;
let dbInstance: ReturnType<typeof getDatabase>;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  authInstance = getAuth(app);
  dbInstance = getDatabase(app);
  // analytics = getAnalytics(app); // Uncomment if needed
}

export const auth = {
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    if (!authInstance) {
      console.warn("Auth instance not available for onAuthStateChanged");
      callback(null);
      return () => {}; 
    }
    return onAuthStateChanged(authInstance, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDbRef = ref(dbInstance, `users/${firebaseUser.uid}`);
          const userSnapshot = await get(userDbRef);
          
          let role: 'admin' | 'user' = 'user';
          let displayName = firebaseUser.displayName || firebaseUser.email;

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            role = userData.role || 'user';
            displayName = userData.displayName || displayName;
          } else {
            await set(userDbRef, {
              email: firebaseUser.email,
              displayName: displayName,
              role: 'user'
            });
          }

          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: displayName,
            role: role,
          };
          callback(userProfile);
        } catch (error) {
          console.error("Error fetching user details from DB:", error);
          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: 'user', 
          };
          callback(userProfile);
        }
      } else {
        callback(null);
      }
    });
  },

  signInWithEmailAndPassword: async (email: string, password?: string): Promise<{ user: UserProfile }> => {
    if (!authInstance || !dbInstance) throw new Error("Firebase not initialized");
    if (!password) throw new Error("Password is required.");
    
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const firebaseUser = userCredential.user;

    const userDbRef = ref(dbInstance, `users/${firebaseUser.uid}`);
    const userSnapshot = await get(userDbRef);
    let role: 'admin' | 'user' = 'user';
    let displayName = firebaseUser.displayName || firebaseUser.email;

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      role = userData.role || 'user';
      displayName = userData.displayName || displayName;
    }
    
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      role: role,
    };
    return { user: profile };
  },

  createUserWithEmailAndPassword: async (email: string, password?: string): Promise<{ user: UserProfile }> => {
    if (!authInstance || !dbInstance) throw new Error("Firebase not initialized");
    if (!password) throw new Error("Password is required for signup.");
    
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const firebaseUser = userCredential.user;
    
    if (!firebaseUser.displayName) {
        await updateProfile(firebaseUser, { displayName: email.split('@')[0] });
    }

    const userProfileData = {
      email: firebaseUser.email,
      displayName: email.split('@')[0], 
      role: 'user' as const 
    };
    await set(ref(dbInstance, `users/${firebaseUser.uid}`), userProfileData);
    
    const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userProfileData.displayName,
        role: userProfileData.role,
    };
    return { user: profile };
  },

  signOut: async (): Promise<void> => {
    if (!authInstance) throw new Error("Firebase not initialized");
    await firebaseSignOut(authInstance);
  },

  getCurrentUser: (): FirebaseUser | null => {
    if (!authInstance) return null;
    return authInstance.currentUser;
  },
};

export const database = {
  ref: (path: string): DatabaseReference => {
    if (!dbInstance) throw new Error("Firebase Database not initialized");
    return ref(dbInstance, path);
  },
  onValue: (
    dbRef: DatabaseReference, 
    callback: (snapshot: DataSnapshot) => void,
    errorCallback?: (error: Error) => void
  ) => {
    if (!dbInstance) throw new Error("Firebase Database not initialized");
    return onValue(dbRef, callback, errorCallback);
  },
  set: async (dbRef: DatabaseReference, value: any): Promise<void> => {
    if (!dbInstance) throw new Error("Firebase Database not initialized");
    await set(dbRef, value);
  },
  getUserRole: async (uid: string): Promise<'admin' | 'user' | null> => {
    if (!dbInstance) throw new Error("Firebase Database not initialized");
    try {
      const roleSnapshot = await get(child(ref(dbInstance, 'users'), `${uid}/role`));
      if (roleSnapshot.exists()) {
        return roleSnapshot.val();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user role from DB:", error);
      return null;
    }
  }
};

export { app as firebaseApp };

/**
 * Fetches sensor log data from Firebase Realtime Database for the specified number of past days.
 * Example structure for `sensor_logs` in Firebase:
 * "sensor_logs": {
 *   "<unique_log_id_1>": {
 *     "timestamp": 1678886400000, // Unix timestamp (milliseconds)
 *     "V1": 25, // Temperature
 *     "V2": 60, // Humidity
 *     "V3": 50, // Soil Moisture
 *     "V4": 5000 // Light Intensity
 *   },
 *   // ... more entries
 * }
 * Note: For optimal performance and to enforce data retention (e.g., only keep last 7 days),
 * consider using Firebase Cloud Functions to periodically prune old data from `sensor_logs`.
 * This client-side function only fetches data, it does not manage data retention in the database.
 */
export const getSensorHistory = async (daysToFetch: number): Promise<HistoricalDataPoint[]> => {
  if (!dbInstance) {
    console.warn("Firebase DB not initialized for getSensorHistory. Returning empty array.");
    return [];
  }

  try {
    const logsRef = ref(dbInstance, 'sensor_logs');
    const endTimestamp = Date.now();
    const startTimestamp = endTimestamp - (daysToFetch * 24 * 60 * 60 * 1000);

    // Query to get data within the time range, ordered by timestamp.
    // Fetches data from startTimestamp up to the current time.
    // If you have a very large number of logs, consider adding limitToLast()
    // in conjunction with orderByChild, but ensure your data is indexed correctly.
    const dataQuery = query(logsRef, orderByChild('timestamp'), startAt(startTimestamp));
    
    const snapshot = await get(dataQuery);
    const history: HistoricalDataPoint[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const log = childSnapshot.val();
        // Basic validation
        if (log && typeof log === 'object' && typeof log.timestamp === 'number' && log.timestamp <= endTimestamp) {
          history.push({
            timestamp: log.timestamp,
            V1: typeof log.V1 === 'number' ? log.V1 : undefined,
            V2: typeof log.V2 === 'number' ? log.V2 : undefined,
            V3: typeof log.V3 === 'number' ? log.V3 : undefined,
            V4: typeof log.V4 === 'number' ? log.V4 : undefined,
          });
        }
      });
    }
    
    console.log(`Fetched ${history.length} historical data points for the last ${daysToFetch} days from 'sensor_logs'.`);
    // Data is already ordered by timestamp due to the Firebase query.
    return history;
  } catch (error) {
    console.error("Error fetching historical data from 'sensor_logs':", error);
    return []; 
  }
};
