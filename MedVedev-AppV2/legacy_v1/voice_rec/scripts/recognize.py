from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path
import numpy as np
from numpy.linalg import norm

def has_speech(wav, min_energy=1e-4):
    return np.mean(wav ** 2) > min_energy

wav_path = Path("../data/raw_audio/sample.wav")
emb_root = Path("../data/embeddings")

encoder = VoiceEncoder()
wav = preprocess_wav(wav_path)

if not has_speech(wav):
    print("❌ No speech detected.")
    exit(1)

test_embedding = encoder.embed_utterance(wav)

best_name = None
best_score = -1

for person_dir in emb_root.iterdir():
    if not person_dir.is_dir():
        continue

    scores = []

    for emb_file in person_dir.glob("*.npy"):
        enrolled = np.load(emb_file)
        score = np.dot(test_embedding, enrolled) / (
            norm(test_embedding) * norm(enrolled)
        )
        scores.append(score)

    avg_score = float(np.mean(scores))

    if avg_score > best_score:
        best_score = avg_score
        best_name = person_dir.name

if best_score >= 0.80:
    print("✅ Recognized speaker:", best_name)
    print("Confidence:", round(best_score, 3))
else:
    print("❓ Unknown speaker")
    print("Confidence:", round(best_score, 3))
