# Medvedev V2 — Full Codebase Guide + React Native Mobile App Plan

---

## 1. What This App Does

**Medvedev** is a clinical AI assistant for doctors. It records a doctor–patient conversation (or accepts an uploaded audio file), transcribes it using speaker diarization (who said what), and generates a structured **SOAP note** + a downloadable **PDF report**. Doctors log in, manage patients, and review past sessions.

### Core Features
| Feature | Description |
|---------|-------------|
| 🔐 Doctor Sign-up / Login | JWT-authenticated accounts, voice-enrolled identity |
| 🎙️ Speaker Diarization | Labels audio as "Doctor" vs "Patient" using AI voice embeddings |
| 📝 Transcription | Whisper-based multilingual speech-to-text |
| 🧾 SOAP Note Generation | AI converts conversation → Subjective / Objective / Assessment / Plan |
| 📄 PDF Report | Clean downloadable PDF per session |
| 👥 Patient Management | Doctor's patient list + per-patient session history |

---

## 2. Full Codebase Breakdown

```
MedVedev/
├── backend/                        ← Python FastAPI server
│   ├── app/
│   │   ├── main.py                 ← Server entry point, CORS, startup hook
│   │   ├── core/
│   │   │   ├── config.py           ← Constants: dirs, JWT secret, token TTL
│   │   │   └── dependencies.py     ← JWT auth middleware (get_current_doctor)
│   │   ├── db/
│   │   │   ├── base.py             ← SQLAlchemy declarative base
│   │   │   ├── models.py           ← 4 DB tables (see below)
│   │   │   └── session.py          ← Engine + SessionLocal + init_db()
│   │   ├── routers/
│   │   │   ├── doctor.py           ← POST /doctor/enroll, POST /doctor/login
│   │   │   ├── patients.py         ← GET /patients, GET /patients/{id}/sessions
│   │   │   └── session.py          ← POST /session/process (main pipeline)
│   │   └── services/
│   │       ├── auth_service.py     ← bcrypt hash, JWT create/decode
│   │       ├── model_registry.py   ← Loads Whisper + VAD + speaker models (CUDA)
│   │       └── pipeline_service.py ← Full audio → transcript → SOAP → PDF flow
│   ├── live_chunk_with_speaker.py  ← Core diarization + transcription logic
│   └── requirements.txt            ← Python dependencies
│
└── web/                            ← Next.js 16 frontend (TypeScript)
    ├── app/
    │   ├── page.tsx                ← Landing page (hero, features)
    │   ├── signin/                 ← Login form → calls /doctor/login
    │   ├── signup/                 ← Enrollment form → calls /doctor/enroll
    │   ├── dashboard/              ← Authenticated home + patient list
    │   ├── consultation/           ← Record/upload audio, see transcript + SOAP
    │   ├── patients/               ← Patient detail + session history
    │   └── report/                 ← PDF viewer page
    ├── components/
    │   ├── Sidebar.tsx             ← Nav: Dashboard / Consultation / Patients
    │   ├── Topbar.tsx              ← App header with logout
    │   ├── AudioRecorderCard.tsx   ← Live mic recording UI
    │   ├── AudioUploadCard.tsx     ← File upload UI
    │   ├── MicRecorder.tsx         ← Raw mic capture hook/component
    │   ├── SOAPViewer.tsx          ← SOAP note display (S/O/A/P sections)
    │   ├── TranscriptViewer.tsx    ← Conversation transcript display
    │   ├── PatientCard.tsx         ← Single patient list item
    │   ├── GlassCard.tsx           ← Reusable glass-effect card container
    │   ├── theme-toggle.tsx        ← Dark/light mode toggle
    │   └── ui/                     ← Radix-based primitives (Button, Dialog…)
    └── lib/
        ├── api.ts                  ← All fetch calls to the backend
        └── store.ts                ← Zustand global state (doctor, patients, soap…)
```

---

## 3. Database Schema

```
doctors             → id, name, password_hash, created_at
doctor_embeddings   → id, doctor_id, embedding (float[]), created_at
patients            → id, doctor_id, name, created_at
sessions            → id, doctor_id, patient_id, created_at
reports             → id, session_id, conversation_json, soap_json, pdf_path, created_at
```

---

## 4. API Endpoints (Complete Reference)

| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| `POST` | `/doctor/enroll` | ❌ | `name`, `password`, `audio1`, `audio2`, `audio3` (form) | `{ doctor_id, message }` |
| `POST` | `/doctor/login` | ❌ | `name`, `password` (form) | `{ access_token, token_type }` |
| `GET` | `/patients` | ✅ Bearer | — | `{ patients: [{id, name, created_at}] }` |
| `GET` | `/patients/{id}/sessions` | ✅ Bearer | — | `{ sessions: [{session_id, created_at, pdf_url}] }` |
| `POST` | `/session/process` | ✅ Bearer | `file` (audio), `patient_name` (form) | `{ conversation, soap, pdf_url }` |
| `GET` | `/reports/{filename}.pdf` | ❌ | — | PDF binary |

**Auth:** All protected routes expect `Authorization: Bearer <token>` header.

---

---

# 5. React Native Mobile App — Team Work Division

> **Stack:** React Native (Expo) · TypeScript · Zustand · React Navigation

---

## ⚠️ GROUND RULES

> **Vanshika and Shreya — you are NOT allowed to modify any files in the `src/api/` or `src/store/` folders, or any file marked `[DEEPU ONLY]` in comments.**
>
> All backend communication and state management is owned exclusively by **Deepu**.
> If a screen needs new data from the API, raise it with Deepu — he will add the call and expose it.  
> Direct edits to Deepu's files will be reverted.

---

## 👤 DEEPU — API Layer + State Management

**Folder ownership: `src/api/`, `src/store/`, `src/types/`**

You own all communication with the existing FastAPI backend. The backend does NOT need any changes — you are simply re-implementing the web app's `lib/api.ts` and `lib/store.ts` in React Native.

---

### What you build

#### `src/types/index.ts`
Define all shared TypeScript types (copy from web's `api.ts`):
```ts
export type Doctor = { id: string; name: string };
export type Patient = { id: string; name: string; created_at: string };
export type PatientSession = { session_id: string; created_at: string; pdf_url: string | null };
export type TranscriptLine = { speaker: string; text: string; tsSec?: number };
export type SoapNote = { subjective: string; objective: string; assessment: string; plan: string };
```

#### `src/api/client.ts`  `[DEEPU ONLY]`
- Base URL constant: `http://127.0.0.1:8000` (change to prod URL when deployed)
- Token storage using `expo-secure-store` (NOT localStorage)
- `getAuthHeaders()` helper

#### `src/api/auth.ts`  `[DEEPU ONLY]`
```ts
// Mirrors POST /doctor/login
login(name, password) → Promise<{ access_token, token_type }>

// Mirrors POST /doctor/enroll  
enroll(name, password, audio1, audio2, audio3) → Promise<{ doctor_id, message }>
```
- Files sent as `multipart/form-data` using `FormData`
- Audio files from `expo-av` recordings → use `uri` to build the form part

#### `src/api/patients.ts`  `[DEEPU ONLY]`
```ts
getPatients() → Promise<{ patients: Patient[] }>
getPatientSessions(patient_id) → Promise<{ sessions: PatientSession[] }>
```

#### `src/api/session.ts`  `[DEEPU ONLY]`
```ts
// Mirrors POST /session/process
processSession(audioUri: string, patientName: string) → Promise<{conversation, soap, pdf_url}>
```
- This is the most complex one: send the recorded audio file as `multipart/form-data`
- Use `expo-file-system` to read the file URI, send as blob

#### `src/store/useAppStore.ts`  `[DEEPU ONLY]`
Mirror the web's Zustand store exactly:
```ts
// State slices:
doctor          → set on login, clear on logout
patients        → loaded from API, stored here
activePatientId → which patient is selected
transcript      → result from session process
soap            → SOAP note result
pdfUrl          → PDF URL result

// Actions:
setDoctor, setPatients, addPatient,
setActivePatientId, setTranscript,
setSoap, setPdfUrl, logout
```
Install: `npm install zustand`

#### `src/store/useAuth.ts`  `[DEEPU ONLY]`
- On app start: check `expo-secure-store` for saved token → auto-login
- `login()`: call API, save token, set doctor in store
- `logout()`: clear token + store

---

### Deepu's install commands
```bash
npx expo install expo-secure-store expo-av expo-file-system expo-document-picker
npm install zustand
```

---

## 🎨 VANSHIKA — Auth Screens + Navigation Shell

**Folder ownership: `src/screens/auth/`, `src/navigation/`, `src/components/common/`**

> ⚠️ **Do NOT touch `src/api/` or `src/store/` — those are Deepu's.**  
> Import from `src/store/useAuth` and `src/store/useAppStore` to get data and call actions. Do not write fetch calls yourself.

---

### What you build

#### Navigation (`src/navigation/`)
- `RootNavigator.tsx` — checks `doctor` in store → if null show `AuthStack`, else show `AppStack`
- `AuthStack.tsx` — Welcome → SignIn → SignUp screens
- `AppStack.tsx` — Tab navigator: Dashboard | Consultation | Patients

Install: `npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context`

#### Screens you own (`src/screens/auth/`)

**`WelcomeScreen.tsx`**
- App logo / name "MEDVEDEV V2"
- Tag line: "Clinical Conversation Intelligence"
- Feature pills: Speaker Diarization · SOAP Notes · PDF Reports · Multilingual
- Buttons: "Get Started" → SignUp, "Sign In" → SignIn

**`SignInScreen.tsx`**
- Name input field
- Password input field (secure)
- "Sign In" button → calls `useAuth().login(name, password)` (Deepu's code)
- Loading indicator while waiting
- Error message on failure
- Link to Sign Up

**`SignUpScreen.tsx`** ← complex — coordinate with Deepu
- Name field, password field
- 3 audio recording buttons (audio1, audio2, audio3) — use `expo-av` just for UI; Deepu provides the upload function
- "Enroll" button → calls `useAuth().enroll(...)` (Deepu's code)
- Progress/success state

#### Common components (`src/components/common/`)
- `AppButton.tsx` — Primary/outline/ghost variants
- `AppInput.tsx` — Styled text input with label + error
- `GlassCard.tsx` — Dark glass panel (equivalent of web GlassCard)
- `LoadingOverlay.tsx` — Full-screen spinner
- `ErrorMessage.tsx` — Red inline error text

---

## 🎨 SHREYA — Core App Screens + Content Components

**Folder ownership: `src/screens/app/`, `src/components/medical/`**

> ⚠️ **Do NOT touch `src/api/` or `src/store/` — those are Deepu's.**  
> Read data from `useAppStore()`. Call Deepu's API functions by importing from `src/api/session.ts` etc. — only via the interface Deepu exposes. Do not write fetch calls yourself.

---

### What you build

#### Screens (`src/screens/app/`)

**`DashboardScreen.tsx`**
- "Welcome Dr. {name}" header
- Summary stats: total patients, today's sessions
- Quick action buttons: "New Consultation", "View Patients"
- Recent patients list (get from `useAppStore().patients`)

**`ConsultationScreen.tsx`** ← the main screen
- Patient name input
- Toggle: Record live / Upload audio file
  - Record mode: mic button (start/stop), timer, waveform animation
  - Upload mode: file picker button
- "Process" button → calls `processSession()` (from `src/api/session.ts`)
- Loading state: "Analysing audio…" with spinner
- On result: shows `TranscriptCard` + `SOAPCard` + "Download PDF" button

**`PatientsScreen.tsx`**
- Search bar
- List of `PatientCard` components (data from `useAppStore().patients`)
- Tap patient → `PatientDetailScreen`

**`PatientDetailScreen.tsx`**
- Patient name + created date header
- Session history list (dates + PDF download links)
- "New Consultation" shortcut button

**`ReportScreen.tsx`**
- Render PDF using `expo-print` or link to `react-native-pdf`
- Download button

#### Medical content components (`src/components/medical/`)

**`SOAPCard.tsx`**
- 4 sections: **S**ubjective / **O**bjective / **A**ssessment / **P**lan
- Each section is collapsible, colored differently
- Data from `useAppStore().soap`

**`TranscriptCard.tsx`**
- Chat-bubble style list
- Doctor bubbles on right (blue), Patient bubbles on left (grey)
- Speaker label + timestamp (tsSec formatted as mm:ss)
- Data from `useAppStore().transcript`

**`PatientCard.tsx`**
- Name, created date, chevron arrow
- Tap navigates to detail

**`RecordingWaveform.tsx`**
- Animated bars during recording (use React Native Animated API)
- Shows "Recording… 0:42" timer

**`SessionCard.tsx`**
- Date of session
- "View PDF" button
- Used inside PatientDetailScreen

---

## 6. Project Setup — Step by Step

### Step 1 — Initialize the Expo project (anyone can do this once)
```bash
# In the MedVedev root folder:
npx create-expo-app mobile --template blank-typescript
cd mobile
```

### Step 2 — Install all dependencies (split by owner)

**Core (everyone needs this):**
```bash
npx expo install react-native-screens react-native-safe-area-context
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
```

**Deepu installs (API layer):**
```bash
npx expo install expo-secure-store expo-av expo-file-system expo-document-picker
npm install zustand
```

**Shreya installs (recording + PDF):**
```bash
npx expo install expo-av expo-document-picker expo-print
npm install react-native-pdf react-native-blob-util
```

### Step 3 — Folder structure to create
```
mobile/src/
├── api/
│   ├── client.ts         ← DEEPU
│   ├── auth.ts           ← DEEPU
│   ├── patients.ts       ← DEEPU
│   └── session.ts        ← DEEPU
├── store/
│   ├── useAppStore.ts    ← DEEPU
│   └── useAuth.ts        ← DEEPU
├── types/
│   └── index.ts          ← DEEPU
├── navigation/
│   ├── RootNavigator.tsx ← VANSHIKA
│   ├── AuthStack.tsx     ← VANSHIKA
│   └── AppStack.tsx      ← VANSHIKA
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx    ← VANSHIKA
│   │   ├── SignInScreen.tsx     ← VANSHIKA
│   │   └── SignUpScreen.tsx     ← VANSHIKA + DEEPU (audio part)
│   └── app/
│       ├── DashboardScreen.tsx      ← SHREYA
│       ├── ConsultationScreen.tsx   ← SHREYA
│       ├── PatientsScreen.tsx       ← SHREYA
│       ├── PatientDetailScreen.tsx  ← SHREYA
│       └── ReportScreen.tsx         ← SHREYA
└── components/
    ├── common/
    │   ├── AppButton.tsx      ← VANSHIKA
    │   ├── AppInput.tsx       ← VANSHIKA
    │   ├── GlassCard.tsx      ← VANSHIKA
    │   ├── LoadingOverlay.tsx ← VANSHIKA
    │   └── ErrorMessage.tsx   ← VANSHIKA
    └── medical/
        ├── SOAPCard.tsx           ← SHREYA
        ├── TranscriptCard.tsx     ← SHREYA
        ├── PatientCard.tsx        ← SHREYA
        ├── RecordingWaveform.tsx  ← SHREYA
        └── SessionCard.tsx        ← SHREYA
```

### Step 4 — Design tokens (agree on these upfront)
```ts
// src/theme.ts — everyone imports from here
export const colors = {
  bg:         '#0a0a0f',
  surface:    '#14141e',
  border:     '#1e1e2e',
  accent:     '#6366f1',   // indigo
  accentDim:  '#818cf8',
  doctor:     '#6366f1',   // transcript bubble
  patient:    '#1e1e2e',
  text:       '#f0f0f5',
  muted:      '#6b7280',
  error:      '#ef4444',
  success:    '#10b981',
};
export const fonts = {
  regular: 'Inter_400Regular',
  medium:  'Inter_500Medium',
  bold:    'Inter_700Bold',
};
export const radius = { sm: 8, md: 14, lg: 20, xl: 28 };
```

### Step 5 — Run the app
```bash
# From mobile/
npx expo start

# iOS simulator (Mac only)
press i

# Android emulator / physical device
press a

# Physical device (any OS) — scan QR with Expo Go app
```

---

## 7. Key Differences: Web → Mobile

| Web (Next.js) | Mobile (React Native) |
|---------------|----------------------|
| `localStorage` for token | `expo-secure-store` |
| `fetch()` with `window.localStorage` | Same `fetch()` but import from `expo-secure-store` |
| `<input type="file">` for audio upload | `expo-document-picker` |
| `<audio>` MediaRecorder API | `expo-av` Audio.Recording |
| React Router / Next App Router | React Navigation |
| Tailwind CSS classes | `StyleSheet.create()` |
| Zustand (same library, same code) | Zustand (exactly the same) |
| PDF via browser tab | `expo-print` or `react-native-pdf` |
| Dark mode via `next-themes` | Hardcode dark theme (or use appearance API) |

---

## 8. Important Notes for Everyone

- **Backend stays unchanged** — you are only building a new frontend.
- **Base URL:** When testing locally, use your computer's LAN IP (not `127.0.0.1`) because the phone can't access localhost. Find it with `ipconfig` → IPv4 Address.  
  Example: `http://192.168.1.5:8000`
- **Audio format:** The backend accepts any audio format `pydub` can read (mp3, wav, m4a, ogg). `expo-av` records as `.m4a` by default — that's fine.
- **Token expiry:** JWT tokens expire in 60 minutes (configured in backend). Deepu should handle auto-refresh or re-login.
- **PDF rendering:** `react-native-pdf` requires a native build — **cannot be tested in Expo Go**. Use `expo-dev-client` or a bare workflow for PDF features.

---

## 9. Work Coordination Checklist

### Before starting, agree on:
- [ ] Deepu creates `src/types/index.ts` and shares it with Vanshika + Shreya — they import types from here, not define their own
- [ ] Deepu creates `src/store/useAppStore.ts` early so Vanshika and Shreya can import from it immediately
- [ ] Vanshika sets up navigation shell first so Shreya can register her screens
- [ ] Agree on `src/theme.ts` colors and font sizes (all three agree)

### Integration points (Deepu + teammates):
| Integration | Deepu provides | Teammate uses |
|-------------|---------------|---------------|
| Login | `useAuth().login(name, pass)` | Vanshika in `SignInScreen` |
| Enroll | `useAuth().enroll(name, pass, aud1, aud2, aud3)` | Vanshika in `SignUpScreen` |
| Patient list | `useAppStore().patients` (auto-loaded on login) | Shreya in `PatientsScreen` |
| Process session | `import { processSession } from 'src/api/session'` | Shreya in `ConsultationScreen` |
| Transcript result | `useAppStore().transcript` | Shreya in `TranscriptCard` |
| SOAP result | `useAppStore().soap` | Shreya in `SOAPCard` |
| PDF URL | `useAppStore().pdfUrl` | Shreya in `ReportScreen` |
