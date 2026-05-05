# MedVedev Mobile App — API Integration Guide

This document maps every point in the app where a real backend API call is needed, what data is sent, what is expected back, and which file/function needs to be updated. All calls currently use mock data controlled by `USE_MOCK_API: true` in `src/constants/config.ts`.

Set `USE_MOCK_API: false` and point `API_BASE_URL` to your server to switch to real calls.

```
// src/constants/config.ts
API_BASE_URL: 'http://10.0.2.2:8000'   // Android emulator → localhost
API_BASE_URL: 'https://api.yourserver.com'  // Production
```

The axios client at `src/api/client.ts` handles:
- Base URL and 30-second timeout
- Automatic `Authorization: Bearer <token>` header injection
- Auto-logout when the server returns 401

---

## Table of Contents

1. [Auth — Login & Register](#1-auth--login--register)
2. [Recording → Whisper Transcription](#2-recording--whisper-transcription)
3. [Patient Management](#3-patient-management)
4. [Speaker Voice Enrollment](#4-speaker-voice-enrollment)
5. [Session Lifecycle](#5-session-lifecycle)
6. [Transcript & SOAP Note Retrieval](#6-transcript--soap-note-retrieval)
7. [End-to-End Flow Diagram](#7-end-to-end-flow-diagram)
8. [Switching from Mock to Real](#8-switching-from-mock-to-real)

---

## 1. Auth — Login & Register

**File:** `src/api/auth.api.ts`

### POST `/auth/login`

Called when the doctor taps **Login**.

**Request body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "secret"
}
```

**Expected response:**
```json
{
  "doctor": {
    "id": "doc-001",
    "name": "Dr. Arjun Sharma",
    "email": "doctor@clinic.com"
  },
  "token": "eyJhbGci..."
}
```

The token is stored in `authStore` and attached to every subsequent request via the axios interceptor.

---

### POST `/auth/register`

Called when the doctor submits the **Register** form.

**Request body:**
```json
{
  "name": "Dr. Priya Mehta",
  "email": "priya@clinic.com",
  "password": "secret"
}
```

**Expected response:** Same shape as login.

---

## 2. Recording → Whisper Transcription

This is the **primary integration point**. After a doctor records a voice report for a patient, that audio file must be uploaded to the backend, processed by Whisper, and a transcript returned.

### Current app flow (mock)

```
RecordReportScreen
  └── Stop mic
  └── Save tapped
        └── patientStore.addRecording(patientId, 'mock://...', durationMs)
        └── Recording saved locally with name "Jane Doe 1"
```

### Real flow needed

```
RecordReportScreen
  └── Stop mic  (audioUri = real file path on device)
  └── Save tapped
        └── POST /recording/upload   ← upload audio + patient context
        └── Backend runs Whisper     ← transcription (async or sync)
        └── Receive back transcript + recordingId
        └── patientStore.addRecording(patientId, audioUri, durationMs, recordingId)
```

### POST `/recording/upload`

**Where to add it:** `src/api/` — create a new file `recording.api.ts`

**Request (multipart/form-data):**
```
audio       File      The .m4a / .wav audio file recorded on device
patientId   number    Which patient this report belongs to
doctorId    string    The logged-in doctor's ID
language    string    "auto" | "en" | "hi"  (from settingsStore)
model       string    "tiny" | "base" | "small" | "medium" | "large" (from settingsStore)
```

**How to build the FormData in React Native:**
```ts
// src/api/recording.api.ts  (to be created)
import client from './client';
import { Config } from '../constants/config';

export async function uploadRecordingApi(
  patientId: number,
  doctorId: string,
  audioUri: string,
  language: string,
  model: string
) {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 1200));
    return { recordingId: `rec-${Date.now()}`, transcript: 'Mock transcript text.' };
  }

  const formData = new FormData();
  formData.append('patientId', String(patientId));
  formData.append('doctorId', doctorId);
  formData.append('language', language);
  formData.append('model', model);
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);

  const res = await client.post('/recording/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { recordingId, transcript }
}
```

**Expected response:**
```json
{
  "recordingId": "rec-abc123",
  "transcript": "Patient reports abdominal pain since this morning...",
  "durationMs": 12400,
  "language": "en"
}
```

**Where to call it:** `src/screens/patients/RecordReportScreen.tsx` — inside the `handleSave` function, right after the recording is stopped and before `addRecording()` is called.

```ts
// RecordReportScreen.tsx — handleSave (replace the addRecording call)
const result = await uploadRecordingApi(patientId, doctor.id, audioUri, language, model);
addRecording(patientId, audioUri, durationMs, result.recordingId);
// Optionally store result.transcript in a transcriptStore
```

---

### Optional: Streaming Audio Chunks (Live Transcription)

If you want real-time transcription during recording (like the original Streamlit version), audio can be chunked and streamed.

**Config value:** `AUDIO_CHUNK_DURATION_MS: 3000` (chunk every 3 seconds)

**Endpoint:** `POST /audio/chunk`

**Request per chunk:**
```
sessionId   string   Active session ID
chunk       File     3-second audio blob
chunkIndex  number   Sequence number (0, 1, 2, ...)
```

**Expected response per chunk:**
```json
{
  "segments": [
    {
      "speaker": "DOCTOR",
      "text": "What brings you in today?",
      "startTime": 0.0,
      "endTime": 2.8,
      "confidence": 0.93
    }
  ]
}
```

Each returned segment should be passed to `sessionStore.appendSegment()` to display live in the transcript feed.

---

## 3. Patient Management

**Current state:** Patients live entirely in `patientStore` (in-memory Zustand store, initialized from `MOCK_PATIENTS`). There is no `patient.api.ts` file yet.

Create `src/api/patient.api.ts` with the following endpoints:

### GET `/patient`

Fetch all patients belonging to the logged-in doctor.

**Called from:** `PatientListScreen.tsx` — on mount, to load the real patient list instead of MOCK_PATIENTS.

**Expected response:**
```json
[
  { "id": 1, "name": "John Doe" },
  { "id": 2, "name": "Sarah Smith" }
]
```

### POST `/patient`

Create a new patient when the doctor taps **Enroll Patient** and submits a name.

**Called from:** `PatientListScreen.tsx` — inside the `handleEnroll` function.

**Request body:**
```json
{ "name": "Jane Doe" }
```

**Expected response:**
```json
{ "id": 4, "name": "Jane Doe" }
```

The returned `id` should replace the locally auto-incremented ID in `addPatient()`.

### GET `/patient/{id}/recordings`

Fetch all saved recordings for a specific patient.

**Called from:** `ViewReportsScreen.tsx` — on mount, to load real recordings instead of the in-memory store.

**Expected response:**
```json
[
  {
    "id": "rec-001",
    "patientId": 1,
    "name": "John Doe 1",
    "audioUri": "https://storage.yourserver.com/recordings/rec-001.m4a",
    "createdAt": "2026-03-11T09:05:00Z",
    "durationMs": 12400
  }
]
```

---

## 4. Speaker Voice Enrollment

**File:** `src/api/enrollment.api.ts` ← already exists

### GET `/doctor/speakers`

Returns all voice profiles enrolled under the logged-in doctor.

**Called from:** `DashboardScreen.tsx` to show "Enrolled Speakers" cards.

**Expected response:**
```json
[
  { "id": "spk-001", "doctorId": "doc-001", "name": "Dr. Sharma", "sampleCount": 3 },
  { "id": "spk-002", "doctorId": "doc-001", "name": "Patient Ravi", "sampleCount": 2 }
]
```

### POST `/doctor/enroll-voice`

Upload a voice sample for speaker diarization — so Whisper/pyannote knows who is DOCTOR vs PATIENT in future recordings.

**Called from:** No screen wired to this yet. When you add an enrollment screen, call `enrollVoiceApi(name, audioUri)`.

**Config value:** `ENROLL_DURATION_SECONDS: 5` — recording should be exactly 5 seconds.

**Request (multipart/form-data):**
```
name    string   Speaker label, e.g. "Dr. Sharma" or "Patient Ravi"
audio   File     5-second .wav voice sample
```

**Expected response:**
```json
{
  "id": "spk-003",
  "doctorId": "doc-001",
  "name": "Patient Ravi",
  "sampleCount": 1
}
```

---

## 5. Session Lifecycle

**File:** `src/api/session.api.ts` ← already exists

Sessions represent a full consultation (not a per-patient recording). These are used by the **Sessions tab**.

### POST `/session/start`

Called when a new consultation session begins.

**Request body:**
```json
{ "doctorId": "doc-001" }
```

**Expected response:**
```json
{
  "id": "sess-003",
  "doctorId": "doc-001",
  "startedAt": "2026-03-11T10:00:00Z"
}
```

The `id` is stored in `sessionStore.activeSession` and sent with every audio chunk.

### POST `/session/{id}/finalize`

Called when the consultation ends.

**Expected response:**
```json
{
  "id": "sess-003",
  "doctorId": "doc-001",
  "startedAt": "2026-03-11T10:00:00Z",
  "endedAt": "2026-03-11T10:22:00Z",
  "durationSeconds": 1320
}
```

### GET `/session`

Fetches all past sessions for the logged-in doctor.

**Called from:** `SessionHistoryScreen.tsx` — loaded by `sessionStore` on mount.

**Expected response:** Array of session objects (same shape as above).

---

## 6. Transcript & SOAP Note Retrieval

**File:** `src/api/transcript.api.ts` ← already exists

### GET `/transcript/{sessionId}`

Returns all transcript segments for a session.

**Called from:** `SessionDetailScreen.tsx` — populates the transcript feed.

**Expected response:**
```json
[
  {
    "id": "seg-001",
    "sessionId": "sess-001",
    "speaker": "DOCTOR",
    "text": "Good morning. What brings you in today?",
    "startTime": 0.0,
    "endTime": 3.2,
    "confidence": 0.92
  }
]
```

### GET `/note/{sessionId}`

Returns the AI-generated SOAP note for a session.

**Called from:** `SessionDetailScreen.tsx` — populates the four SOAP cards.

**Expected response:**
```json
{
  "sessionId": "sess-001",
  "subjective": "Patient presents with abdominal discomfort since morning...",
  "objective": "No objective findings recorded.",
  "assessment": "Likely gastritis or digestive upset.",
  "plan": "Consider antacids if symptoms persist."
}
```

---

## 7. End-to-End Flow Diagram

```
Doctor opens app
│
├─ Login / Register
│    └─ POST /auth/login  →  JWT token stored
│
├─ Patients Tab
│    ├─ Load list     →  GET /patient
│    ├─ Enroll new   →  POST /patient
│    │
│    └─ Tap patient  →  Patient Detail
│         ├─ Record Report
│         │    ├─ Start mic (local recording on device)
│         │    ├─ Stop mic
│         │    └─ Save  →  POST /recording/upload  →  Whisper transcription
│         │
│         └─ View Reports
│              └─ GET /patient/{id}/recordings  →  play audio
│
├─ Sessions Tab
│    ├─ Load list     →  GET /session
│    └─ Tap session  →  GET /transcript/{id}  +  GET /note/{id}
│
├─ Home Tab
│    └─ GET /doctor/speakers   (enrolled voice count)
│    └─ GET /session           (session count)
│
└─ Settings Tab
     └─ Whisper model + language  →  sent in POST /recording/upload body
     └─ Logout  →  clears token, no backend call needed
```

---

## 8. Switching from Mock to Real

1. **Turn off mock mode:**
   ```ts
   // src/constants/config.ts
   USE_MOCK_API: false,
   API_BASE_URL: 'http://10.0.2.2:8000',  // or your real server
   ```

2. **Create `src/api/recording.api.ts`** (not yet created — template in section 2 above).

3. **Create `src/api/patient.api.ts`** (not yet created — endpoints in section 3 above).

4. **Wire patient API into `patientStore.ts`:** Replace `MOCK_PATIENTS` initialization with a `fetchPatients()` action that calls `GET /patient`, and update `addPatient()` to call `POST /patient` and use the server-returned ID.

5. **Wire recording upload into `RecordReportScreen.tsx`:** After `handleSave`, call `uploadRecordingApi(...)` before `addRecording()`.

6. **ADB reverse for emulator** (so the emulator can reach localhost):
   ```powershell
   adb reverse tcp:8000 tcp:8000
   ```
