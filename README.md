
# Green Guardian

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Historical Data Module

The historical data page (`/historical-data`) visualizes sensor readings over time.

### Populating Dummy Data for `sensor_logs`

To see data in the historical charts, you'll need to populate the `sensor_logs` path in your Firebase Realtime Database.

**Data Structure:**

Your `sensor_logs` path should contain multiple entries, each with a unique ID (Firebase push keys are good for this). Each entry represents a sensor reading at a specific time:

```json
{
  "sensor_logs": {
    "-MyLogEntry1": {
      "timestamp": 1678886400000, 
      "V1": 25.5,           
      "V2": 60.1,           
      "V3": 50.3,           
      "V4": 5100            
    },
    "-MyLogEntry2": {
      "timestamp": 1678887300000, 
      "V1": 25.6,
      "V2": 59.8,
      "V3": 49.9,
      "V4": 5200
    }
    // ... more entries
  }
}
```

*   `timestamp`: Unix timestamp in milliseconds.
*   `V1`: Temperature (number)
*   `V2`: Humidity (number)
*   `V3`: Soil Moisture (number)
*   `V4`: Light Intensity (number)

**Generating Timestamps:**

You can generate timestamps for the past 7 days, with entries every 15 minutes. For example, using JavaScript:

```javascript
const now = Date.now();
const fifteenMinutesInMillis = 15 * 60 * 1000;
const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
const startTime = now - sevenDaysInMillis;

let currentTime = startTime;
while (currentTime <= now) {
  // Create a log entry with 'currentTime' as the timestamp
  // and random or patterned sensor values.
  // console.log(new Date(currentTime).toISOString()); 
  currentTime += fifteenMinutesInMillis;
}
```

You can use the Firebase Console to manually add a few entries or write a small Node.js script using the Firebase Admin SDK to populate a larger set of dummy data. A sample `dummy-sensor-logs.json` file is provided in the project root which contains a small set of example data points. You can import this JSON directly into your Firebase Realtime Database at the `sensor_logs` path.

### **Important: Indexing `sensor_logs` for Queries**

To enable efficient querying of historical sensor data by timestamp, you **must** add an index to your Firebase Realtime Database rules. Without this index, queries like the one used in `getSensorHistory` will fail or be very inefficient.

**How to Add the Index:**

1.  Go to your Firebase Project Console.
2.  Navigate to **Realtime Database**.
3.  Select the **Rules** tab.
4.  Update your rules JSON to include an index on `timestamp` for the `sensor_logs` path. It should look similar to this:

    ```json
    {
      "rules": {
        // ... your existing rules ...
        "users": {
          // ... your user rules ...
        },
        "schedules": {
            // ... your schedule rules ...
        },
        "sensor_logs": {
          ".read": "auth != null", // Or your preferred read access rule
          ".write": "auth != null", // Or your preferred write access rule
          ".indexOn": "timestamp" // This is the crucial line to add or ensure exists
        },
        // ... other root level data rules if any ...
        "B2": { // Example rule for an actuator
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "B3": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "B4": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "B5": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "Mode": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "V1": {
           ".read": "auth != null",
           ".write": "auth != null" // Typically sensors only write, but read for dashboard
        },
        "V2": {
           ".read": "auth != null",
           ".write": "auth != null"
        },
        "V3": {
           ".read": "auth != null",
           ".write": "auth != null"
        },
        "V4": {
           ".read": "auth != null",
           ".write": "auth != null"
        }
      }
    }
    ```

5.  **Publish** your updated rules.

Failure to add this index will result in errors like "Index not defined" when the application tries to fetch historical data.

### Data Retention in Firebase

The client application (Green Guardian dashboard) is configured to fetch and display data for up to the last 7 days. However, **the client application itself does not delete old data from your Firebase Realtime Database.**

To automatically remove data older than 7 days from the `sensor_logs` path, you need to implement a server-side solution, typically using **Firebase Cloud Functions**. You would write a Cloud Function that:
1.  Is triggered on a schedule (e.g., daily using a Pub/Sub trigger).
2.  Queries the `sensor_logs` path for entries with a `timestamp` older than 7 days.
3.  Deletes these old entries.

This ensures your database doesn't grow indefinitely with old sensor logs.

deploying

```
