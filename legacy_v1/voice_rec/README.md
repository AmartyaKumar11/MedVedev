# PRJ3 Voice Recognition System

A modern **Streamlit-based** real-time speaker recognition and transcription system with GPU acceleration. Identifies speakers using ECAPA-TDNN embeddings and transcribes speech using OpenAI Whisper with live visualization.

---

## Overview

This system provides a **web-based UI** for real-time conversation transcription with automatic speaker identification. It uses **ECAPA-TDNN** for voice recognition and **Whisper** for speech-to-text, with full GPU acceleration support.

Key capabilities:
- **Live transcription mode** with real-time speaker identification
- **Multi-language support** (English, Hindi, Spanish, French, and 99+ more)
- **Model selection** (Tiny to Large Whisper models)
- **Audio device selection** (choose microphone and speakers)
- **Speaker enrollment** through simple voice samples
- **Automatic highest-confidence assignment** - always identifies the most likely speaker

---

## Features

### 🎤 Live Mode
- **Real-time transcription** with 3-second audio chunks
- **Speaker identification** with confidence scores and similarity metrics
- **Live transcript display** with auto-refresh
- **Color-coded speakers** (identified in blue, unknown in gray)
- **Debug mode** showing all speaker similarity scores
- **Auto-save** conversations when stopped

### ➕ Voice Enrollment
- **Simple 5-second recording** for voice samples
- **Multiple samples** per person for better accuracy
- **Visual progress** during recording
- **Instant feedback** on enrollment success

### 🤖 Model Settings
- **Whisper model selector**: Tiny, Base, Small (default), Medium, Large
- **Language selector**: Auto-detect, English, Hindi, and 99+ languages
- **Dynamic model loading** with one-click reload

### 🎛️ Audio Settings
- **Microphone selection** from all available input devices
- **Speaker selection** from all available output devices
- **Default device indicators**

### 📁 Transcript Management
- **Sequential naming** (convo_1, convo_2, etc.)
- **Dual format** (.txt for reading, .json for analysis)
- **Built-in viewer** with expandable transcripts
- **Download capability** for all saved conversations

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **UI Framework** | Streamlit | Modern web interface |
| **Speaker Recognition** | SpeechBrain ECAPA-TDNN | Voice identification |
| **Speech-to-Text** | OpenAI Whisper | Multilingual transcription |
| **Audio Processing** | sounddevice, pydub | Real-time audio capture |
| **Similarity Metric** | Cosine Similarity | Speaker matching |
| **GPU Acceleration** | PyTorch CUDA | Fast inference |

---

## Installation

### Prerequisites
- Python 3.10+
- NVIDIA GPU with CUDA support (optional but recommended)
- FFmpeg (for audio processing)

### Setup

1. **Clone and navigate**:
   ```bash
   cd voice_rec
   ```

2. **Install dependencies**:
   ```bash
   pip install streamlit sounddevice soundfile pydub
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   pip install openai-whisper speechbrain huggingface-hub==0.20.0
   ```

3. **Run the application**:
   ```bash
   streamlit run PRJ3_voice.py
   ```

4. **Access the web interface**:
   - Open your browser to `http://localhost:8501`

---

## Usage

### 1. Enroll Speakers

Navigate to the **"Add New Voice"** tab:
1. Enter the speaker's name
2. Click **"Record Voice Sample"**
3. Speak clearly for 5 seconds
4. Repeat 2-3 times for better accuracy

### 2. Configure Settings

In the **sidebar**:
- Select **Whisper model** (Small recommended for RTX 3060)
- Choose **language** (Auto-detect or specific language)
- Select **microphone** from available devices

### 3. Start Live Recording

In the **"Live Mode"** tab:
1. Click **"▶️ Start Live Recording"**
2. Speak naturally - transcripts appear in real-time
3. See speaker names, confidence scores, and similarity metrics
4. Click **"⏹️ Stop Recording"** to save

### 4. View Transcripts

In the **"View Transcripts"** tab:
- Browse all saved conversations
- Expand to view full content
- Download any transcript

---
---

## Project Structure

```
voice_rec/
├── PRJ3_voice.py                   # Main Streamlit application
├── requirements.txt                # Python dependencies
├── README.md                       # This file
│
├── data/
│   ├── embeddings_ecapa/           # Enrolled speaker voice prints
│   │   ├── <speaker_name>/
│   │   │   ├── 1.npy              # Voice embedding sample 1
│   │   │   ├── 2.npy              # Voice embedding sample 2
│   │   │   └── 3.npy              # Voice embedding sample 3
│   │
│   ├── outputs/                    # Saved transcripts
│   │   ├── convo_1.txt            # Human-readable transcript
│   │   ├── convo_1.json           # Detailed conversation data
│   │   └── ...
│   │
│   └── raw_audio/                  # Temporary audio files
│       └── temp_live.wav
│
├── pretrained_models/              # Downloaded model cache
│   └── ecapa-voxceleb/
│
└── scripts/                        # Legacy/utility scripts
    ├── conversation_analyzer.py
    ├── ecapa_pipeline.py
    └── ...
```

---

## Technical Details

### Speaker Recognition
- **Model**: ECAPA-TDNN (SpeechBrain implementation)
- **Embedding dimension**: 192
- **Similarity metric**: Cosine similarity
- **Recognition threshold**: 0.50 (adjustable)
- **Strategy**: Always assigns highest-confidence speaker

### Speech-to-Text
- **Models available**: Tiny (39M), Base (74M), Small (244M), Medium (769M), Large (1550M)
- **Default**: Small (balanced speed/accuracy)
- **Languages**: 99+ supported with auto-detection
- **Chunk duration**: 3 seconds for live mode
- **Format**: 16kHz mono audio

### Audio Processing
- **Sample rate**: 16,000 Hz
- **Channels**: 1 (mono)
- **Format**: float32
- **Silence detection**: -50 dB threshold
- **Min segment**: 300ms

---

## GPU Support

The system automatically detects and uses NVIDIA GPUs:
- **CUDA detection**: Automatic
- **Model acceleration**: Both ECAPA-TDNN and Whisper
- **Recommended VRAM**:
  - Tiny/Base: 1-2 GB
  - Small: 2-3 GB
  - Medium: 4-6 GB
  - Large: 6-10 GB

**RTX 3060 (6GB)**: Recommended to use Small or Medium models

---

## Troubleshooting

### No speakers detected
- Make sure you've enrolled at least one speaker
- Check `data/embeddings_ecapa/` folder has speaker directories

### Always showing "Unknown"
- Lower the threshold (currently 0.50)
- Enroll more voice samples per speaker
- Check debug scores to see actual similarity values

### Live mode not working
- Verify microphone permissions
- Select correct input device in sidebar
- Check terminal for error messages

### Slow transcription
- Switch to smaller Whisper model (Base or Tiny)
- Ensure GPU is being detected (check sidebar)
- Close other GPU-intensive applications

### Import errors
- Install compatible version: `pip install huggingface-hub==0.20.0`
- Update SpeechBrain: `pip install --upgrade speechbrain`

---

## Performance

### Whisper Model Comparison

| Model | Size | VRAM | Speed | Accuracy |
|-------|------|------|-------|----------|
| Tiny | 39M | ~500MB | Very Fast | Good |
| Base | 74M | ~1GB | Fast | Better |
| **Small** | 244M | ~2GB | **Balanced** | **Great** |
| Medium | 769M | ~5GB | Slow | Excellent |
| Large | 1550M | ~10GB | Very Slow | Best |

### Real-time Performance (RTX 3060)
- **Small model**: ~2-3 seconds processing per 3-second chunk
- **Speaker recognition**: <100ms per segment
- **Total latency**: 2-5 seconds (near real-time)

---

## Future Enhancements

- [ ] Multi-speaker diarization without enrollment
- [ ] Custom threshold slider in UI
- [ ] Audio playback with speaker highlighting
- [ ] Export to SRT/VTT subtitle formats
- [ ] Real-time noise reduction
- [ ] Batch processing mode
- [ ] Speaker profile management (delete/rename)

---

## Credits

- **OpenAI Whisper**: Speech recognition
- **SpeechBrain**: Speaker recognition (ECAPA-TDNN)
- **Streamlit**: Web interface framework
- **PyTorch**: Deep learning backend

---

## License

This project is for educational and research purposes.

---

## Author

Developed as part of PRJ-3 project suite
- Face Recognition System → `facemod/`
- Voice Recognition System → `voice_rec/` (this project)

Last Updated: January 29, 2026

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
