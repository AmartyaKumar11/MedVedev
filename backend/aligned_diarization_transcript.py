from pyannote.audio import Pipeline
from faster_whisper import WhisperModel

AUDIO_PATH = "..\GAS0003.mp3"


def transcribe(path: str):
    model = WhisperModel("small", device="cuda", compute_type="float16")
    segments, _info = model.transcribe(path, beam_size=1, word_timestamps=False)
    out = []
    for seg in segments:
        out.append((float(seg.start), float(seg.end), seg.text.strip()))
    return out


def diarize(path: str):
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
    diarization = pipeline(path)
    out = []
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        out.append((float(segment.start), float(segment.end), str(speaker)))
    return out


def align(whisper_segs, spk_segs):
    def overlap(a_start, a_end, b_start, b_end):
        return min(a_end, b_end) - max(a_start, b_start)

    for ws, we, text in whisper_segs:
        best_label = "UNKNOWN"
        best_ov = 0.0
        for ds, de, spk in spk_segs:
            ov = overlap(ws, we, ds, de)
            if ov > 0 and ov > best_ov:
                best_ov = ov
                best_label = spk
        print(f"[{ws:.2f} - {we:.2f}] {best_label}: {text}")


def main() -> int:
    whisper_segments = transcribe(AUDIO_PATH)
    speaker_segments = diarize(AUDIO_PATH)
    align(whisper_segments, speaker_segments)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

