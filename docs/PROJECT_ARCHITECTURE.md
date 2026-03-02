# MEDVEDEV V2 – SYSTEM ARCHITECTURE

---

## 1. High-Level Flow

Audio Input
→ DeepFilterNet
→ Silero VAD
→ Rolling Window Buffer
→ pyannote Diarization
→ Speaker Embedding Extraction
→ Doctor Embedding Matching
→ faster-whisper Transcription
→ Speaker-labelled Transcript
→ Gemini Documentation Structuring
→ PostgreSQL Storage

---

## 2. Backend Stack

Framework:
- FastAPI

Database:
- PostgreSQL
- SQLAlchemy ORM
- Alembic migrations

ML Stack:
- DeepFilterNet
- Silero VAD
- pyannote.audio
- faster-whisper (large-v3 INT8)
- PyTorch (CUDA)

LLM:
- Gemini API (documentation layer only)

---

## 3. Directory Structure

backend/

app/
├── api/                 # FastAPI routers
├── core/                # config, auth, logging
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── services/            # business logic
├── ml/
│   ├── denoise.py
│   ├── vad.py
│   ├── diarization.py
│   ├── transcription.py
│   ├── embedding.py
│   └── pipeline.py
├── documentation/
│   ├── extraction.py
│   ├── normalization.py
│   └── soap_generator.py
└── main.py

docs/
PROJECT_MASTER.md
ARCHITECTURE.md

legacy_v1/ (frozen, untouched)

---

## 4. Database Schema

### Doctor
- id
- name
- email
- hashed_password
- created_at

### DoctorVoiceProfile
- id
- doctor_id
- embedding_vector
- centroid_vector
- created_at
- updated_at

### Session
- id
- doctor_id
- started_at
- ended_at
- duration_seconds
- created_at

### TranscriptSegment
- id
- session_id
- speaker_label
- role_label
- text
- start_time
- end_time
- confidence

### StructuredNote
- id
- session_id
- soap_json
- normalized_entities_json
- created_at

---

## 5. Audio Strategy

Noise Removal:
DeepFilterNet (single pass)

VAD:
Silero VAD

Rolling Window:
5–8 sec sliding buffer
Speaker memory maintained

Diarization:
pyannote neural diarization

Doctor Anchoring:
Cosine similarity threshold match

---

## 6. Documentation Strategy

Gemini used for:
- Symptom extraction
- Hinglish normalization
- SOAP structuring

Constraints:
- Strict JSON schema
- No hallucinated fields
- No diagnosis suggestion
- temperature = 0

---

## 7. Security Model

- JWT authentication
- Password hashing (bcrypt)
- Role validation per session
- No hardcoded secrets
- .env configuration

---

## 8. Performance Model

- All ML models loaded at startup
- No reload per request
- Background tasks for heavy processing
- GPU memory monitoring
- Request timeout safeguards

---

## 9. Architectural Rules

- No ML logic inside routers
- No DB logic inside ML modules
- Services orchestrate components
- Routers call services only
- Strict separation of concerns
- No circular imports
- No monolithic files

---

This document defines system architecture for MEDVEDEV V2.
All coding must follow this structure.