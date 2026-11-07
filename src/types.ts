export type BodyArea = 'face' | 'hands' | 'elbows' | 'knees' | 'torso' | 'other';

export type FlareRisk = 'Low' | 'Medium' | 'High';

export type ProductType = 'moisturizer' | 'prescribed cream' | 'soap' | 'other';

export type ProductAmount = 'small dab' | 'medium dab' | 'large dab' | '½ FTU' | '1 FTU' | '2 FTU';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  reminderTime: string; // e.g. "19:30" (7:30 PM bath time)
  calmPlan: {
    moisturizerRoutine: string;
    prescribedRoutine: string;
    bathRoutine: string;
    knownTriggers: string[];
    doctorName?: string;
  };
}

export interface AiSkinAnalysis {
  description: string;
  rednessScore: number; // 0 - 3
  swellingScore: number; // 0 - 3
  scratchScore: number; // 0 - 3
  overallStatus: 'green' | 'yellow' | 'red';
  redFlagsDetected: boolean;
  redFlagReason?: string | null;
  disclaimer: string;
}

export interface CheckIn {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Nov 6"
  timestamp: number;
  bodyArea: BodyArea;
  photoUrl: string; // base64 or SVG data URI
  itchScore: number; // 1 to 5
  tags: string[]; // 'New product', 'New food', 'Bad night', etc.
  productUsed?: {
    name: string;
    amount: ProductAmount;
  };
  calmPlanDone: boolean;
  skinScore: number; // 0 to 100 (100 = clear, 0 = severe flare)
  aiAnalysis?: AiSkinAnalysis;
  notes?: string;
}

export interface ProductTrial {
  id: string;
  childId: string;
  name: string;
  type: ProductType;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  durationDays: number;
  status: 'active' | 'completed';
  verdict?: 'Helped' | 'No clear change' | 'Worse';
  baselineScore: number;
  endScore?: number;
  bestPhotoUrl?: string;
  worstPhotoUrl?: string;
  daysLogged: number;
  avgAmount: string;
  notes?: string;
}

export interface WeatherDay {
  date: string;
  dayName: string;
  tempMaxC: number;
  tempMinC: number;
  humidityPercent: number;
  precipitationMm: number;
  conditionIcon: 'sun' | 'cloud' | 'rain' | 'wind';
  riskLevel: FlareRisk;
  riskReason: string;
}

export interface IndoorSensorData {
  tempC: number;
  humidityPercent: number;
  status: 'Ideal' | 'Dry Air Alert' | 'Too Humid';
  message: string;
  roomName: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  type: 'reminder' | 'warning' | 'summary' | 'milestone';
}

export interface TrustedTip {
  id: string;
  category: 'weather' | 'routine' | 'photo' | 'myth' | 'food';
  title: string;
  content: string; // Under 40 words
  sourceHint?: string;
}
