import time

import torch
from app.services.model_registry import load_models, registry

# Update this if your audio file lives elsewhere.
AUDIO_PATH = r"..\deepu-amartya.mp3"


def _is_cuda_oom(err: BaseException) -> bool:
    msg = str(err).lower()
    return "out of memory" in msg or "cuda error: out of memory" in msg or "cublas" in msg


def main() -> int:
    torch.cuda.empty_cache()
    start = time.perf_counter()

    try:
        load_models()
        model = registry.whisper_model
        if model is None:
            raise RuntimeError("Whisper model is not loaded.")

        segments, info = model.transcribe(
            AUDIO_PATH,
            beam_size=1,
        )

        transcript = "".join(seg.text for seg in segments).strip()
        elapsed = time.perf_counter() - start

        print(f"Detected language: {info.language} (p={info.language_probability:.3f})")
        print("\n--- Transcript ---\n")
        print(transcript)
        print("\n--- Stats ---\n")
        print(f"Time taken: {elapsed:.2f}s")
        print(f"torch.cuda.memory_allocated(): {torch.cuda.memory_allocated()}")
        print(f"torch.cuda.memory_reserved():  {torch.cuda.memory_reserved()}")
        return 0
    except RuntimeError as e:
        if _is_cuda_oom(e):
            torch.cuda.empty_cache()
            print("CUDA OOM during transcription. Try a smaller model or compute_type='int8_float16'.")
            print(f"torch.cuda.memory_allocated(): {torch.cuda.memory_allocated()}")
            print(f"torch.cuda.memory_reserved():  {torch.cuda.memory_reserved()}")
            return 3
        raise


if __name__ == "__main__":
    raise SystemExit(main())
