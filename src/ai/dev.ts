import { config } from 'dotenv';
config();

import '@/ai/flows/generate-irrigation-schedule.ts';
import '@/ai/flows/generate-actuator-schedule.ts';
import '@/ai/flows/coriander-support-chat-flow.ts';
import '@/ai/flows/predict-pest-disease-flow.ts';
