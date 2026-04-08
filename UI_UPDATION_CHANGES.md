# UI Updation Changes (App Folder Only)

Date: 2026-04-08

## Scope
This update replicates the provided website screenshots inside the mobile app code under the app folder only. No web source files were edited for this UI replication task.

## Updated Screens and Navigation

### 1) Root and Navigation
- app/_layout.tsx
  - Kept root stack routing for index, auth group, and tabs group.
- app/(tabs)/_layout.tsx
  - Replaced bottom tab-style layout with stack-style navigation to match website-like page flow.

### 2) Landing / Home
- app/index.tsx
  - Rebuilt as a screenshot-style hero page.
  - Added top row: brand label, Dark/Light pill, Sign In, Get Started.
  - Added hero content: heading, subtitle, primary and secondary CTA buttons.
  - Added feature chips and right-side feature card list.
  - Added footer copy and visual styling consistent with the website theme.

### 3) Auth Screens
- app/(auth)/login.tsx
  - Rebuilt as Doctor Console sign-in card.
  - Added labels and placeholders matching screenshot language.
  - Added Create account link and Sign In action button.
  - Added website-like spacing, borders, card style, and muted color palette.

- app/(auth)/register.tsx
  - Rebuilt as full Doctor Enrollment page.
  - Added fields: Doctor Name, Age, Password.
  - Added recording script panel.
  - Added 3 Audio Sample blocks, each with:
    - Record card (status + start/stop + clear)
    - Upload card (status + choose file + clear)
  - Added sample counter and gated Submit button (enabled at 3/3 samples).

- app/(auth)/enroll.tsx
  - Simplified to reuse register screen UI for consistency:
    - export default from ./register

### 4) Dashboard
- app/(tabs)/dashboard.tsx
  - Rebuilt to mirror screenshot structure:
    - Left sidebar (brand, Dashboard/Patients/Sessions nav, Logout)
    - Topbar (DASHBOARD label, doctor name, doctor-id text, Dark pill)
    - Patient panel with title/subtitle
    - Search input and Add New Patient button
    - Patient rows with last visit, age, History action, Start Consultation action
  - Added local query filtering for patient list.

### 5) Consultation
- app/(tabs)/consultation.tsx
  - Rebuilt to mirror screenshot structure:
    - Left sidebar (same style as dashboard)
    - Topbar (Consultation title, Back, Dark pill)
    - Live Capture card with status badge and center mic visual
    - Controls: Start Recording, Stop Recording, Cancel, hint text
    - Transcript panel (speaker diarization tag)
    - SOAP Note panel (generated tag)
    - Generate Report button
  - Added mock recording behavior to populate transcript and SOAP text.

### 6) Existing Detail Screens Retained
- app/patient/[id].tsx
  - Existing patient history layout retained.
- app/session/[id].tsx
  - Existing session review layout retained.
- app/(tabs)/profile.tsx
  - Existing profile/settings layout retained.

## Styling Direction Applied
- Soft green/neutral palette close to screenshot theme.
- Rounded cards and pill controls.
- Border-first visual hierarchy with low-contrast surfaces.
- Strong typography hierarchy for headings and section labels.
- Mock UI states included for recording/status interactions.

## Behavioral Notes
- UI is currently mock-driven for several actions (record, upload, generate report).
- Navigation flow now visually behaves like website pages rather than traditional bottom tabs.
- This document records UI structure and styling changes only.
