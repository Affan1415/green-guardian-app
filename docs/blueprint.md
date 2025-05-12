# **App Name**: AgriControl

## Core Features:

- Sensor Data Display: Display real-time sensor data (temperature, humidity, soil moisture, light) fetched from Firebase Realtime Database.
- Actuator Control: Display actuator status (fan, water pump, lid motor, bulb) and provide toggle buttons for admins to control them.
- Role-Based Access Control: Implement role-based access control (admin/user) using Firebase Authentication to restrict actuator control to admins only.
- Irrigation Schedule Generation: Collect and preprocess 7-day sensor data to detect average daily moisture drop and weather trends, using dummy weather data, send prompt to LLM tool with the gathered data and format the 7-day schedule suggestion into a user-friendly display.
- Dashboard UI: Responsive grid layout for displaying sensor and actuator modules, along with a top bar for logout and user role information.

## Style Guidelines:

- Primary color: Dark green (#1B5E20) to reflect agriculture.
- Secondary color: Light green (#C8E6C9) for backgrounds and accents.
- Accent: Earthy Brown (#A1887F) for a natural feel.
- Clean and readable sans-serif font for data display.
- Use simple and clear icons to represent sensors and actuators.
- Use a responsive grid layout to accommodate different screen sizes.