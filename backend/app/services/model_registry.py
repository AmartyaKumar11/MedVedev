import torch
from faster_whisper import WhisperModel
from silero_vad import load_silero_vad
from speechbrain.inference import EncoderClassifier


class ModelRegistry:
    whisper_model = None
    spk_model = None
    vad_model = None
    device = None


registry = ModelRegistry()


def load_models() -> None:
    if registry.whisper_model is not None and registry.spk_model is not None and registry.vad_model is not None:
        return

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA required")

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

