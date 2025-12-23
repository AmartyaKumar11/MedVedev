# Speaker-Aware Conversation Analyzer

A modular system that records conversations, identifies speakers using ECAPA-TDNN embeddings, and produces speaker-labeled transcripts using Whisper.

---

## Overview

This system records short conversations, identifies **who is speaking at each moment** using a speaker recognition model (ECAPA-TDNN), transcribes the speech using **Whisper**, and produces a **speaker-labeled transcript**.

The design separates **speaker identification** from **speech-to-text**, making the system modular, interpretable, and extensible.

---

## Features

- **Text-independent speaker recognition** using ECAPA-TDNN
- **Accurate transcription** with OpenAI Whisper
- **Speaker-aware transcript generation**
- **Overlapping audio chunking** for smooth speaker transitions
- **Centroid-based speaker enrollment** for robustness
- **Threshold-based identification** to prevent false positives

---

## Pipeline

1. **Record** conversation audio (10 seconds)
2. **Split** audio into overlapping chunks (2s chunks, 1s hop)
3. **Extract** speaker embeddings using ECAPA-TDNN
4. **Match** chunks to enrolled speaker centroids
5. **Build** time → speaker timeline
6. **Transcribe** full audio with Whisper
7. **Align** transcript segments with speaker timeline
8. **Output** speaker-labeled transcript

```
Microphone → Raw Audio → Overlapping Chunks → ECAPA Embeddings
    ↓
Speaker Timeline + Whisper Transcription → Speaker-Labeled Transcript
```

---

## Installation

### Prerequisites
- Python 3.8+
- FFmpeg (for audio processing)

### Setup

1. Clone the repository and navigate to the voice_rec folder
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install torch torchaudio
   pip install speechbrain
   pip install openai-whisper
   pip install sounddevice numpy scipy
   ```

---

## Project Structure

```
voice_rec/
├── scripts/
│   ├── conversation_analyzer.py   # Main pipeline (record → identify → transcribe)
│   ├── ecapa_pipeline.py           # Speaker enrollment / testing utilities
│   ├── enroll.py                   # Enroll new speaker embeddings
│   └── record.py                   # Standalone audio recording helper
│
├── data/
│   ├── conversations/              # Recorded audio files
│   │   └── convo.wav
│   │
│   ├── embeddings_ecapa/           # Speaker embeddings
│   │   ├── <speaker_name>/
│   │   │   ├── 1.npy               # Embedding sample 1
│   │   │   ├── 2.npy               # Embedding sample 2
│   │   │   └── 3.npy               # Embedding sample 3
│   │   └── ...
│   │
│   └── outputs/                    # Results
│       ├── convo_labeled.txt       # Speaker-labeled transcript
│       └── convo_segments.json     # Structured transcript with metadata
│
├── pretrained_models/              # ECAPA-TDNN model cache
│
└── README.md
```

---

## Usage

### 1. Enroll Speakers

Before running the analyzer, enroll each speaker by recording 3-5 audio samples:

```bash
python scripts/enroll.py
```

Follow the prompts:
- Enter speaker name
- Record 3-5 short audio samples (3-5 seconds each)
- Embeddings are saved to `data/embeddings_ecapa/<speaker_name>/`

### 2. Run Conversation Analyzer

```bash
python scripts/conversation_analyzer.py
```

The system will:
1. Record a 10-second conversation
2. Identify speakers in each audio chunk
3. Transcribe the audio
4. Generate speaker-labeled output

### 3. View Results

- **Labeled Transcript**: `data/outputs/convo_labeled.txt`
- **Detailed JSON**: `data/outputs/convo_segments.json`

Example output:
```
Deepu: Hi my name is Deepu
Receptionist: How can I help you today
Deepu: I want to book an appointment
```

---

## Configuration

Key parameters in `conversation_analyzer.py`:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `SAMPLE_RATE` | 16000 | Required by ECAPA & Whisper |
| `RECORD_SECONDS` | 10 | Total conversation length |
| `CHUNK_SIZE` | 2.0 | Duration per speaker chunk (seconds) |
| `CHUNK_HOP` | 1.0 | Overlap between chunks (seconds) |
| `SPEAKER_THRESHOLD` | 0.70 | Minimum similarity to accept identity |

---

## Models Used

### ECAPA-TDNN (Speaker Recognition)
- **Source**: `speechbrain/spkrec-ecapa-voxceleb`
- **Input**: Raw audio waveform
- **Output**: Fixed-length speaker embedding (192-dim)
- **Property**: Text-independent speaker recognition

### Whisper (Speech-to-Text)
- **Model Size**: `small`
- **Input**: Audio file
- **Output**: Transcribed text with timestamps
- **Property**: Speaker-agnostic transcription

---

## How It Works

### Speaker Enrollment
- Record 3-5 audio samples per speaker
- Extract ECAPA embeddings for each sample
- Store embeddings as `.npy` files
- At runtime, compute centroid (mean) of all embeddings

### Speaker Identification
1. Split audio into overlapping chunks (2s, hop 1s)
2. Extract ECAPA embedding for each chunk
3. Compare with all speaker centroids using cosine similarity
4. Assign speaker with highest similarity (if above threshold)
5. Label as "Unknown" if below threshold

### Transcript Alignment
1. Transcribe full audio with Whisper
2. For each transcript segment, find midpoint timestamp
3. Match to nearest speaker chunk in timeline
4. Assign speaker to transcript segment

---

## Design Decisions

1. **Speaker first, text later** – Avoids word bias in identification
2. **Centroids over single samples** – Improves robustness
3. **Overlapping chunks** – Smoother speaker transitions
4. **Thresholding** – Prevents false positives
5. **Midpoint alignment** – Simple and effective

---

## Limitations

- **Not a full diarization engine** – Fixed chunk size
- **No overlapping speech handling** – Single speaker per chunk
- **Not real-time** – Post-recording processing
- **10-second conversations** – Designed for short interactions

---

## Future Extensions

- [ ] Adaptive speaker change detection
- [ ] Auto-enrollment of unknown speakers
- [ ] Real-time streaming pipeline
- [ ] Multi-language support (Hindi + English)
- [ ] Domain-specific summarization (medical/meetings)
- [ ] Overlapping speech detection

---

## Troubleshooting

### Issue: "No module named 'speechbrain'"
**Solution**: Install SpeechBrain: `pip install speechbrain`

### Issue: "FFmpeg not found"
**Solution**: Install FFmpeg and add to PATH

### Issue: Poor speaker identification
**Solution**: 
- Enroll more samples per speaker (5+ recommended)
- Ensure clear audio during enrollment
- Adjust `SPEAKER_THRESHOLD` (try 0.65-0.75)

### Issue: "Unknown" speakers appearing
**Solution**: 
- Check if speaker is enrolled
- Lower `SPEAKER_THRESHOLD` slightly
- Re-enroll with better quality audio

---

## License

MIT License

---

## Acknowledgments

- **SpeechBrain** for ECAPA-TDNN speaker recognition
- **OpenAI Whisper** for speech-to-text
- **VoxCeleb** dataset for pretrained models

---

## Contact & Support

For questions or issues, please open an issue in the repository.
