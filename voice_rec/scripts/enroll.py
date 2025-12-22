from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path
import numpy as np

def has_speech(wav, min_energy=1e-4):
    return np.mean(wav ** 2) > min_energy

name = input("Enter person name: ").strip().lower().replace(" ", "_")

wav_path = Path("../data/raw_audio/sample.wav")
emb_root = Path("../data/embeddings")
person_dir = emb_root / name
person_dir.mkdir(parents=True, exist_ok=True)

encoder = VoiceEncoder()
wav = preprocess_wav(wav_path)

if not has_speech(wav):
    print("❌ No speech detected. Speak clearly.")
    exit(1)

embedding = encoder.embed_utterance(wav)

existing = list(person_dir.glob("*.npy"))
new_id = len(existing) + 1

np.save(person_dir / f"{new_id}.npy", embedding)

print(f"✅ Enrolled '{name}' sample #{new_id}")
