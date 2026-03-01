import sounddevice as sd
import soundfile as sf
import torch
import numpy as np
from pathlib import Path
from numpy.linalg import norm
from speechbrain.pretrained import EncoderClassifier

# ================= CONFIG =================
SAMPLE_RATE = 16000
DURATION = 7              # good for name + spelling
USE_SPEECH_GATE = False   # ❌ OFF for earphone mic
SPEECH_PEAK_THRESHOLD = 0.005  # used only if gate is ON

RAW_AUDIO = Path("../data/raw_audio/sample.wav")
EMB_ROOT = Path("../data/embeddings_ecapa")
EMB_ROOT.mkdir(exist_ok=True, parents=True)

# ================= MODEL =================
print("⏳ Loading ECAPA-TDNN model...")
classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}  # change to "cuda" if GPU later
)
print("✅ Model loaded\n")

# ================= AUDIO =================
def record_audio():
    print(f"\n🎤 Recording for {DURATION} seconds...")
    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )
    sd.wait()
    sf.write(RAW_AUDIO, audio, SAMPLE_RATE)
    print("✅ Audio saved")

def has_speech(wav):
    """Soft gate (OPTIONAL). Disabled by default."""
    return np.max(np.abs(wav)) > SPEECH_PEAK_THRESHOLD

def get_embedding():
    wav, sr = sf.read(RAW_AUDIO)

    if wav.ndim > 1:
        wav = wav[:, 0]

    # 🔑 NORMALIZATION (CRITICAL FOR EARPHONE MIC)
    peak = np.max(np.abs(wav))
    if peak > 0:
        wav = wav / peak

    # Optional gate (OFF by default)
    if USE_SPEECH_GATE and not has_speech(wav):
        print("❌ No speech detected (gate)")
        return None

    wav = torch.tensor(wav).unsqueeze(0)
    embedding = classifier.encode_batch(wav).squeeze().numpy()
    return embedding

# ================= ENROLL =================
def enroll():
    name = input("Enter person name: ").strip().lower().replace(" ", "_")
    person_dir = EMB_ROOT / name
    person_dir.mkdir(exist_ok=True)

    embedding = get_embedding()
    if embedding is None:
        return

    existing = list(person_dir.glob("*.npy"))
    np.save(person_dir / f"{len(existing)+1}.npy", embedding)

    print(f"✅ Enrolled '{name}' (sample #{len(existing)+1})")

# ================= RECOGNIZE =================
def recognize():
    test_emb = get_embedding()
    if test_emb is None:
        return

    if not any(EMB_ROOT.iterdir()):
        print("❌ No enrolled speakers found.")
        return

    best_name = None
    best_score = -1

    for person_dir in EMB_ROOT.iterdir():
        embeddings = []

        for emb_file in person_dir.glob("*.npy"):
            embeddings.append(np.load(emb_file))

        if not embeddings:
            continue

        if len(embeddings) == 1:
            # ⚠️ Single-sample fallback
            ref = embeddings[0]
            score = np.dot(test_emb, ref) / (norm(test_emb) * norm(ref))
            threshold = 0.78  # stricter
        else:
            # ✅ Centroid mode
            centroid = np.mean(embeddings, axis=0)
            score = np.dot(test_emb, centroid) / (norm(test_emb) * norm(centroid))
            threshold = 0.70

        print(f"{person_dir.name} → score: {round(score, 3)}")

        if score > best_score:
            best_score = score
            best_name = person_dir.name
            best_threshold = threshold

    print("\n--- RESULT ---")
    if best_score >= best_threshold:
        print(f"✅ Recognized: {best_name}")
        print("Confidence:", round(best_score, 3))
    else:
        print("❓ Unknown speaker")
        print("Confidence:", round(best_score, 3))


# ================= MAIN LOOP =================
def main():
    while True:
        print("\n--- ECAPA Voice Pipeline ---")
        print("1) Enroll")
        print("2) Recognize")
        print("3) Exit")

        choice = input("Choose: ").strip()

        if choice == "1":
            record_audio()
            enroll()
        elif choice == "2":
            record_audio()
            recognize()
        elif choice == "3":
            print("👋 Exiting")
            break
        else:
            print("❌ Invalid option")

if __name__ == "__main__":
    main()
