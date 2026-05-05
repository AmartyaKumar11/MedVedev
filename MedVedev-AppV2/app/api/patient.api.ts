/**
 * Patient API — wraps GET /patients and GET /patients/:id/sessions
 *
 * Backend routes (from backend/app/routers/patients.py):
 *   GET /patients                    — returns { patients: [...] }
 *   GET /patients/:id/sessions        — returns { sessions: [...] }
 *
 * Auth: Bearer token required (injected automatically by the axios client).
 */

import client from './client';
import { USE_MOCK_API } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  created_at: string;
}

export interface PatientSession {
  session_id: string;
  created_at: string;
  pdf_url: string | null;
}

// ─── Fetch all patients for the logged-in doctor ──────────────────────────────

export async function fetchPatientsApi(): Promise<Patient[]> {
  if (USE_MOCK_API) {
    await delay(400);
    return [
      { id: '1', name: 'deepu james', created_at: '2026-04-01T00:00:00Z' },
      { id: '2', name: 'ravi kumar', created_at: '2026-03-28T00:00:00Z' },
    ];
  }

  const res = await client.get<{ patients: Patient[] }>('/patients');
  return res.data.patients;
}

// ─── Fetch all sessions for a specific patient ────────────────────────────────

export async function fetchPatientSessionsApi(patientId: string): Promise<PatientSession[]> {
  if (USE_MOCK_API) {
    await delay(300);
    return [
      { session_id: 's1', created_at: '2023-11-01T09:00:00Z', pdf_url: null },
      { session_id: 's2', created_at: '2023-11-05T10:30:00Z', pdf_url: null },
    ];
  }

  const res = await client.get<{ sessions: PatientSession[] }>(`/patients/${patientId}/sessions`);
  return res.data.sessions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
