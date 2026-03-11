export interface Doctor {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  doctorId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SOAPNote {
  sessionId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface SpeakerProfile {
  id: string;
  doctorId: string;
  name: string;
  sampleCount: number;
}

export interface Patient {
  id: number;
  name: string;
}

export interface Recording {
  id: string;
  patientId: number;
  name: string;        // e.g. "Jane Doe 1"
  audioUri: string;
  createdAt: string;
  durationMs: number;
}

export type PatientsStackParamList = {
  PatientList: undefined;
  PatientDetail: { patientId: number; patientName: string };
  RecordReport: { patientId: number; patientName: string };
  ViewReports: { patientId: number; patientName: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Patients: undefined;
  Dashboard: undefined;
  Sessions: undefined;
  Settings: undefined;
};

export type SessionsStackParamList = {
  SessionHistory: undefined;
  SessionDetail: { sessionId: string };
};
