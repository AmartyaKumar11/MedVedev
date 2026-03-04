import time
from io import BytesIO

from faster_whisper import WhisperModel
from pydub import AudioSegment

# Update this to point to your MP3 file if needed.
AUDIO_PATH = r"..\GAS0003.mp3"


def iter_chunks(audio: AudioSegment, chunk_ms: int):
    total_ms = len(audio)
    idx = 0
    for start in range(0, total_ms, chunk_ms):
        end = min(start + chunk_ms, total_ms)
        yield idx, audio[start:end]
        idx += 1


def main() -> int:
    start_total = time.perf_counter()

    print(f"Loading audio from {AUDIO_PATH!r}...")
    audio = AudioSegment.from_file(AUDIO_PATH)

    print("Loading WhisperModel 'small' on CUDA...")
    model = WhisperModel(
        "small",
        device="cuda",
        compute_type="float16",
    )

    chunk_duration_ms = 5_000  # 5 seconds

    for idx, chunk in iter_chunks(audio, chunk_duration_ms):
        chunk_start = time.perf_counter()

        # Export chunk to in-memory WAV.
        buf = BytesIO()
        chunk.export(buf, format="wav")
        buf.seek(0)

        segments, _info = model.transcribe(
            buf,
            beam_size=1,
        )

        text = "".join(seg.text for seg in segments).strip()
        chunk_elapsed = time.perf_counter() - chunk_start

        print(f"\n[Chunk {idx}]")
        print(f"Processing time: {chunk_elapsed:.2f}s")
        print(f"Transcript: {text}")

        # Simulate near real-time arrival of audio.
        time.sleep(1.0)

    total_elapsed = time.perf_counter() - start_total
    print(f"\nTotal processing time: {total_elapsed:.2f}s")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

