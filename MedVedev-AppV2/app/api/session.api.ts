/**
 * Session / Consultation API — wraps POST /session/process
 *
 * Backend route (from backend/app/routers/session.py):
 *   POST /session/process  — multipart: { file (audio), patient_name }
 *                          → { conversation, soap, pdf_url }
 *
 * Auth: Bearer token required (injected automatically by the axios client).
 *
 * Usage in ConsultationScreen:
 *   1. Record audio with expo-av → get a local file URI
 *   2. Call processSessionApi(audioUri, patientName)
 *   3. Display conversation[] in the Transcript panel
 *   4. Display soap in the SOAP Note panel
 *   5. pdf_url is a path like "/reports/abc.pdf" — prepend API_BASE_URL to open
 */

import client from './client';
import { API_BASE_URL, USE_MOCK_API } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationLine {
  speaker: string;  // e.g. "DOCTOR" | "PATIENT" | "UNKNOWN"
  text: string;
  start?: number;
  end?: number;
}

export interface SoapNote {
  subjective?: any;
  objective?: any;
  assessment?: any;
  plan?: any;
  error?: string;
  [key: string]: any;
}

export interface SessionResult {
  conversation: ConversationLine[];
  soap: SoapNote;
  pdf_url: string;      // relative path, e.g. "/reports/abc.pdf"
  pdf_full_url: string; // absolute URL ready for Linking.openURL()
}

// ─── Process a full consultation recording ────────────────────────────────────

/**
 * Upload a recorded audio file + patient name to the pipeline.
 * The backend runs Whisper + speaker diarization + SOAP generation.
 *
 * @param audioUri   Local file URI from expo-av (e.g. file:///data/.../recording.m4a)
 * @param patientName  Name of the patient for this session
 */
export async function processSessionApi(
  audioUri: string,
  patientName: string
): Promise<SessionResult> {
  if (USE_MOCK_API) {
    await delay(2000);
    return {
      conversation: [
        { speaker: 'DOCTOR', text: 'Hello, how have you been feeling since the last checkup?' },
        { speaker: 'PATIENT', text: 'A bit of chest tightness in the mornings.' },
        { speaker: 'DOCTOR', text: 'Any shortness of breath or palpitations?' },
        { speaker: 'PATIENT', text: 'No, just the tightness.' },
      ],
      soap: {
        subjective: 'Patient reports mild chest tightness in the mornings.',
        objective: 'No shortness of breath or palpitations reported.',
        assessment: 'Likely low-risk non-cardiac chest discomfort.',
        plan: 'Monitor symptoms, follow-up in 2 weeks.',
      },
      pdf_url: '/reports/mock_report.pdf',
      pdf_full_url: `${API_BASE_URL}/reports/mock_report.pdf`,
    };
  }

  const formData = new FormData();
  formData.append('patient_name', patientName.trim());
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'consultation.m4a',
  } as unknown as Blob);

  const res = await client.post<{
    conversation: ConversationLine[];
    soap: SoapNote;
    pdf_url: string;
  }>('/session/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Processing can take a while — give the backend up to 5 minutes
    timeout: 300_000,
  });

  return {
    ...res.data,
    pdf_full_url: `${API_BASE_URL}${res.data.pdf_url}`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
