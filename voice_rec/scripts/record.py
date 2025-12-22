import sounddevice as sd
import soundfile as sf
from pathlib import Path

SAMPLE_RATE = 16000
DURATION = 3  # seconds

out_path = Path("../data/raw_audio/sample.wav")

print("Recording for 3 seconds...")
audio = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype="float32"
)
sd.wait()

sf.write(out_path, audio, SAMPLE_RATE)
print(f"Saved audio to {out_path}")
