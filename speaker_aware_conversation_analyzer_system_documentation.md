# Speaker‑Aware Conversation Analyzer

## 1. Overview
This system records a short conversation, identifies **who is speaking at each moment** using a speaker‑recognition model (ECAPA‑TDNN), transcribes the speech using **Whisper**, and then produces a **speaker‑labeled transcript**.

The design separates **speaker identification** from **speech‑to‑text**, making the system modular, interpretable, and extensible.

---

## 2. High‑Level Pipeline

**Audio Flow**:

1. Record conversation audio (10 seconds)
2. Split audio into overlapping chunks
3. Extract speaker embeddings (ECAPA)
4. Match chunks to enrolled speaker centroids
5. Build a time → speaker timeline
6. Transcribe full audio with Whisper
7. Align transcript segments with speaker timeline
8. Output labeled transcript

```
Microphone
   ↓
Raw Audio (10s)
   ↓
Overlapping Chunks (2s, hop 1s)
   ↓
ECAPA Embeddings
   ↓
Speaker Timeline
   ↓
Whisper Transcription
   ↓
Speaker‑Labeled Transcript
```

---

## 3. Configuration Parameters

| Parameter | Purpose |
|---------|--------|
| `SAMPLE_RATE = 16000` | Required by ECAPA & Whisper |
| `RECORD_SECONDS = 10` | Total conversation length |
| `CHUNK_SIZE = 2.0` | Duration per speaker chunk |
| `CHUNK_HOP = 1.0` | Overlap between chunks |
| `SPEAKER_THRESHOLD = 0.70` | Minimum similarity to accept identity |

Overlapping chunks provide smoother speaker transitions and reduce boundary errors.

---

## 4. Models Used

### 4.1 ECAPA‑TDNN (Speaker Recognition)
- Source: `speechbrain/spkrec-ecapa-voxceleb`
- Input: Raw audio waveform
- Output: Fixed‑length speaker embedding (voice signature)
- Property: **Text‑independent** (speaker identity does not depend on words spoken)

ECAPA embeddings from the same person cluster closely in embedding space.

### 4.2 Whisper (Speech‑to‑Text)
- Model size: `small`
- Input: Audio file
- Output: Transcribed text + timestamps
- Property: **Speaker‑agnostic** (does not identify who is speaking)

---

## 5. Speaker Enrollment & Centroids

Each enrolled speaker has a folder:
```
data/embeddings_ecapa/<speaker_name>/
   emb1.npy
   emb2.npy
   emb3.npy
```

At runtime:
- All embeddings per speaker are loaded
- A **centroid embedding** is computed using the mean

**Why centroids?**
- Reduce noise
- Reduce phrase dependency
- Improve robustness

---

## 6. Audio Chunking

The recorded audio is split into overlapping chunks:

```
Chunk 1: 0s – 2s
Chunk 2: 1s – 3s
Chunk 3: 2s – 4s
...
```

Each chunk is:
- Normalized
- Embedded with ECAPA
- Compared against all speaker centroids

This creates a **speaker timeline**:
```
(time → speaker)
0.0s → Deepu
1.0s → Deepu
2.0s → Unknown
3.0s → Receptionist
```

---

## 7. Speaker Identification Logic

For each chunk:
1. Extract ECAPA embedding
2. Compute cosine similarity with every centroid
3. Select highest‑scoring speaker
4. Apply thresholding

If the highest score < threshold → speaker is labeled **Unknown**.

This prevents false positives.

---

## 8. Transcription with Whisper

Whisper transcribes the **entire audio file** and returns segments:

```json
{
  "start": 0.5,
  "end": 1.9,
  "text": "Hi my name is Deepu"
}
```

Each segment has precise timestamps but no speaker information.

---

## 9. Speaker–Text Alignment

For every Whisper segment:
1. Compute midpoint time
2. Find the closest speaker chunk in time
3. Assign that speaker to the text

This heuristic works well because:
- Whisper segments are short
- Speaker timeline is dense (1‑second resolution)

---

## 10. Final Output

Example output:
```
Deepu: Hi my name is Deepu
Receptionist: How can I help you
Deepu: I want to book an appointment
```

This is **speaker‑aware transcription**.

---

## 11. What This System Is (and Is Not)

### ✔ Is
- Speaker‑aware transcription
- Text‑independent speaker recognition
- Modular and debuggable
- Suitable for interviews, meetings, clinics

### ✘ Is Not
- Full diarization engine
- Overlapping speech resolver
- Real‑time streaming system

---

## 12. Design Decisions (Key Points)

1. **Speaker first, text later** – avoids word bias
2. **Centroids over single samples** – stability
3. **Overlapping chunks** – smoother speaker changes
4. **Thresholding** – prevents hallucinated identities
5. **Midpoint alignment** – simple and effective

---

## 13. Possible Extensions

- Speaker change detection (no fixed chunks)
- Auto‑enrollment of unknown speakers
- Real‑time streaming pipeline
- Hindi + English mixed transcription
- Domain‑specific summarization (medical / meetings)

---

## 14. Folder Structure & File Organization

The project follows a clear, modular directory structure to separate **models**, **data**, **scripts**, and **outputs**.

```
voice_rec/
├── scripts/
│   ├── conversation_analyzer.py   # Main pipeline (record → identify → transcribe)
│   ├── ecapa_pipeline.py           # Speaker enrollment / testing utilities
│   ├── enroll.py                   # Enroll new speaker embeddings
│   └── record.py                   # Standalone audio recording helper
│
├── data/
│   ├── conversations/
│   │   └── convo.wav               # Last recorded conversation audio
│   │
│   ├── embeddings_ecapa/
│   │   ├── <speaker_name>/
│   │   │   ├── emb1.npy             # Speaker embedding sample 1
│   │   │   ├── emb2.npy             # Speaker embedding sample 2
│   │   │   └── ...
│   │   └── <another_speaker>/
│   │       ├── emb1.npy
│   │       └── emb2.npy
│   │
│   └── outputs/
│       ├── convo_labeled.txt       # Final speaker-labeled transcript
│       └── convo_segments.json     # Structured transcript with timestamps & scores
│
├── pretrained_models/
│   └── EncoderClassifier-*         # Downloaded ECAPA-TDNN model files
│
├── venv/                           # Python virtual environment
│
└── README.md                       # (Optional) Project overview
```

---

### Folder Responsibilities

**scripts/**
- Contains all executable Python logic
- No data is permanently stored here

**data/conversations/**
- Stores raw recorded audio files
- Overwritten on each new run unless renamed

**data/embeddings_ecapa/**
- Persistent speaker identity store
- Each subfolder represents one enrolled speaker
- `.npy` files are ECAPA speaker embeddings

**data/outputs/**
- Final human-readable and machine-readable results
- Safe to archive, export, or post-process

**pretrained_models/**
- Cached pretrained models (ECAPA)
- Avoids re-downloading on every run

**venv/**
- Isolated Python environment
- Ensures dependency consistency

---

## 15. Summary

This system cleanly separates **voice identity** and **language understanding**, producing reliable, interpretable speaker‑labeled transcripts using modern pretrained models.

