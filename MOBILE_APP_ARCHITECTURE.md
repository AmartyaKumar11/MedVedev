# MedVedev Mobile App — Architecture Documentation

## Overview

The MedVedev mobile app is a React Native companion to the MedVedev V2 clinical consultation intelligence system. It allows doctors to:

- Log in securely with their credentials
- Enroll their voice for automatic speaker identification
- Start and stop live consultation recording sessions
- View real-time speaker-labelled transcripts
- Browse past sessions and view SOAP medical notes
- Configure transcription model and language settings

The app runs in **mock mode** by default (`USE_MOCK_API = true` in `src/constants/config.ts`), meaning all API calls return pre-defined mock data. When the V2 FastAPI backend is ready, set `USE_MOCK_API = false` and update `API_BASE_URL`.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile UI |
| Expo (Managed Workflow) | Build tooling, dev server, native modules |
| TypeScript | Type safety |
| React Navigation 6 | Screen routing (stack + bottom tabs) |
| Zustand | Lightweight global state management |
| Axios | HTTP client with JWT interceptor |
| expo-av | Microphone access and audio recording |
| expo-file-system | Local file storage for audio chunks |
| @expo/vector-icons | Ionicons icon set |
| react-native-screens | Native screen optimization |
| react-native-safe-area-context | Safe area handling |

---

## Folder Structure

```
mobile-app/
├── App.tsx                          # Root entry — NavigationContainer + RootNavigator
├── app.json                         # Expo project config
├── babel.config.js
├── tsconfig.json
├── package.json
│
└── src/
    ├── navigation/
    │   ├── RootNavigator.tsx        # Auth vs App routing (based on login state)
    │   ├── AuthNavigator.tsx        # Login / Register stack
    │   └── AppNavigator.tsx         # Bottom tab + Sessions stack
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── dashboard/
    │   │   └── DashboardScreen.tsx  # Home with stats and recent sessions
    │   ├── recording/
    │   │   └── LiveRecordingScreen.tsx  # Mic button + live transcript feed
    │   ├── enrollment/
    │   │   └── SpeakerEnrollmentScreen.tsx
    │   ├── sessions/
    │   │   ├── SessionHistoryScreen.tsx
    │   │   └── SessionDetailScreen.tsx  # Transcript + SOAP note
    │   └── settings/
    │       └── SettingsScreen.tsx
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   └── Badge.tsx            # Colored speaker label (DOCTOR/PATIENT)
    │   ├── transcript/
    │   │   ├── TranscriptItem.tsx   # Single transcript line with badge + confidence
    │   │   └── TranscriptFeed.tsx   # Auto-scrolling FlatList
    │   └── recording/
    │       └── MicButton.tsx        # Animated pulsing mic button
    │
    ├── store/
    │   ├── authStore.ts             # doctor, token, login(), logout()
    │   ├── sessionStore.ts          # activeSession, transcript[], isRecording
    │   └── settingsStore.ts         # whisperModel, language
    │
    ├── api/
    │   ├── client.ts                # Axios instance with JWT interceptor
    │   ├── auth.api.ts
    │   ├── session.api.ts
    │   ├── transcript.api.ts
    │   └── enrollment.api.ts
    │
    ├── types/
    │   └── index.ts                 # All TypeScript interfaces + nav param lists
    │
    ├── constants/
    │   ├── colors.ts
    │   └── config.ts                # USE_MOCK_API flag, API_BASE_URL
    │
    └── mocks/
        └── mockData.ts              # Mock doctor, sessions, transcript, SOAP note
```

---

## Navigation System

```
RootNavigator
├── AuthNavigator        (when isLoggedIn = false)
│   ├── LoginScreen
│   └── RegisterScreen
│
└── AppNavigator         (when isLoggedIn = true — Bottom Tab Bar)
    ├── Tab: Home        → DashboardScreen
    ├── Tab: Record      → LiveRecordingScreen
    ├── Tab: Enroll      → SpeakerEnrollmentScreen
    ├── Tab: Sessions    → SessionsStack
    │                        ├── SessionHistoryScreen
    │                        └── SessionDetailScreen
    └── Tab: Settings    → SettingsScreen
```

Auth state is managed in `authStore`. When `login()` is called, `isLoggedIn` becomes `true` and `RootNavigator` automatically switches to the App stack. On `logout()`, it switches back to Auth.

---

## API Communication

All API modules live in `src/api/`. Each module exports typed async functions.

**Feature flag (`src/constants/config.ts`):**
```ts
USE_MOCK_API: true   // ← Change to false when V2 backend is live
API_BASE_URL: 'http://10.0.2.2:8000'  // Android emulator → host machine localhost
```

**Axios client (`src/api/client.ts`):**
- Injects `Authorization: Bearer <token>` on every request
- On 401 response → calls `authStore.logout()` automatically

**API modules:**
| File | Endpoints |
|---|---|
| `auth.api.ts` | `POST /auth/login`, `POST /auth/register` |
| `session.api.ts` | `POST /session/start`, `POST /session/:id/finalize`, `GET /session` |
| `transcript.api.ts` | `GET /transcript/:id`, `GET /note/:id` |
| `enrollment.api.ts` | `GET /doctor/speakers`, `POST /doctor/enroll-voice` |

---

## State Management (Zustand)

| Store | Key State | Key Actions |
|---|---|---|
| `authStore` | `doctor`, `token`, `isLoggedIn` | `login()`, `logout()` |
| `sessionStore` | `activeSession`, `transcript[]`, `isRecording` | `setRecording()`, `appendSegment()`, `clearSession()` |
| `settingsStore` | `whisperModel`, `language`, `apiBaseUrl` | setters for each |

---

## How to Run the App Locally

### Prerequisites
- Node.js 18+
- Android Studio + Android SDK installed
- `ANDROID_HOME` environment variable set
- Android emulator running (or physical device with USB debugging)

### Steps

```powershell
# 1. Navigate to the mobile-app folder
cd mobile-app

# 2. Install dependencies (if not already done)
npm install

# 3. Start the Expo development server
npx expo start

# 4. Press 'a' in the terminal to open on Android emulator
# OR scan the QR code with the Expo Go app on a physical device
```

---

## How to Run the Android Emulator

```powershell
# Start emulator (Pixel_9_Pro AVD)
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel_9_Pro -gpu host

# Verify emulator is connected
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
# Expected output: emulator-5554   device
```

---

## Connecting to the Real Backend

When the V2 FastAPI backend is ready:

1. Open `src/constants/config.ts`
2. Set `USE_MOCK_API: false`
3. Set `API_BASE_URL` to your backend URL:
   - Android emulator → host machine: `http://10.0.2.2:8000`
   - Physical device on same network: `http://<your-pc-ip>:8000`
   - Production server: `https://api.medvedev.example.com`

---

## Future Improvements

- [ ] Real microphone recording using `expo-av` (chunked upload every 3s)
- [ ] WebSocket connection for true real-time transcript streaming
- [ ] Push notifications when SOAP note is ready
- [ ] PDF export of session transcript and SOAP note
- [ ] Offline support — queue sessions locally when no connection
- [ ] Hinglish normalization display (show original + normalized side-by-side)
- [ ] Multi-language UI (Hindi/English toggle)
- [ ] Biometric authentication (fingerprint/face unlock)
- [ ] Dark mode support
- [ ] iPad / tablet layout
