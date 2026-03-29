import time
from collections import deque
from io import BytesIO
from typing import Iterator
import json
import os

import re
import statistics
import torch
import torch.nn.functional as F
from faster_whisper import WhisperModel
from pydub import AudioSegment
from silero_vad import get_speech_timestamps, load_silero_vad
from speechbrain.inference import EncoderClassifier

from services.llm_service import generate_soap_note
from services.pdf_service import generate_pdf

VAD_SAMPLING_RATE = 16_000
MIN_CHUNK_MS = 1_000   # 1 second
MAX_CHUNK_MS = 8_000   # 8 seconds
MERGE_UNDER_MS = 800   # merge segment with next if shorter than this
MERGE_SMALL_CHUNK_MS = 1_200  # merge chunk with next if shorter than this (before ASR)

# Update these paths if your files live elsewhere.
AUDIO_PATH = r"..\deepu-amartya.mp3"
DOCTOR_ENROLL_PATH = r"..\doctor-amartya.mp3"

DOCTOR = "DOCTOR"
OTHER = "OTHER"

RMS_THRESHOLD = 0.008

HIGH_CONFIDENCE = 0.70
BASE_THRESHOLD = 0.58
MIN_SIMILARITY = 0.40
SMOOTH_MARGIN = 0.03
BOOTSTRAP_THRESHOLD = 0.50   # first 3 chunks use this before dynamic threshold stabilizes
SHORT_SEGMENT_MAX_SEC = 1.5  # chunks shorter than this inherit previous speaker label


def rms_energy(segment: AudioSegment) -> float:
    segment = segment.set_channels(1)
    samples = segment.get_array_of_samples()
    if len(samples) == 0:
        return 0.0
    x = torch.tensor(samples, dtype=torch.float32) / 32768.0
    return float(torch.sqrt(torch.mean(x * x)).item())


_FILLER_RE = re.compile(r"\b(um+|uh+|hmm+)\b", re.IGNORECASE)
FILLER_REGEX = re.compile(
    r"\b(um+|uh+|hmm+|erm+|ah+)\b",
    re.IGNORECASE,
)


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


def remove_fillers(text: str) -> str:
    text = FILLER_REGEX.sub("", text)
    text = " ".join(text.split())
    return text.strip()


def audiosegment_to_tensor(segment: AudioSegment) -> torch.Tensor:
    segment = segment.set_channels(1).set_frame_rate(16_000)
    samples = segment.get_array_of_samples()
    tensor = torch.tensor(samples, dtype=torch.float32) / 32768.0
    return tensor.unsqueeze(0)  # [1, num_samples]


def build_conversation_turns(chunks: list[dict[str, str]]) -> list[dict[str, str]]:
    turns: list[dict[str, str]] = []
    current_turn: dict[str, str] | None = None

    for c in chunks:
        speaker = c["speaker"]
        text = c["text"]
        if not text:
            continue
        if current_turn is None:
            current_turn = {"speaker": speaker, "text": text}
            continue
        if speaker == current_turn["speaker"]:
            current_turn["text"] += " " + text
        else:
            turns.append(current_turn)
            current_turn = {"speaker": speaker, "text": text}

    if current_turn:
        turns.append(current_turn)

    return turns


def iter_speech_chunks(
    audio: AudioSegment, vad_model
) -> Iterator[tuple[int, AudioSegment]]:
    """Yield (idx, chunk) for each VAD-based speech segment, with length rules applied."""
    tensor = audiosegment_to_tensor(audio).squeeze(0).cpu()
    speech_segments = get_speech_timestamps(
        tensor, vad_model, sampling_rate=VAD_SAMPLING_RATE
    )
    if not speech_segments:
        return
    # Convert to ms (pydub uses milliseconds).
    segments_ms = [
        (s["start"] * 1000 / VAD_SAMPLING_RATE, s["end"] * 1000 / VAD_SAMPLING_RATE)
        for s in speech_segments
    ]
    # Merge segments shorter than MERGE_UNDER_MS with the next segment.
    merged: list[tuple[float, float]] = []
    i = 0
    while i < len(segments_ms):
        start, end = segments_ms[i]
        while end - start < MERGE_UNDER_MS and i + 1 < len(segments_ms):
            i += 1
            _, next_end = segments_ms[i]
            end = next_end
        merged.append((start, end))
        i += 1
    # Split segments longer than MAX_CHUNK_MS into MAX_CHUNK_MS chunks.
    chunks_ms: list[tuple[float, float]] = []
    for start, end in merged:
        dur = end - start
        if dur <= MAX_CHUNK_MS:
            chunks_ms.append((start, end))
        else:
            s = start
            while s < end:
                e = min(s + MAX_CHUNK_MS, end)
                chunks_ms.append((s, e))
                s = e
    # Merge segments shorter than MIN_CHUNK_MS with the next to satisfy minimum length.
    final: list[tuple[float, float]] = []
    j = 0
    while j < len(chunks_ms):
        start, end = chunks_ms[j]
        while end - start < MIN_CHUNK_MS and j + 1 < len(chunks_ms):
            j += 1
            _, next_end = chunks_ms[j]
            end = next_end
        final.append((start, end))
        j += 1
    # Merge segments shorter than MERGE_SMALL_CHUNK_MS with the next (before ASR/embedding).
    merged_small: list[tuple[float, float]] = []
    k = 0
    while k < len(final):
        start, end = final[k]
        while end - start < MERGE_SMALL_CHUNK_MS and k + 1 < len(final):
            k += 1
            _, next_end = final[k]
            end = next_end
        merged_small.append((start, end))
        k += 1
    for idx, (start_ms, end_ms) in enumerate(merged_small):
        chunk = audio[int(start_ms) : int(end_ms)]
        if len(chunk) < 100:
            continue
        yield idx, chunk


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

    vad_model = load_silero_vad()

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
    doctor_anchor = doctor_emb.clone()
    doctor_cluster_centroid = doctor_emb.clone()
    doctor_cluster_size = 1
    speaker_clusters: list[dict[str, object]] = []

    previous_label = OTHER
    similarity_window: deque[float] = deque(maxlen=10)
    speaker_votes: deque[str] = deque(maxlen=3)
    # Sliding window (3 chunks) for temporal smoothing. Each entry: (idx, label, sim, text, cluster_id, elapsed, dynamic_threshold, effective_threshold).
    label_buffer: deque[tuple[int, str, float, str, int, float, float, float]] = deque(maxlen=3)
    last_printed_idx: int | None = None  # avoid duplicate prints when flushing
    conversation_chunks: list[dict[str, str]] = []

    for idx, chunk in iter_speech_chunks(main_audio, vad_model):
        chunk_start = time.perf_counter()

        chunk = chunk.normalize()

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
        sim = float(F.cosine_similarity(doctor_anchor, chunk_emb, dim=0).item())
        sim_doctor_cluster = float(
            F.cosine_similarity(doctor_cluster_centroid, chunk_emb, dim=0).item()
        )

        # Ignore very low similarities for thresholding and force OTHER.
        hard_reject = sim < MIN_SIMILARITY
        if hard_reject:
            label = OTHER
            dynamic_threshold = BASE_THRESHOLD
        else:
            if sim > 0.45:
                similarity_window.append(sim)

            if len(similarity_window) < 5:
                dynamic_threshold = BASE_THRESHOLD
            elif len(similarity_window) >= 2:
                mean_sim = statistics.fmean(similarity_window)
                std_sim = statistics.pstdev(similarity_window)
                dynamic_threshold = mean_sim - 0.5 * std_sim
            elif similarity_window:
                dynamic_threshold = similarity_window[0]
            else:
                dynamic_threshold = BASE_THRESHOLD

            effective_threshold = max(BASE_THRESHOLD, dynamic_threshold)
            use_threshold = BOOTSTRAP_THRESHOLD if idx < 3 else effective_threshold

            if sim >= HIGH_CONFIDENCE:
                label = DOCTOR
                doctor_anchor = 0.9 * doctor_anchor + 0.1 * chunk_emb
                doctor_anchor = F.normalize(doctor_anchor, p=2, dim=-1)
            elif sim >= use_threshold:
                label = DOCTOR
            elif previous_label == DOCTOR and sim >= use_threshold - SMOOTH_MARGIN:
                label = DOCTOR
            else:
                label = DOCTOR if sim_doctor_cluster >= 0.65 else OTHER

        speaker_votes.append(label)
        if not hard_reject and speaker_votes.count(DOCTOR) >= 2:
            label = DOCTOR

        # Short-segment speaker inheritance: very small segments inherit previous label.
        chunk_duration_sec = len(chunk) / 1000.0
        if chunk_duration_sec < SHORT_SEGMENT_MAX_SEC:
            label = previous_label

        # Lightweight online clustering for stability (optional).
        cluster_id: int | None = None
        best_cluster_sim = -1.0
        for i, c in enumerate(speaker_clusters):
            centroid = c["centroid"]
            c_sim = float(F.cosine_similarity(centroid, chunk_emb, dim=0).item())
            if c_sim > best_cluster_sim:
                best_cluster_sim = c_sim
                cluster_id = i

        if cluster_id is None or best_cluster_sim <= 0.65:
            speaker_clusters.append({"centroid": chunk_emb.clone(), "size": 1})
            cluster_id = len(speaker_clusters) - 1
        else:
            c = speaker_clusters[cluster_id]
            size = int(c["size"])
            centroid = c["centroid"]
            new_centroid = (centroid * size + chunk_emb) / (size + 1)
            c["centroid"] = F.normalize(new_centroid, p=2, dim=-1)
            c["size"] = size + 1

        if label == DOCTOR:
            doctor_cluster_centroid = (
                doctor_cluster_centroid * doctor_cluster_size + chunk_emb
            ) / (doctor_cluster_size + 1)
            doctor_cluster_centroid = F.normalize(doctor_cluster_centroid, p=2, dim=-1)
            doctor_cluster_size += 1

        elapsed = time.perf_counter() - chunk_start

        # Append current chunk to sliding window (idx, label, sim, text, cluster_id, elapsed, dynamic_threshold, effective_threshold).
        effective_threshold = max(BASE_THRESHOLD, dynamic_threshold) if not hard_reject else BASE_THRESHOLD
        label_buffer.append((idx, label, sim, text, cluster_id, elapsed, dynamic_threshold, effective_threshold))

        # When we have 3 labels, output the middle chunk once with smoothing rules (no duplicate prints).
        if len(label_buffer) == 3:
            prev_entry, mid_entry, next_entry = label_buffer[0], label_buffer[1], label_buffer[2]
            prev_label, mid_label, next_label = prev_entry[1], mid_entry[1], next_entry[1]
            mid_sim = mid_entry[2]
            mid_eff = mid_entry[7]
            # 1. High confidence: always DOCTOR, skip all smoothing.
            if mid_sim >= HIGH_CONFIDENCE:
                out_label = DOCTOR
            # 2. Above threshold: never override to OTHER.
            elif mid_sim >= mid_eff:
                out_label = DOCTOR
            # 3. Borderline only: temporal smoothing if prev and next are DOCTOR.
            elif 0.45 <= mid_sim < mid_eff and prev_label == DOCTOR and next_label == DOCTOR:
                out_label = DOCTOR
            else:
                out_label = mid_label
            m_idx, _, m_sim, m_text, m_cid, m_elapsed, m_dt, _ = mid_entry
            print(f"\n[Chunk {m_idx}]")
            print(f"Similarity: {m_sim:.3f}")
            print(f"Dynamic Threshold: {m_dt:.3f}")
            print(f"Cluster ID: {m_cid}")
            print(f"Speaker: {out_label}")
            print(f"Transcript: {m_text}")
            print(f"Processing time: {m_elapsed:.2f}s")
            last_printed_idx = m_idx
            conversation_chunks.append({"speaker": out_label, "text": m_text})
            label_buffer.popleft()

        previous_label = label

    # Flush remaining buffered chunks (each chunk printed only once).
    while label_buffer:
        m_idx, m_label, m_sim, m_text, m_cid, m_elapsed, m_dt, m_eff = label_buffer.popleft()
        if last_printed_idx is not None and m_idx == last_printed_idx:
            continue
        if m_sim >= HIGH_CONFIDENCE or m_sim >= m_eff:
            flush_label = DOCTOR
        else:
            flush_label = m_label
        print(f"\n[Chunk {m_idx}]")
        print(f"Similarity: {m_sim:.3f}")
        print(f"Dynamic Threshold: {m_dt:.3f}")
        print(f"Cluster ID: {m_cid}")
        print(f"Speaker: {flush_label}")
        print(f"Transcript: {m_text}")
        print(f"Processing time: {m_elapsed:.2f}s")
        conversation_chunks.append({"speaker": flush_label, "text": m_text})

    total_elapsed = time.perf_counter() - start_total
    print(f"\nTotal processing time: {total_elapsed:.2f}s")

    # Build conversation turns.
    conversation_turns = build_conversation_turns(conversation_chunks)

    # Apply final filler removal for LLM-facing output.
    for turn in conversation_turns:
        turn["text"] = remove_fillers(turn["text"])

    # Normalize speaker labels for API / LLM.
    normalized_conversation: list[dict[str, str]] = []
    for turn in conversation_turns:
        speaker = turn["speaker"]
        if speaker == DOCTOR:
            norm_speaker = "doctor"
        else:
            norm_speaker = "patient"
        normalized_conversation.append(
            {"speaker": norm_speaker, "text": turn["text"]}
        )

    result = {"conversation": normalized_conversation}

    soap_output = generate_soap_note(normalized_conversation)
    print("\n=== SOAP OUTPUT ===\n")
    print(json.dumps(soap_output, indent=2, ensure_ascii=False))

    # Print clean conversation view.
    if normalized_conversation:
        print("\n=== Conversation Transcript ===\n")
        for turn in normalized_conversation:
            display = "Doctor" if turn["speaker"] == "doctor" else "Patient"
            print(f"{display}:")
            print(turn["text"])
            print()

    # Export structured conversation and SOAP JSON in output/ (overwrite each run).
    os.makedirs("output", exist_ok=True)
    output_path = os.path.join("output", "conversation_output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    soap_path = os.path.join("output", "soap_output.json")
    with open(soap_path, "w", encoding="utf-8") as f:
        json.dump(soap_output, f, indent=2, ensure_ascii=False)

    try:
        pdf_bytes = generate_pdf(soap_output)
        report_path = os.path.join("output", "report.pdf")
        with open(report_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"\nWrote PDF: {report_path}")
    except Exception as e:
        print(f"\nPDF generation failed: {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

