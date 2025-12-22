import os
os.environ["SPEECHBRAIN_SKIP_TORCHAUDIO_CHECK"] = "1"

import numpy as np
import soundfile as sf
from pathlib import Path
from numpy.linalg import norm
from speechbrain.pretrained import EncoderClassifier

FS = 16000
CHUNK_SEC = 1.5

EMB_ROOT = Path("../../data/embeddings").resolve()
CHUNK_DIR = Path("../chunks").resolve()
CHUNK_DIR.mkdir(exist_ok=True)

classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir="pretrained_models/ecapa"
)

def load_centroids():
    centroids = {}
    for person in EMB_ROOT.iterdir():
        embs = [np.load(f) for f in person.glob("*.npy")]
        if embs:
            centroids[person.name] = np.mean(embs, axis=0)
    return centroids

def diarise(audio_path):
    audio, sr = sf.read(audio_path)
    assert sr == FS

    centroids = load_centroids()
    segments = []

    samples_per_chunk = int(CHUNK_SEC * FS)

    for i in range(0, len(audio), samples_per_chunk):
        chunk = audio[i:i+samples_per_chunk]
        if len(chunk) < samples_per_chunk // 2:
            continue

        chunk_path = CHUNK_DIR / f"chunk_{i}.wav"
        sf.write(chunk_path, chunk, FS)

        emb = classifier.encode_batch(chunk).squeeze().numpy()

        best_speaker = None
        best_score = -1

        for name, ref in centroids.items():
            score = np.dot(emb, ref) / (norm(emb) * norm(ref))
            if score > best_score:
                best_score = score
                best_speaker = name

        segments.append({
            "speaker": best_speaker,
            "audio": chunk_path
        })

    return segments
