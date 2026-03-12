# MedVedev Mobile App — Setup Requirements

This guide explains everything your friend needs to install and run the app on their own Windows laptop using VS Code or Cursor.

---

## What You Need to Install

### 1. Node.js v20 or higher
Download from: https://nodejs.org (choose the **LTS** version)

After installing, verify:
```powershell
node -v   # should print v20.x.x or higher
npm -v    # should print 10.x.x or higher
```

---

### 2. Git
Download from: https://git-scm.com/download/win

After installing, verify:
```powershell
git --version
```

---

### 3. Java JDK 17
Needed to run the Android emulator.

Download **JDK 17** from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

After installing, set the environment variable (replace path if different):
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

Verify:
```powershell
java -version   # should say 17.x.x
```

---

### 4. Android Studio (for the emulator)
Download from: https://developer.android.com/studio

During setup, make sure these are checked in the installer:
- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)

After installing, open Android Studio and go to:
**More Actions → SDK Manager → SDK Platforms** → install **Android 14 (API 34)**

Then go to **More Actions → Virtual Device Manager** → create a new device:
- Choose **Pixel 9 Pro** (or any Pixel model)
- System image: **Android 14 (API 34)**
- Name it whatever you like

Set the Android SDK environment variable (replace username):
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

Verify:
```powershell
$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe version
```

---

### 5. VS Code or Cursor
- VS Code: https://code.visualstudio.com
- Cursor: https://cursor.sh

Recommended extensions to install inside the editor:
- **ESLint**
- **Prettier**
- **React Native Tools** (VS Code marketplace)
- **TypeScript** (usually pre-installed)

---

## Clone the Repo

```powershell
git clone https://github.com/AmartyaKumar11/MedVedev.git
cd MedVedev
git checkout mobile_app
cd mobile-app
```

---

## Install Dependencies

Run this once inside the `mobile-app` folder:

```powershell
npm install
```

This installs everything listed in `package.json`, including:
- Expo SDK 55
- React Native 0.83.2
- React Navigation 7
- Zustand 5 (state management)
- expo-av (audio recording/playback)
- Axios (HTTP client, for when backend is connected)

---

## Running the App

### Step 1 — Start the Android emulator

Open Android Studio → Virtual Device Manager → press the ▶ Play button next to your AVD.

Or launch it from PowerShell (replace `YourAVDName` with your AVD's name):
```powershell
$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe -avd YourAVDName -gpu host
```

Wait ~30 seconds for it to fully boot.

### Step 2 — Set up ADB reverse (so emulator can reach Metro)

```powershell
$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe reverse tcp:8081 tcp:8081
```

### Step 3 — Start Metro bundler

Open a PowerShell terminal in the `mobile-app` folder and run:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator"
npx expo start --port 8081 --reset-cache
```

The Metro bundler will start. Press **`a`** in the terminal to open the app on the Android emulator.

---

## App Overview

Once running, you'll see:

| Tab | What it does |
|---|---|
| Patients | Enroll patients, record voice reports, view recordings |
| Home | Dashboard with stats |
| Sessions | View past consultation sessions + transcripts |
| Settings | Whisper model, language, logout |

**Login:** Any email and password works (mock mode is enabled — no real backend needed).

See `USERGUIDE.md` for full usage instructions.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npx expo` not recognised | Run `npm install` again inside `mobile-app/` |
| Emulator not detected | Make sure it's fully booted, then run `adb devices` to confirm |
| App won't load on emulator | Run the `adb reverse tcp:8081 tcp:8081` command again |
| Metro port already in use | Run `npx kill-port 8081` then restart Metro |
| `JAVA_HOME` error | Make sure JDK 17 is installed and the path is correct |
| Blank white screen | Press `r` in the Metro terminal to reload, or shake device → Reload |

---

## Not Needed

- You do **not** need a real Android phone (the emulator is enough)
- You do **not** need a backend/server (the app runs in mock mode by default)
- You do **not** need an Expo account or the Expo Go app
- You do **not** need macOS (this is Android only for now — no iOS simulator needed)
