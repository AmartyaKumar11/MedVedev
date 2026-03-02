# MEDVEDEV V2 – PROJECT MASTER

## 1. System Identity

MEDVEDEV V2 is a multilingual clinical conversation intelligence system that converts noisy, multi-speaker consultations into structured, EHR-ready documentation.

This is NOT:
- A diagnosis engine
- A prescription system
- A medical decision automation tool

This IS:
- A structured clinical documentation assistant

Primary differentiator:
Vague multilingual expressions (English + Hindi + Hinglish) are normalized into structured clinical meaning.

Example:
"pet mein gudgud ho raha hai"
→ abdominal discomfort
→ mapped into SOAP subjective section

---

## 2. Phase Structure

### Phase 1 (Month 1)
Goal: Build stable, production-grade backend engine.

Deliverables:
- Noise removal
- 3–4 speaker neural diarization
- Doctor voice anchoring
- Multilingual transcription
- Structured transcript storage
- SOAP draft generation
- Full PostgreSQL persistence
- Session retrieval

### Phase 2 (Month 2)
Goal: Enterprise hardening.

Deliverables:
- Documentation refinement
- Security hardening
- Audit logging
- Export formats (PDF + JSON)
- Deployment packaging
- Performance optimization

---

## 3. Locked Features (Phase 1 + 2 Combined)

### Audio Intelligence
- DeepFilterNet denoising
- Silero VAD
- Rolling 5–8 sec window buffering
- pyannote neural diarization
- Stable 3–4 speaker separation
- Overlap handling

### Doctor Voice Anchoring
- Doctor registration + login
- One-time voice enrollment
- Multiple embeddings stored
- Centroid profile generation
- Cosine similarity matching
- Automatic Doctor role labeling

### Transcription
- faster-whisper large-v3 INT8
- English + Hindi + Hinglish
- Timestamped segments
- Language auto-detection

### Documentation Intelligence
- Gemini API
- Symptom extraction
- Hinglish normalization
- Structured SOAP generation
- Strict JSON schema
- No hallucinated fields
- No medical advice

### Database
- PostgreSQL
- Doctor
- DoctorVoiceProfile
- Session
- TranscriptSegment
- StructuredNote

### Security
- JWT authentication
- Password hashing
- Role-based session access
- Structured logging

---

## 4. Non-Goals

The system will NOT:
- Suggest diagnoses
- Prescribe medication
- Replace clinical judgment
- Perform autonomous decision-making
- Use vector database (for now)
- Deploy to cloud (Phase 1)

---

## 5. Performance Targets

- 5–10 minute consultation supported
- 3–4 speakers stable separation
- < 3–5 sec rolling latency
- No GPU OOM on RTX 4050 (6GB VRAM)
- All models warm-loaded at startup

---

## 6. Design Rules

1. Strict modular architecture
2. No legacy_v1 reuse
3. No model loading inside endpoints
4. All heavy ML runs in service layer
5. No business logic inside routers
6. Strict JSON validation for LLM outputs
7. No hallucinated schema keys allowed
8. All sessions persisted
9. Clean logging
10. Deterministic prompting (temperature = 0)

---

## 7. Success Criteria (End of Phase 1)

Doctor can:
1. Log in
2. Conduct consultation
3. System separates speakers
4. System recognizes doctor role
5. System generates SOAP draft
6. System stores everything
7. Retrieve past sessions

System stable under 10-minute consultation.

---

This document defines MEDVEDEV V2.
All agents must follow it strictly. 