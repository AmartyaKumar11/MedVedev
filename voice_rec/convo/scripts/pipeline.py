from record import *
from diarise import diarise
from transcribe import transcribe
from pathlib import Path

INPUT = Path("../input/conversation.wav")
OUT = Path("../output/conversation.txt")
OUT.parent.mkdir(exist_ok=True)

# 1️⃣ Record
print("=== RECORDING ===")
exec(open("record.py").read())

# 2️⃣ Diarise
print("=== DIARISING ===")
segments = diarise(INPUT)

# 3️⃣ Transcribe + write
print("=== TRANSCRIBING ===")
with open(OUT, "w", encoding="utf-8") as f:
    for seg in segments:
        text = transcribe(seg["audio"])
        if text:
            f.write(f"{seg['speaker']}: {text}\n")

print(f"✅ DONE → {OUT}")
