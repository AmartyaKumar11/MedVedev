# Medvedev V2 — Agentic Architecture Framing

This document reframes the implemented system as a **coordinated, modular pipeline** using agent-oriented vocabulary. It is **grounded in the codebase**: no speculative autonomy, planning APIs, or memory systems beyond what exists.

**Production exclusions:** Experimental scripts (e.g. pyannote-based diarization under `backend/`) are **not** invoked by the FastAPI application. The constant `RMS_THRESHOLD` in `live_chunk_with_speaker.py` is defined but unused.

---

## 1. System Overview

Medvedev V2 is a **synchronous, request-scoped clinical audio pipeline**. The browser uploads one consultation recording; the API runs a **fixed sequence of task-specialized modules** on the request thread—**no job queue, no background workers, no streaming or polling** for completion.

- **Models** (loaded at startup via `app/services/model_registry.py`): Silero VAD, faster-whisper, SpeechBrain ECAPA-TDNN.
- **Storage:** PostgreSQL for doctors, enrollment embeddings, patients, sessions, and report metadata.
- **Artifacts:** WeasyPrint renders PDFs to `backend/output/`; static mount serves `/reports/{filename}`.

**Agentic framing (accurate sense):** **modular intelligence**—each stage has a narrow input/output contract and passes **structured artifacts** forward in a **deterministic chain**. Coordination is **orchestrated by imperative code** (`run_pipeline` → `process_audio` → persistence), not by autonomous agents negotiating plans.

---

## 2. Entry Points

| Surface | Route / trigger | Auth |
|--------|------------------|------|
| FastAPI | `POST /session/process` | JWT Bearer (`get_current_doctor`) |
| FastAPI | `POST /doctor/enroll`, `POST /doctor/login` | Public |
| FastAPI | `GET /patients`, `GET /patients/{id}/sessions` | JWT Bearer |
| Static | `GET /reports/{filename}` | PDF files from output dir |
| Web app | Consultation stop → `POST /session/process` (blocking); `API_BASE` in `web/lib/api.ts` | Bearer from `localStorage` |

---

## 3. Linear Execution Flow (Truth Path)

1. **Browser** sends multipart: audio file + `patient_name` → `POST /session/process`.
2. **Router** validates `audio/*`, enforces size limit, streams file to `TEMP_AUDIO_DIR`.
3. **`run_pipeline`** (`app/services/pipeline_service.py`): `load_models()`; load all `DoctorEmbedding` rows for doctor; **mean + L2-normalize** anchor tensor.
4. **`process_audio`** (`live_chunk_with_speaker.py`): Silero VAD → speech chunks; **per chunk**: faster-whisper ASR → ECAPA embedding → cosine-similarity labeling vs anchor (adaptive thresholds, voting, 3-chunk smoothing, short-segment rules, online centroids) → chunk transcript lines.
5. **`build_conversation_turns`**, `remove_fillers`, normalize `DOCTOR`/`OTHER` → `doctor`/`patient`.
6. **`generate_soap_note`** (`services/llm_service.py`): single HTTP call to configured LLM → SOAP JSON.
7. **`generate_pdf`** (`services/pdf_service.py`): HTML template → WeasyPrint bytes.
8. **DB transaction:** upsert `Patient` by `(doctor_id, name)`; insert `SessionModel`; write PDF file; insert `Report` with `conversation_json`, `soap_json`, `pdf_path`; `commit`.
9. **Response:** `{ conversation, soap, pdf_url }`; temp upload deleted in `finally`.

**Enrollment (separate flow):** `POST /doctor/enroll` saves three audio files, computes ECAPA embeddings per file, stores `Doctor` + `DoctorEmbedding` rows. Those vectors supply the anchor used later in step 3.

---

## 4. Agents — Mapping (Not Invention)

Each label maps to **real modules**. No separate OS processes per “agent”; all run in-process on the request.

| Agent label | Component(s) |
|-------------|----------------|
| **Access & session boundary** | `app/core/dependencies.py` (`get_current_doctor`), `app/services/auth_service.py` (JWT) |
| **Enrollment / voiceprint registration** | `app/routers/doctor.py` `POST /doctor/enroll`; `live_chunk_with_speaker.get_embedding`; `Doctor`, `DoctorEmbedding` models |
| **Audio ingestion** | `app/routers/session.py`: validation, `TEMP_AUDIO_DIR` temp file |
| **Pipeline orchestrator** | `app/services/pipeline_service.py` `run_pipeline` |
| **Segmentation agent** | `iter_speech_chunks` — Silero `get_speech_timestamps`, merge/split (1–8 s rules) |
| **Transcription agent** | `process_audio` loop — `faster-whisper` `transcribe` (`beam_size=1`, `temperature=0`), `clean_transcript` |
| **Speaker attribution agent** | Same loop — ECAPA `encode_batch`, cosine vs anchor/cluster, dynamic/bootstrap thresholds, vote deque (maxlen 3), 3-chunk `label_buffer`, short-segment inheritance, centroid updates |
| **Dialogue structuring agent** | `build_conversation_turns`, `remove_fillers`, speaker normalization |
| **Clinical documentation agent** | `services/llm_service.py` `generate_soap_note` |
| **Document generation agent** | `services/pdf_service.py` `generate_pdf` |
| **Persistence agent** | `run_pipeline` DB block — `Patient`, `SessionModel`, `Report`, PDF on disk |

---

## 5. Agent Responsibilities

### Access & session boundary

- **Input:** `Authorization: Bearer` token.
- **Processing:** Decode JWT; load `Doctor` from DB.
- **Output:** Doctor injected into route handlers.

### Enrollment / voiceprint registration

- **Input:** Three audio uploads; speaker model from registry.
- **Processing:** Full-file embedding per upload; password hash; persist rows.
- **Output:** `doctor_id`; enrollment embeddings for future anchor computation.

### Audio ingestion

- **Input:** Multipart `file`, `patient_name`.
- **Processing:** Content-type and size checks; UUID filename under temp dir.
- **Output:** Path to temp file (removed after pipeline).

### Pipeline orchestrator

- **Input:** Temp path, `doctor_id`, `patient_name`.
- **Processing:** Compute anchor from DB embeddings; call `process_audio(..., doctor_embedding=anchor)`; call PDF + DB persistence.
- **Output:** `conversation`, `soap`, on-disk `pdf_path`.

### Segmentation agent

- **Input:** `AudioSegment`, Silero VAD model.
- **Processing:** Speech timestamps → merged/split windows per `MIN_CHUNK_MS`, `MAX_CHUNK_MS`, `MERGE_*` constants.
- **Output:** Sequence of `(idx, AudioSegment)` chunks.

### Transcription agent

- **Input:** Per-chunk audio as in-memory WAV for Whisper.
- **Processing:** ASR; empty/noisy transcripts dropped via `clean_transcript`.
- **Output:** Text string per retained chunk.

### Speaker attribution agent

- **Input:** Chunk embedding; doctor anchor; rolling `similarity_window` (deque maxlen 10); `speaker_votes` (maxlen 3); `label_buffer` (maxlen 3); `previous_label`; `speaker_clusters` list.
- **Processing:** Cosine similarity; hard reject below `MIN_SIMILARITY`; dynamic threshold from mean/std of similarity window when enough samples; `BOOTSTRAP_THRESHOLD` for early chunks; high-confidence EMA on `doctor_anchor`; majority vote override; 3-chunk delayed smoothing for middle chunk; short segments inherit `previous_label`; online cluster centroid merge/split at 0.65 similarity.
- **Output:** Labeled chunk lines (`DOCTOR` / `OTHER`) feeding `conversation_chunks`.

### Dialogue structuring agent

- **Input:** Chunk-level speaker/text list.
- **Processing:** Merge consecutive same speaker; final filler removal; role labels for API/LLM.
- **Output:** Turn list `{ speaker: doctor \| patient, text }`.

### Clinical documentation agent

- **Input:** Normalized conversation JSON.
- **Processing:** HTTP request to LLM (provider selection via env / key prefix in code).
- **Output:** SOAP JSON (subjective, objective, assessment, plan).

### Document generation agent

- **Input:** Payload dict (conversation, SOAP, patient/doctor metadata, dates).
- **Processing:** Jinja2 HTML + WeasyPrint; vitals extraction from SOAP where applicable.
- **Output:** PDF bytes.

### Persistence agent

- **Input:** Pipeline outputs and ORM objects.
- **Processing:** Transactional insert/upsert; write PDF file; rollback on failure.
- **Output:** Committed DB rows; PDF path stored on `Report`.

---

## 6. Agent Interaction Narrative

- **Audio ingestion** materializes the upload so downstream stages read a single file path.
- **Pipeline orchestrator** reads enrollment-derived vectors from **persistence**, forms one **mean anchor**, and passes it into **segmentation** → **transcription** → **speaker attribution** as a single forward pass over chunks.
- **Segmentation** yields speech-bounded segments for **transcription** and **speaker attribution** (same chunk is both transcribed and embedded).
- **Speaker attribution** applies **adaptive decision logic** (rolling statistics, temporal smoothing, voting) and passes labeled fragments to **dialogue structuring**.
- **Dialogue structuring** produces a turn-structured dialogue for **clinical documentation**.
- **Clinical documentation** returns SOAP JSON to **document generation** and **persistence**.
- **Persistence** commits session metadata and stores transcript/SOAP JSON; **document generation** writes the printable artifact referenced by the API response.

Enrollment is a **separate one-time path**: **voiceprint registration** writes reference embeddings; later sessions **read** those rows—data dependency, not a runtime message bus.

---

## 7. System Intelligence Framing (Controlled)

You may describe, without overstating:

| Phenomenon in code | Safe framing |
|--------------------|--------------|
| Rolling `similarity_window` + mean/std threshold | Adaptive similarity thresholding |
| `label_buffer` middle-chunk rules | Temporal smoothing / context-aware label reconciliation |
| `speaker_votes` majority | Short-horizon consensus stabilization |
| EMA on `doctor_anchor` when `sim >= HIGH_CONFIDENCE` | Continuous refinement of the reference embedding |
| Online `speaker_clusters` centroids | Lightweight embedding-space grouping for stability |
| Short-segment inheritance | Context-aware attribution for unreliable micro-segments |

Avoid implying **reasoning**, **planning**, **self-awareness**, or **general intelligence**. The control flow is **deterministic policy code** over fixed features.

---

## 8. Why “Agentic” Is Defensible

1. **Task-specialized stages:** Each maps to a module with a narrow contract (VAD chunking, ASR, speaker scoring, turn building, LLM formatting, PDF, DB).
2. **Sequential collaboration:** Structured outputs flow through explicit interfaces (Python dicts/lists and DB rows).
3. **Coordinated processing:** One orchestrator composes stages; handoffs are **function calls and data**, not emergent multi-agent debate.
4. **Honest limits:** Single request thread; no cross-session in-memory “agent memory”; no replanning loop; LLM is **one** forward API call per consultation.

For demos: define **agent** as **specialized pipeline stage with clear I/O** and state that **coordination is programmatic**, not autonomous multi-agent autonomy.

---

## 9. Quick Reference — Modules

| Concern | Primary location |
|---------|------------------|
| HTTP API | `app/main.py`, `app/routers/*.py` |
| Session pipeline | `app/services/pipeline_service.py` |
| Audio + speaker + ASR loop | `backend/live_chunk_with_speaker.py` |
| Model singleton | `app/services/model_registry.py` |
| LLM SOAP | `services/llm_service.py` |
| PDF | `services/pdf_service.py` |
| Auth | `app/services/auth_service.py` |
| ORM | `app/db/models.py`, `app/db/session.py` |

---

*Document generated to align stakeholder messaging with the implemented Medvedev V2 stack.*
