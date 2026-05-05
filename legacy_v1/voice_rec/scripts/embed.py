from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path

# Path to the recorded audio
wav_path = Path("../data/raw_audio/sample.wav")

# Load model
encoder = VoiceEncoder()

# Preprocess audio
wav = preprocess_wav(wav_path)

# Generate embedding
embedding = encoder.embed_utterance(wav)

print("Embedding shape:", embedding.shape)
print("First 10 values:", embedding[:10])
