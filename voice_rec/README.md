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
- **Silence-based audio segmentation** for natural speech boundaries
- **Highest-confidence speaker assignment** for all segments
- **Centroid-based speaker enrollment** for robustness
- **Sequential file naming** (convo_1, convo_2, ...) for easy tracking

---

## Pipeline

1. **Record** conversation audio (10 seconds)
2. **Segment** audio by silence detection (dynamic speech segments)
3. **Extract** speaker embeddings using ECAPA-TDNN for each segment
4. **Match** segments to enrolled speaker centroids (highest confidence)
5. **Transcribe** full audio with Whisper
6. **Align** transcript segments with speaker timeline
7. **Output** speaker-labeled transcript (sequential naming: convo_1, convo_2, ...)

```
Microphone → Raw Audio → Silence-Based Segmentation → ECAPA Embeddings
    ↓
Speaker Timeline + Whisper Transcription → Speaker-Labeled Transcript
    ↓
Sequential Files: convo_1.txt, convo_1.json
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
│       ├── convo_1.txt              # First conversation transcript
│       ├── convo_1.json             # First conversation details
│       ├── convo_2.txt              # Second conversation transcript
│       ├── convo_2.json             # Second conversation details
│       └── ...                      # Sequential numbering continues
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

- **Labeled Transcript**: `data/outputs/convo_1.txt`, `convo_2.txt`, etc.
- **Detailed JSON**: `data/outputs/convo_1.json`, `convo_2.json`, etc.

Each run automatically creates the next numbered conversation file.

Example output:
```
trial: Hi, hello hello
deeepu: Talk to me bro
```

---

## Configuration

Key parameters in `conversation_analyzer.py`:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `SAMPLE_RATE` | 16000 | Required by ECAPA & Whisper |
| `RECORD_SECONDS` | 10 | Total conversation length |
| `SILENCE_THRESH` | -50 dB | Threshold for silence detection |
| `MIN_SILENCE_LEN` | 500 ms | Minimum silence duration to split |
| `MIN_SEGMENT_LEN` | 300 ms | Minimum speech segment length |
| `SPEAKER_THRESHOLD` | N/A | Always uses highest confidence speaker |

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
1. Segment audio using silence detection (pydub)
2. Fallback to full audio if no silence detected
3. Extract ECAPA embedding for each segment
4. Compare with all speaker centroids using cosine similarity
5. Always assign speaker with highest confidence score
6. Display all speaker scores for transparency

### Transcript Alignment
1. Transcribe full audio with Whisper
2. For each transcript segment, find midpoint timestamp
3. Match to nearest speaker segment in timeline
4. Assign speaker to transcript segment

---

## Design Decisions

1. **Speaker first, text later** – Avoids word bias in identification
2. **Centroids over single samples** – Improves robustness
3. **Silence-based segmentation** – Natural speech boundaries
4. **Highest confidence assignment** – No "Unknown" labels, always identifies best match
5. **Sequential file naming** – Easy tracking of conversation history
6. **Midpoint alignment** – Simple and effective

---

## Limitations

- **Not a full diarization engine** – Silence-based segmentation
- **No overlapping speech handling** – Single speaker per segment
- **Not real-time** – Post-recording processing
- **10-second conversations** – Designed for short interactions
- **Always assigns a speaker** – No threshold filtering for unknown voices

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
- Check similarity scores in output for debugging

### Issue: Wrong speaker assigned
**Solution**: 
- System always assigns highest confidence speaker
- Check all_scores in JSON output to see competing scores
- Re-enroll with better quality audio if scores are too close

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
