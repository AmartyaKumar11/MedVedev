import sounddevice as sd
import soundfile as sf
import numpy as np
import torch
from pathlib import Path
from numpy.linalg import norm
from speechbrain.pretrained import EncoderClassifier
import whisper

# ================= CONFIG =================
SAMPLE_RATE = 16000
RECORD_SECONDS = 10

CHUNK_SIZE = 2.0     # seconds
CHUNK_HOP = 1.0      # seconds overlap

SPEAKER_THRESHOLD = 0.70
from pathlib import Path

CONVO_AUDIO = Path("../data/conversations/convo.wav")

CONVO_AUDIO.parent.mkdir(parents=True, exist_ok=True)

EMB_ROOT = Path("../data/embeddings_ecapa")

# ================= MODELS =================
print("⏳ Loading ECAPA...")
ecapa = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}
)

print("⏳ Loading Whisper...")
whisper_model = whisper.load_model("small")

# ================= RECORD =================
def record_conversation():
    print(f"\n🎤 Recording conversation for {RECORD_SECONDS} seconds...")
    audio = sd.rec(
        int(RECORD_SECONDS * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )
    sd.wait()
    sf.write(CONVO_AUDIO, audio, SAMPLE_RATE)
    print("✅ Conversation saved")

# ================= LOAD CENTROIDS =================
def load_speaker_centroids():
    centroids = {}

    for person_dir in EMB_ROOT.iterdir():
        embs = []
        for f in person_dir.glob("*.npy"):
            embs.append(np.load(f))

        if len(embs) >= 2:
            centroids[person_dir.name] = np.mean(embs, axis=0)

    return centroids

# ================= CHUNKING =================
def split_audio(wav):
    total_len = len(wav) / SAMPLE_RATE
    chunks = []

    t = 0
    while t + CHUNK_SIZE <= total_len:
        start = int(t * SAMPLE_RATE)
        end = int((t + CHUNK_SIZE) * SAMPLE_RATE)
        chunks.append((t, wav[start:end]))
        t += CHUNK_HOP

    return chunks

# ================= SPEAKER ID =================
def identify_speakers(wav, centroids):
    speaker_timeline = []

    chunks = split_audio(wav)

    for start_time, chunk in chunks:
        if np.max(np.abs(chunk)) == 0:
            continue

        chunk = chunk / np.max(np.abs(chunk))  # normalize
        emb = ecapa.encode_batch(
            torch.tensor(chunk).unsqueeze(0)
        ).squeeze().numpy()

        best_speaker = "Unknown"
        best_score = -1

        for name, centroid in centroids.items():
            score = np.dot(emb, centroid) / (norm(emb) * norm(centroid))
            if score > best_score:
                best_score = score
                best_speaker = name

        if best_score < SPEAKER_THRESHOLD:
            best_speaker = "Unknown"

        speaker_timeline.append((start_time, best_speaker))

    return speaker_timeline

# ================= TRANSCRIPTION =================
def transcribe():
    return whisper_model.transcribe(
        str(CONVO_AUDIO),
        language="en",
        fp16=False
    )

# ================= MERGE =================
def merge(transcript, speaker_timeline):
    results = []

    for seg in transcript["segments"]:
        mid_time = (seg["start"] + seg["end"]) / 2

        # find nearest speaker chunk
        closest = min(
            speaker_timeline,
            key=lambda x: abs(x[0] - mid_time)
        )

        results.append(f"{closest[1]}: {seg['text']}")

    return results

# ================= MAIN =================
def main():
    record_conversation()

    wav, _ = sf.read(CONVO_AUDIO)
    if wav.ndim > 1:
        wav = wav[:, 0]

    centroids = load_speaker_centroids()
    speaker_timeline = identify_speakers(wav, centroids)
    transcript = transcribe()
    labeled = merge(transcript, speaker_timeline)

    print("\n--- LABELED TRANSCRIPT ---\n")
    for line in labeled:
        print(line)

if __name__ == "__main__":
    main()
