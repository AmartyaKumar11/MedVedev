import sounddevice as sd
import soundfile as sf
from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path
import numpy as np
from numpy.linalg import norm

# ---------------- CONFIG ----------------
SAMPLE_RATE = 16000
DURATION = 7
ENERGY_THRESHOLD = 1e-4

RAW_AUDIO = Path("../data/raw_audio/sample.wav")
EMB_ROOT = Path("../data/embeddings")
EMB_ROOT.mkdir(exist_ok=True)

# ---------------- HELPERS ----------------
def record_audio():
    print("\n🎤 Recording for 3 seconds...")
    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )
    sd.wait()
    sf.write(RAW_AUDIO, audio, SAMPLE_RATE)
    print("✅ Audio recorded\n")


def has_speech(wav):
    return np.mean(wav ** 2) > ENERGY_THRESHOLD


def get_embedding(encoder):
    wav = preprocess_wav(RAW_AUDIO)

    if not has_speech(wav):
        print("❌ No speech detected. Try again.")
        return None

    return encoder.embed_utterance(wav)


# ---------------- ENROLL ----------------
def enroll(encoder):
    name = input("Enter person name: ").strip().lower().replace(" ", "_")
    person_dir = EMB_ROOT / name
    person_dir.mkdir(exist_ok=True)

    embedding = get_embedding(encoder)
    if embedding is None:
        return

    existing = list(person_dir.glob("*.npy"))
    new_id = len(existing) + 1
    np.save(person_dir / f"{new_id}.npy", embedding)

    print(f"✅ Enrolled '{name}' (sample #{new_id})")


# ---------------- RECOGNIZE ----------------
def recognize(encoder):
    embedding = get_embedding(encoder)
    if embedding is None:
        return

    best_name = None
    best_score = -1

    for person_dir in EMB_ROOT.iterdir():
        if not person_dir.is_dir():
            continue

        scores = []
        for emb_file in person_dir.glob("*.npy"):
            enrolled = np.load(emb_file)
            score = np.dot(embedding, enrolled) / (
                norm(embedding) * norm(enrolled)
            )
            scores.append(score)

        avg_score = float(np.mean(scores))
        if avg_score > best_score:
            best_score = avg_score
            best_name = person_dir.name

    if best_score >= 0.80:
        print(f"✅ Recognized: {best_name}")
        print(f"Confidence: {round(best_score, 3)}")
    else:
        print("❓ Unknown speaker")
        print(f"Confidence: {round(best_score, 3)}")


# ---------------- MAIN ----------------
def main():
    encoder = VoiceEncoder()

    while True:
        print("\n--- Voice Pipeline ---")
        print("1) Enroll person")
        print("2) Recognize speaker")
        print("3) Exit")

        choice = input("Choose option: ").strip()

        if choice == "1":
            record_audio()
            enroll(encoder)

        elif choice == "2":
            record_audio()
            recognize(encoder)

        elif choice == "3":
            print("👋 Exiting.")
            break

        else:
            print("❌ Invalid option")


if __name__ == "__main__":
    main()
