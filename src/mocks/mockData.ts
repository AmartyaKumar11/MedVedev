import { Doctor, Session, TranscriptSegment, SOAPNote, SpeakerProfile, Patient } from '../types';

export const MOCK_PATIENTS: Patient[] = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Sarah Smith' },
  { id: 3, name: 'Michael Lee' },
];

export const MOCK_DOCTOR: Doctor = {
  id: 'doc-001',
  name: 'Dr. Arjun Sharma',
  email: 'arjun.sharma@clinic.com',
};

export const MOCK_SPEAKERS: SpeakerProfile[] = [
  { id: 'spk-001', doctorId: 'doc-001', name: 'Dr. Sharma', sampleCount: 3 },
  { id: 'spk-002', doctorId: 'doc-001', name: 'Patient Ravi', sampleCount: 2 },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-001',
    doctorId: 'doc-001',
    startedAt: '2026-03-11T09:00:00Z',
    endedAt: '2026-03-11T09:15:00Z',
    durationSeconds: 900,
  },
  {
    id: 'sess-002',
    doctorId: 'doc-001',
    startedAt: '2026-03-10T14:30:00Z',
    endedAt: '2026-03-10T14:45:00Z',
    durationSeconds: 900,
  },
];

export const MOCK_TRANSCRIPT: TranscriptSegment[] = [
  {
    id: 'seg-001',
    sessionId: 'sess-001',
    speaker: 'DOCTOR',
    text: 'Good morning. What brings you in today?',
    startTime: 0.0,
    endTime: 3.2,
    confidence: 0.92,
  },
  {
    id: 'seg-002',
    sessionId: 'sess-001',
    speaker: 'PATIENT',
    text: 'Pet mein bahut dard ho raha hai, subah se.',
    startTime: 3.5,
    endTime: 7.0,
    confidence: 0.87,
  },
  {
    id: 'seg-003',
    sessionId: 'sess-001',
    speaker: 'DOCTOR',
    text: 'Since how long? Is it constant or intermittent?',
    startTime: 7.5,
    endTime: 10.8,
    confidence: 0.95,
  },
  {
    id: 'seg-004',
    sessionId: 'sess-001',
    speaker: 'PATIENT',
    text: 'Subah se hai, thoda gudgud jaisa feel ho raha hai.',
    startTime: 11.0,
    endTime: 15.0,
    confidence: 0.83,
  },
];

export const MOCK_SOAP: SOAPNote = {
  sessionId: 'sess-001',
  subjective:
    'Patient presents with abdominal discomfort (pet mein dard) since morning. Describes sensation as rumbling/gurgling (gudgud jaisa). Duration: since this morning.',
  objective: 'No objective findings recorded in this session.',
  assessment: 'Likely abdominal discomfort, possibly gastritis or digestive upset.',
  plan: 'Further examination required. Consider antacids if symptoms persist.',
};
