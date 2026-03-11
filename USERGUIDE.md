# MedVedev Mobile App — User Guide

A clinical consultation assistant app for doctors. Record voice reports for patients, manage enrollments, and review past sessions — all from your phone.

---

## Table of Contents

1. [Getting Started — Login & Register](#1-getting-started--login--register)
2. [App Navigation Overview](#2-app-navigation-overview)
3. [Patients Tab](#3-patients-tab)
   - [Viewing Enrolled Patients](#31-viewing-enrolled-patients)
   - [Enrolling a New Patient](#32-enrolling-a-new-patient)
   - [Patient Detail Screen](#33-patient-detail-screen)
4. [Recording a Voice Report](#4-recording-a-voice-report)
5. [Viewing & Playing Back Reports](#5-viewing--playing-back-reports)
6. [Home (Dashboard) Tab](#6-home-dashboard-tab)
7. [Sessions Tab](#7-sessions-tab)
8. [Settings Tab](#8-settings-tab)
9. [Simulator vs Real Device Notes](#9-simulator-vs-real-device-notes)

---

## 1. Getting Started — Login & Register

When you first open the app you will see the **Login** screen.

### Login
| Field | What to enter |
|---|---|
| Email | Your registered doctor email |
| Password | Your password |

Tap **Login**. In the current build, mock mode is enabled — any email and password combination will log you in successfully without needing a backend server.

### Register
If you don't have an account, tap **"Don't have an account? Register"** on the Login screen.

| Field | What to enter |
|---|---|
| Full Name | e.g. Dr. Priya Mehta |
| Email | Your email address |
| Password | Choose a password |

Tap **Register**. You will be automatically logged in after registering.

---

## 2. App Navigation Overview

After logging in, four tabs appear at the bottom of the screen:

| Tab | Icon | Purpose |
|---|---|---|
| **Patients** | 👥 | Enroll patients, record and view reports |
| **Home** | 🏠 | Dashboard with stats and recent sessions |
| **Sessions** | 📄 | View past consultation sessions and transcripts |
| **Settings** | ⚙️ | Account info, transcription settings, logout |

---

## 3. Patients Tab

This is the primary tab where all patient-related work happens.

### 3.1 Viewing Enrolled Patients

The **Patients** screen lists all enrolled patients. Each row shows:
- A coloured avatar with the patient's first initial
- The patient's full name
- A right arrow to navigate to their detail screen

By default, three demo patients are pre-loaded: **John Doe**, **Sarah Smith**, and **Michael Lee**.

### 3.2 Enrolling a New Patient

1. Tap the blue **Enroll Patient** button at the top of the Patients screen.
2. A modal dialog appears — type the patient's full name.
3. Tap **Enroll** (or press Return on the keyboard).
4. The new patient appears immediately at the bottom of the list.

> The patient list is stored in-memory for now. It resets when the app is fully closed. Persistence will be added when the backend is connected.

### 3.3 Patient Detail Screen

Tap any patient in the list to open their detail screen. You will see:
- A large avatar with the patient's initials
- Their name and internal ID
- Two action buttons:

| Button | Colour | Action |
|---|---|---|
| **Record Report** | Blue | Opens the voice recording screen |
| **View Reports** | Green | Opens the list of saved recordings |

---

## 4. Recording a Voice Report

Navigate: **Patients → Select Patient → Record Report**

The recording screen shows:
- The **name this recording will be saved as** (e.g. `Jane Doe 1`, `Jane Doe 2` — auto-incremented per patient)
- A large **MM:SS timer** counting elapsed time
- A pulsing red dot when recording is active

### Steps

**1. Start Recording**

Tap the large circular **mic button**. On a real device, the app requests microphone permission on first use. Accept it to proceed.

The button turns red and the timer starts counting up.

**2. Stop Recording**

Tap the button again (now showing a stop icon). The timer freezes and the screen shows:
- ✅ **"Recording Ready"**
- The total duration of the recording

**3. Save or Discard**

Two buttons appear at the bottom:

| Button | Action |
|---|---|
| **Discard** (red border) | Deletes the recording and lets you re-record |
| **Save Recording** (green) | Saves and returns to the Patient Detail screen |

After saving, a confirmation alert shows the recording name (e.g. `"Jane Doe 1" saved successfully`).

> To cancel without recording anything, tap **Cancel** (visible before you start recording).

---

## 5. Viewing & Playing Back Reports

Navigate: **Patients → Select Patient → View Reports**

This screen lists all voice recordings saved for that patient, ordered from oldest to newest.

Each recording card shows:
- **Recording name** — e.g. `Jane Doe 1`, `Jane Doe 2`
- **Date and time** it was saved
- **Duration** (e.g. `01:23`)
- A circular **▶ Play button** on the right

### Playback

Tap the ▶ play button to start playback of a recording.

| State | Button appearance |
|---|---|
| Not playing | Blue circle with ▶ |
| Playing | Red circle with ■ (tap again to stop) |

Playback stops automatically when the recording finishes.

### Empty State

If no recordings have been saved yet, the screen shows a "No Recordings Yet" message with instructions to go back and use **Record Report**.

---

## 6. Home (Dashboard) Tab

The **Home** tab gives a quick overview of your clinic activity.

| Section | What it shows |
|---|---|
| Greeting | "Good day, Dr. [Name]" |
| Stats cards | Number of enrolled voice profiles and total sessions |
| Recent Sessions | The 3 most recent consultation sessions |
| Enrolled Speakers | Voice profiles enrolled in the system |

> All data on this screen is currently mock data. It will reflect real data once the backend is connected.

---

## 7. Sessions Tab

The **Sessions** tab shows a chronological list of past consultation sessions.

Each session card shows:
- Date (e.g. Wed, Mar 11)
- Start time
- Duration in minutes

### Session Detail

Tap any session to open its detail view, which contains two sections:

**Transcript** — A scrollable feed of the conversation, labelled by speaker (Doctor / Patient / Unknown), showing each segment of dialogue.

**SOAP Note** — An auto-generated clinical summary divided into four fields:

| Field | Description |
|---|---|
| SUBJECTIVE | Patient's reported symptoms and history |
| OBJECTIVE | Clinical observations and measurements |
| ASSESSMENT | Doctor's diagnosis or differential |
| PLAN | Treatment plan and next steps |

> Sessions and transcripts are currently populated with mock data.

---

## 8. Settings Tab

### Account

Shows the name and email of the currently logged-in doctor.

### Whisper Model

Select which transcription model to use when the backend is connected.

| Model | Speed | Accuracy |
|---|---|---|
| Tiny | Fastest | Lowest |
| Base | Fast | Low |
| Small | Moderate | Moderate |
| Medium | Slow | High |
| Large | Slowest | Highest |

Toggle the switch next to the model you want to activate. Only one model can be active at a time.

### Transcription Language

Choose the language for speech-to-text:

| Option | Description |
|---|---|
| Auto-detect | Detects language automatically (supports English + Hindi/Hinglish) |
| English | Forces English transcription |
| Hindi | Forces Hindi transcription |

### Logout

Tap the red **Logout** button at the bottom. A confirmation dialog will appear. Confirm to return to the Login screen.

---

## 9. Simulator vs Real Device Notes

| Feature | Android Emulator / Simulator | Real Android Device |
|---|---|---|
| Patient list & enrollment | ✅ Fully works | ✅ Fully works |
| Timer-based mock recording | ✅ Works (no mic needed) | ✅ Works |
| Real microphone recording | ❌ Not supported | ✅ Fully works |
| Audio playback | ❌ Mock recordings can't play back | ✅ Plays real audio |
| All navigation & UI | ✅ Fully works | ✅ Fully works |

On the simulator, recordings are saved with a `mock://` URI. Tapping Play shows a message explaining that playback requires a real device. All other features — enrolling patients, naming recordings, viewing the report list, navigation — work identically on both simulator and real device.

---

## How to Restart the App (Development)

If you need to fresh-start Metro bundler:

```powershell
# From the mobile-app folder
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx expo start --port 8081 --reset-cache
```

Then in another terminal:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb reverse tcp:8081 tcp:8081
& $adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
```
