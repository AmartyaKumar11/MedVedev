import time
from io import BytesIO

import re
import torch
import torch.nn.functional as F
from faster_whisper import WhisperModel
from pydub import AudioSegment
from speechbrain.inference import EncoderClassifier

# Update these paths if your files live elsewhere.
AUDIO_PATH = r"..\deepu-amartya.mp3"
DOCTOR_ENROLL_PATH = r"..\doctor-amartya.mp3"

DOCTOR = "DOCTOR"
OTHER = "OTHER"

RMS_THRESHOLD = 0.008


def rms_energy(segment: AudioSegment) -> float:
    segment = segment.set_channels(1)
    samples = segment.get_array_of_samples()
    if len(samples) == 0:
        return 0.0
    x = torch.tensor(samples, dtype=torch.float32) / 32768.0
    return float(torch.sqrt(torch.mean(x * x)).item())


_FILLER_RE = re.compile(r"\b(um+|uh+|hmm+)\b", re.IGNORECASE)


def mostly_non_ascii(text: str, ascii_ratio_threshold: float = 0.7) -> bool:
    chars = [c for c in text if not c.isspace()]
    if not chars:
        return False
    ascii_count = sum(1 for c in chars if ord(c) < 128)
    return (ascii_count / len(chars)) < ascii_ratio_threshold


def clean_transcript(text: str) -> str:
    text = _FILLER_RE.sub("", text)
    text = " ".join(text.split()).strip()
    if len(text) < 3:
        return ""
    if mostly_non_ascii(text):
        return ""
    return text


def audiosegment_to_tensor(segment: AudioSegment) -> torch.Tensor:
    segment = segment.set_channels(1).set_frame_rate(16_000)
    samples = segment.get_array_of_samples()
    tensor = torch.tensor(samples, dtype=torch.float32) / 32768.0
    return tensor.unsqueeze(0)  # [1, num_samples]


def iter_chunks(audio: AudioSegment, chunk_ms: int):
    total_ms = len(audio)
    idx = 0
    for start in range(0, total_ms, chunk_ms):
        end = min(start + chunk_ms, total_ms)
        yield idx, audio[start:end]
        idx += 1


def get_embedding(
    classifier: EncoderClassifier, segment: AudioSegment, device: torch.device
) -> torch.Tensor:
    wav = audiosegment_to_tensor(segment).to(device)
    with torch.no_grad():
        emb = classifier.encode_batch(wav)
    if emb.ndim == 3:
        emb = emb.mean(dim=1)
    emb = emb.squeeze(0)
    return F.normalize(emb, p=2, dim=-1)


def main() -> int:
    if not torch.cuda.is_available():
        print("CUDA is not available. This script requires an NVIDIA GPU + CUDA.")
        return 2

    device = torch.device("cuda")
    start_total = time.perf_counter()

    print(f"Loading enrollment audio from {DOCTOR_ENROLL_PATH!r}...")
    enroll_audio = AudioSegment.from_file(DOCTOR_ENROLL_PATH)

    print(f"Loading main audio from {AUDIO_PATH!r}...")
    main_audio = AudioSegment.from_file(AUDIO_PATH)

    print("Loading WhisperModel 'small' on CUDA...")
    asr_model = WhisperModel(
        "small",
        device="cuda",
        compute_type="float16",
    )

    print("Loading SpeechBrain ECAPA-TDNN (speechbrain/spkrec-ecapa-voxceleb)...")
    spk_model = EncoderClassifier.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        run_opts={"device": str(device)},
    )

    doctor_emb = get_embedding(spk_model, enroll_audio, device)

    chunk_ms = 3_000  # 3 seconds
    previous_label = OTHER

    for idx, chunk in iter_chunks(main_audio, chunk_ms):
        chunk_start = time.perf_counter()

        if rms_energy(chunk) < RMS_THRESHOLD:
            continue

        # Prepare audio for ASR (in-memory WAV).
        buf = BytesIO()
        chunk.export(buf, format="wav")
        buf.seek(0)

        segments, _info = asr_model.transcribe(
            buf,
            language="en",
            beam_size=1,
            temperature=0,
        )

        text = clean_transcript("".join(seg.text for seg in segments))
        if not text:
            continue

        # Speaker embedding and similarity.
        chunk_emb = get_embedding(spk_model, chunk, device)
        sim = float(F.cosine_similarity(doctor_emb, chunk_emb, dim=0).item())

        if sim > 0.65:
            label = DOCTOR
        elif previous_label == DOCTOR and sim > 0.55:
            label = DOCTOR
        else:
            label = OTHER

        previous_label = label

        elapsed = time.perf_counter() - chunk_start

        print(f"\n[Chunk {idx}]")
        print(f"Similarity: {sim:.3f} -> {label}")
        print(f"Transcript: {text}")
        print(f"Processing time: {elapsed:.2f}s")

    total_elapsed = time.perf_counter() - start_total
    print(f"\nTotal processing time: {total_elapsed:.2f}s")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

