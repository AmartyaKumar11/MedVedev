from pyannote.audio import Pipeline

AUDIO_PATH = r"..\GAS0003.mp3"


def main() -> int:
    try:
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1"
        )
    except Exception as e:
        print(f"Failed to load diarization model: {e}")
        return 1

    try:
        diarization = pipeline(AUDIO_PATH)
    except Exception as e:
        print(f"Failed to run diarization: {e}")
        return 1

    for segment, _, speaker in diarization.itertracks(yield_label=True):
        print(f"{segment.start:.2f} - {segment.end:.2f} | {speaker}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

