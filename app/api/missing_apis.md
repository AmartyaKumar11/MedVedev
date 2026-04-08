# Missing APIs list for Backend Developer

This document outlines the APIs that need to be implemented or refined in the backend to fully support the React Native mobile application.

## Authentication & Enrollment
1. **`POST /api/auth/login`**
   - **Request:** `{ email/username, password }`
   - **Response:** `{ token, doctor_id, name }`
   - **Notes:** Needs to return a JWT for subsequent requests.

2. **`POST /api/auth/register`**
   - **Request:** `{ name, email, password }`
   - **Response:** `{ token, doctor_id }`

3. **`POST /api/doctor/enroll-voice`**
   - **Request:** `multipart/form-data` with multiple audio samples (e.g., `audio1`, `audio2`, `audio3`)
   - **Response:** `{ success: true, message: "Voice enrolled successfully" }`

4. **`GET /api/doctor/speakers`**
   - **Request:** `Bearer Token`
   - **Response:** `{ enrolled: boolean, samples_count: number }`

## Patient Management
5. **`GET /api/patients`**
   - **Request:** `Bearer Token`
   - **Response:** `[{ id, name, created_at, last_session_date }]`

6. **`POST /api/patients`**
   - **Request:** `{ name, age, gender, notes }`
   - **Response:** `{ id, name, created_at }`

7. **`GET /api/patients/:id`**
   - **Request:** `Bearer Token`
   - **Response:** `{ id, name, demographic_info, sessions: [] }`

## Consultation & Recording (Core pipeline)
8. **`POST /api/session/start`**
   - **Request:** `{ patient_id }`
   - **Response:** `{ session_id }`

9. **`POST /api/session/:id/chunk`** (Optional for streaming/live update)
   - **Request:** `multipart/form-data` containing audio chunk
   - **Response:** `{ transcript_lines: [ { speaker, text, timestamp } ] }`

10. **`POST /api/session/:id/finalize`** (or `/session/process` as per existing architecture)
    - **Request:** `multipart/form-data` containing the full audio (if not streaming)
    - **Response:** `{ session_id, transcript, soap_note, pdf_url }`

## Transcripts & Reports
11. **`GET /api/session/:id`**
    - **Request:** `Bearer Token`
    - **Response:** `{ session_id, patient_id, created_at, transcript: [], soap_note: {} }`

12. **`GET /api/reports/:filename`**
    - **Request:** `Bearer Token` (or public temporary url)
    - **Response:** `application/pdf` binary stream
