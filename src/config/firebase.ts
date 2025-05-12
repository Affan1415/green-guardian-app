
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
      // This case should ideally not happen in client-side usage after initialization
      console.warn("Auth instance not available for onAuthStateChanged");
      callback(null);
      return () => {}; // Return an empty unsubscribe function
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
            // If user record doesn't exist in DB (e.g., first login after manual creation in Auth console)
            // Create a basic record.
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
          // Fallback to basic user profile if DB fetch fails
          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: 'user', // Default role on error
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

    // Fetch role and display name from DB as onAuthStateChanged would
    const userDbRef = ref(dbInstance, `users/${firebaseUser.uid}`);
    const userSnapshot = await get(userDbRef);
    let role: 'admin' | 'user' = 'user';
    let displayName = firebaseUser.displayName || firebaseUser.email;

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      role = userData.role || 'user';
      displayName = userData.displayName || displayName;
    }
    // No need to create profile here, onAuthStateChanged handles it or it already exists

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
    
    // Set initial displayName in Firebase Auth if not already set (usually isn't on creation)
    if (!firebaseUser.displayName) {
        await updateProfile(firebaseUser, { displayName: email.split('@')[0] });
    }

    const userProfileData = {
      email: firebaseUser.email,
      displayName: email.split('@')[0], // Use part of email as default displayName
      role: 'user' as const // Default role for new signups
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

// This is the initialized Firebase app instance, if needed elsewhere.
export { app as firebaseApp };


// Mock function for sensor history
export const getSensorHistory = async (days: number): Promise<HistoricalDataPoint[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const history: HistoricalDataPoint[] = [];
      const now = new Date();
      for (let i = 0; i < days; i++) {
        const pastDate = new Date(now);
        // Iterate from `days - 1` down to `0` to get days in chronological order for the chart
        pastDate.setDate(now.getDate() - (days - 1 - i)); 
        pastDate.setHours(12, 0, 0, 0); // Set to noon for consistency

        history.push({
          timestamp: pastDate.getTime(),
          V1: parseFloat((15 + Math.random() * 20).toFixed(1)), // Temperature (15-35°C)
          V2: Math.floor(30 + Math.random() * 60),          // Humidity (30-90%)
          V3: Math.floor(20 + Math.random() * 70),          // SoilMoisture (20-90%)
          V4: Math.floor(2000 + Math.random() * 8000),        // Light (2000-10000 lux)
        });
      }
      resolve(history);
    }, 300);
  });
};
