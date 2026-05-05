/**
 * Auth API — wraps POST /doctor/login and POST /doctor/enroll
 *
 * Backend routes (from backend/app/routers/doctor.py):
 *   POST /doctor/login   — form: { name, password }  → { access_token, token_type }
 *   POST /doctor/enroll  — form: { name, password, audio1, audio2, audio3 }
 */

import client from './client';
import { USE_MOCK_API } from './config';
import { clearToken, setToken } from './tokenStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  access_token: string;
  token_type: string;
  doctor_id: string;
  name: string;
}

export interface EnrollResult {
  doctor_id: string;
  message: string;
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Login with doctor name + password.
 * Stores the JWT in tokenStore so the axios client attaches it automatically.
 *
 * @returns doctor_id and name for use in the UI
 */
export async function loginApi(name: string, password: string): Promise<LoginResult> {
  if (USE_MOCK_API) {
    // Mock: accept any non-empty credentials
    await delay(600);
    const mock: LoginResult = {
      access_token: 'mock-token-123',
      token_type: 'bearer',
      doctor_id: 'mock-doc-001',
      name,
    };
    await setToken(mock.access_token, mock.doctor_id, mock.name);
    return mock;
  }

  // The backend uses form-encoded data for login (not JSON)
  const params = new URLSearchParams();
  params.append('name', name.trim());
  params.append('password', password);

  const res = await client.post<{ access_token: string; token_type: string }>(
    '/doctor/login',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  // The backend only returns access_token + token_type.
  // We store the doctor's name from what the user typed (already validated by backend).
  const result: LoginResult = {
    access_token: res.data.access_token,
    token_type: res.data.token_type,
    doctor_id: '', // populated after decode — see note below
    name: name.trim(),
  };

  // Store; doctor_id can be extracted from the JWT by the backend on every
  // subsequent request via get_current_doctor dependency.
  await setToken(result.access_token, result.doctor_id, result.name);
  return result;
}

// ─── Enroll (Register) ────────────────────────────────────────────────────────

/**
 * Enroll a new doctor with voice samples.
 *
 * audioUris: array of 3 local file URIs (from expo-av / file picker).
 */
export async function enrollDoctorApi(
  name: string,
  password: string,
  audioUris: [string, string, string]
): Promise<EnrollResult> {
  if (USE_MOCK_API) {
    await delay(1200);
    return { doctor_id: 'mock-doc-' + Date.now(), message: 'Enrollment successful' };
  }

  const formData = new FormData();
  formData.append('name', name.trim());
  formData.append('password', password);

  const audioKeys = ['audio1', 'audio2', 'audio3'] as const;
  audioUris.forEach((uri, i) => {
    formData.append(audioKeys[i], {
      uri,
      type: 'audio/m4a',
      name: `sample_${i + 1}.m4a`,
    } as unknown as Blob);
  });

  const res = await client.post<EnrollResult>('/doctor/enroll', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/** Clear the stored token. No backend call needed. */
export async function logoutApi(): Promise<void> {
  await clearToken();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
