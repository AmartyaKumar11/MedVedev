import warnings

try:
    import torch
    _torch_available = True
except ImportError:
    torch = None  # type: ignore[assignment]
    _torch_available = False

try:
    from faster_whisper import WhisperModel
    _whisper_available = True
except ImportError:
    WhisperModel = None  # type: ignore[assignment, misc]
    _whisper_available = False

try:
    from silero_vad import load_silero_vad
    _silero_available = True
except ImportError:
    load_silero_vad = None  # type: ignore[assignment]
    _silero_available = False

try:
    from speechbrain.inference import EncoderClassifier
    _speechbrain_available = True
except ImportError:
    EncoderClassifier = None  # type: ignore[assignment, misc]
    _speechbrain_available = False


class ModelRegistry:
    whisper_model = None
    spk_model = None
    vad_model = None
    device = None


registry = ModelRegistry()


def load_models() -> None:
    if not _torch_available:
        warnings.warn(
            "torch is not installed — ML transcription features disabled. "
            "Install PyTorch + faster-whisper + silero-vad + speechbrain to enable.",
            stacklevel=2,
        )
        return

    if registry.whisper_model is not None and registry.spk_model is not None and registry.vad_model is not None:
        return

    if not torch.cuda.is_available():
        warnings.warn(
            "CUDA GPU not available — ML transcription features disabled. "
            "A CUDA-capable GPU is required to run the AI models.",
            stacklevel=2,
        )
        return

    registry.device = torch.device("cuda")

    registry.whisper_model = WhisperModel(
        "small",
        device="cuda",
        compute_type="float16",
    )

    registry.spk_model = EncoderClassifier.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        run_opts={"device": "cuda"},
    )

    registry.vad_model = load_silero_vad()

