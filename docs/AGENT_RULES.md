# MEDVEDEV V2 – AGENT RULES

This file defines mandatory behavioral, architectural, and safety rules
for any AI coding agent working on MEDVEDEV V2.

All agents must follow these rules strictly.

Violation of these rules is considered architectural corruption.

---

# 1. CORE PRINCIPLE

Stability > Elegance  
Clarity > Cleverness  
Minimal change > Refactor temptation  
Deterministic behavior > AI creativity  

This is an enterprise clinical documentation system.
It must behave predictably.

---

# 2. ARCHITECTURE DISCIPLINE

## 2.1 Strict Layer Separation

Project layers:

- app/api/ → HTTP layer only
- app/services/ → Business logic orchestration
- app/ml/ → Inference logic only
- app/documentation/ → Structuring + normalization
- app/models/ → Database models only
- app/schemas/ → Pydantic schemas only
- app/core/ → Config, auth, logging

Agents must NEVER:

- Put ML logic inside routers
- Put database queries inside ML modules
- Put business logic inside models
- Mix documentation logic into services unrelated to structuring
- Create circular imports

Routers call Services.
Services orchestrate ML + DB.
ML modules never call DB directly.
Documentation modules never perform raw inference.

---

# 3. MODEL LOADING RULES

- All heavy ML models must load at application startup.
- No model loading inside endpoints.
- No reinitialization per request.
- Use singleton pattern for model instances.
- GPU memory must be reused.

Never load:
- Whisper inside route handlers
- pyannote inside route handlers
- DeepFilterNet inside route handlers

---

# 4. LLM USAGE RULES

LLM is used ONLY for:

- Symptom extraction
- Hinglish normalization
- SOAP structuring

LLM must NOT:
- Suggest diagnosis
- Prescribe medication
- Provide medical advice
- Add hallucinated clinical facts

Strict requirements:

- temperature = 0
- Strict JSON output
- No extra keys allowed
- Server-side schema validation required
- Reject responses that violate schema

If diagnosis appears in output, remove before persistence.

---

# 5. DATABASE DISCIPLINE

- Use SQLAlchemy ORM.
- Do not mix raw SQL unless explicitly required.
- Enforce foreign keys.
- Sessions must belong to doctors.
- Transcript segments must belong to sessions.
- Structured notes must belong to sessions.

Never:
- Store partial session data.
- Leave inconsistent DB state.
- Commit half-complete transactions.

All writes must be atomic.

---

# 6. AUDIO PIPELINE ORDER (IMMUTABLE)

Processing order is fixed:

DeepFilterNet
→ Silero VAD
→ Rolling Window Buffer
→ pyannote Diarization
→ Speaker Embedding Extraction
→ Doctor Matching
→ Whisper Transcription

This order must not change.

---

# 7. PERFORMANCE RULES

- Use async endpoints.
- Heavy inference must run in background tasks.
- Avoid blocking main thread.
- No synchronous GPU-heavy operations inside request lifecycle.
- Monitor GPU memory usage.
- System must handle 5–10 minute consultation without crash.

---

# 8. SECURITY RULES

- JWT authentication required for protected routes.
- Password hashing using bcrypt.
- No plaintext passwords.
- No hardcoded secrets.
- Use environment variables.
- Validate session ownership before retrieval.

Never expose:
- Raw embeddings
- Internal thresholds
- Model internals

---

# 9. CODE QUALITY RULES

- Type hints mandatory.
- Pydantic schemas for all request/response models.
- Explicit error handling required.
- Logging required for major operations.
- No file larger than 300–400 lines.
- No giant monolithic modules.
- No unused imports.
- No commented-out dead code.

---

# 10. MINIMAL CHANGE POLICY (CRITICAL)

Agents must follow strict minimal-diff discipline.

## 10.1 Modify Only What Is Required

- Do not refactor unrelated code.
- Do not rename variables unless required.
- Do not reformat entire files.
- Do not restructure working modules.
- Do not optimize prematurely.

Every change must answer:
Why is this change necessary?

---

## 10.2 No Silent API Contract Changes

Agents must NOT:

- Change response schema without notice.
- Modify return types silently.
- Alter endpoint behavior without explicit instruction.
- Change DB schema without migration.

If API changes are required:
Clearly state them.

---

## 10.3 Backward Compatibility

Existing behavior must continue to work
unless explicitly instructed otherwise.

Database records must remain valid.
Endpoints must not break.

---

## 10.4 No Over-Engineering

Agents must NOT:

- Introduce new frameworks.
- Add dependencies without justification.
- Replace working code with "cleaner patterns".
- Convert sync to async unless necessary.
- Add abstractions without need.

Stability > architecture purity.

---

## 10.5 No Large Refactors

Agents must never:

- Rewrite entire modules.
- Collapse folder structure.
- Merge layers.
- Move files arbitrarily.
- Change directory layout.

Refactors require explicit instruction.

---

# 11. BUG PREVENTION CHECKLIST

Before generating code, agent must confirm:

1. Correct architectural layer?
2. No circular imports?
3. Type hints present?
4. Pydantic validation applied?
5. Proper error handling?
6. No model loading inside endpoint?
7. No schema drift?
8. No hidden breaking change?

If uncertain, ask before proceeding.

---

# 12. OUTPUT DISCIPLINE

When suggesting changes:

- Show only modified sections.
- Do not reprint entire files unnecessarily.
- Keep responses precise.
- Do not include unnecessary commentary.

---

# 13. NON-GOALS ENFORCEMENT

System must NOT:

- Suggest diagnoses.
- Recommend treatments.
- Provide medical reasoning beyond documentation.
- Act as clinical decision support.

This system creates documentation only.

---

# 14. SOURCE OF TRUTH

Agents must align with:

- PROJECT_MASTER.md
- ARCHITECTURE.md
- This AGENT_RULES.md

If conflict arises:
Follow PROJECT_MASTER.md.

---

This file defines the operational discipline of MEDVEDEV V2.

All agents must comply.