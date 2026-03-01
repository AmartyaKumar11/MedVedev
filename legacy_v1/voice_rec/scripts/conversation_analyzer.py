import sounddevice as sd
import soundfile as sf
import torch
import numpy as np
import whisper
from pathlib import Path
from numpy.linalg import norm
from speechbrain.pretrained import EncoderClassifier
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import json
from datetime import datetime

# ================= CONFIG =================
SAMPLE_RATE = 16000
RECORD_SECONDS = 10
SILENCE_THRESH = -50  # dB (adjust based on mic) - more sensitive
MIN_SILENCE_LEN = 500  # ms (500ms of silence to split)
MIN_SEGMENT_LEN = 300  # ms (minimum speech segment)

# Paths
RAW_AUDIO = Path("../data/raw_audio/conversation.wav")
OUTPUT_DIR = Path("../data/outputs")
EMB_ROOT = Path("../data/embeddings_ecapa")
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
  
# ================= MODELS =================
print("⏳ Loading ECAPA-TDNN model...")
classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}
)
print("✅ ECAPA loaded")

print("⏳ Loading Whisper model...")
whisper_model = whisper.load_model("small")
print("✅ Whisper loaded\n")

# ================= AUDIO RECORDING =================
def record_conversation():
    """Record 10-second conversation"""
    print(f"\n🎤 Recording conversation for {RECORD_SECONDS} seconds...")
    print("Start talking now!")
    
    audio = sd.rec(
        int(RECORD_SECONDS * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )
    sd.wait()
    sf.write(RAW_AUDIO, audio, SAMPLE_RATE)
    print("✅ Conversation recorded\n")
    return RAW_AUDIO

# ================= AUDIO SEGMENTATION =================
def segment_audio_by_silence(audio_path):
    """Split audio based on silence detection"""
    print("🔍 Segmenting audio based on silence...")
    
    # Load audio with pydub
    audio = AudioSegment.from_wav(audio_path)
    
    # Detect non-silent chunks
    nonsilent_ranges = detect_nonsilent(
        audio,
        min_silence_len=MIN_SILENCE_LEN,
        silence_thresh=SILENCE_THRESH,
        seek_step=10
    )
    
    segments = []
    
    # If no segments detected, treat entire audio as one segment
    if not nonsilent_ranges:
        print("⚠️  No silence detected - processing entire audio as single segment")
        segments.append({
            'id': 0,
            'start_time': 0,
            'end_time': len(audio) / 1000.0,
            'duration': len(audio) / 1000.0,
            'audio_segment': audio
        })
    else:
        for i, (start_ms, end_ms) in enumerate(nonsilent_ranges):
            # Skip very short segments
            if (end_ms - start_ms) < MIN_SEGMENT_LEN:
                continue
                
            segment = {
                'id': i,
                'start_time': start_ms / 1000.0,  # convert to seconds
                'end_time': end_ms / 1000.0,
                'duration': (end_ms - start_ms) / 1000.0,
                'audio_segment': audio[start_ms:end_ms]
            }
            segments.append(segment)
    
    print(f"✅ Found {len(segments)} speech segments\n")
    return segments

# ================= SPEAKER RECOGNITION =================
def load_speaker_embeddings():
    """Load all enrolled speaker embeddings and compute centroids"""
    print("📂 Loading enrolled speakers...")
    
    speakers = {}
    for person_dir in EMB_ROOT.iterdir():
        if not person_dir.is_dir():
            continue
            
        embeddings = []
        for emb_file in person_dir.glob("*.npy"):
            embeddings.append(np.load(emb_file))
        
        if embeddings:
            # Compute centroid
            centroid = np.mean(embeddings, axis=0)
            speakers[person_dir.name] = {
                'centroid': centroid,
                'count': len(embeddings)
            }
    
    print(f"✅ Loaded {len(speakers)} speakers: {list(speakers.keys())}\n")
    return speakers

def get_embedding_from_segment(audio_segment):
    """Extract ECAPA embedding from audio segment"""
    # Convert pydub segment to numpy array
    samples = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
    
    # Normalize
    if samples.ndim > 1:
        samples = samples[:, 0]
    
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak
    
    # Convert to torch tensor
    wav = torch.tensor(samples).unsqueeze(0)
    
    # Get embedding
    embedding = classifier.encode_batch(wav).squeeze().numpy()
    return embedding

def identify_speaker(segment_embedding, speakers, threshold=0.70):
    """Match segment embedding to enrolled speakers"""
    best_name = "Unknown"
    best_score = -1
    all_scores = {}
    
    for speaker_name, speaker_data in speakers.items():
        centroid = speaker_data['centroid']
        
        # Cosine similarity
        score = np.dot(segment_embedding, centroid) / (norm(segment_embedding) * norm(centroid))
        all_scores[speaker_name] = round(score, 3)
        
        if score > best_score:
            best_score = score
            best_name = speaker_name
    
    # Always use the speaker with highest confidence (no threshold)
    # User requested to use highest confidence instead of "Unknown"
    
    return best_name, best_score, all_scores

def assign_speakers_to_segments(segments, speakers):
    """Identify speaker for each audio segment"""
    print("🎯 Identifying speakers for each segment...")
    
    for segment in segments:
        # Get embedding for this segment
        embedding = get_embedding_from_segment(segment['audio_segment'])
        
        # Identify speaker
        speaker, confidence, all_scores = identify_speaker(embedding, speakers)
        
        segment['speaker'] = speaker
        segment['confidence'] = round(confidence, 3)
        segment['all_scores'] = all_scores
        
        print(f"  Segment {segment['id']} ({segment['start_time']:.1f}s - {segment['end_time']:.1f}s)")
        print(f"    Scores: {all_scores}")
        print(f"    → Identified as: {speaker} (confidence: {segment['confidence']})")
    
    print()
    return segments

# ================= TRANSCRIPTION =================
def transcribe_conversation(audio_path):
    """Transcribe conversation using Whisper"""
    print("📝 Transcribing conversation with Whisper...")
    
    result = whisper_model.transcribe(
        str(audio_path),
        language="en",
        word_timestamps=True
    )
    
    print("✅ Transcription complete\n")
    return result

def align_transcript_with_speakers(transcript_result, speaker_segments):
    """Align Whisper transcript segments with speaker identification"""
    print("🔗 Aligning transcript with speakers...")
    
    aligned_transcript = []
    
    for whisper_segment in transcript_result['segments']:
        whisper_start = whisper_segment['start']
        whisper_end = whisper_segment['end']
        text = whisper_segment['text'].strip()
        
        # Find overlapping speaker segment (use midpoint)
        midpoint = (whisper_start + whisper_end) / 2
        
        assigned_speaker = "Unknown"
        best_overlap = 0
        
        for speaker_seg in speaker_segments:
            seg_start = speaker_seg['start_time']
            seg_end = speaker_seg['end_time']
            
            # Check if midpoint falls within speaker segment
            if seg_start <= midpoint <= seg_end:
                assigned_speaker = speaker_seg['speaker']
                break
            
            # Calculate overlap
            overlap_start = max(whisper_start, seg_start)
            overlap_end = min(whisper_end, seg_end)
            overlap = max(0, overlap_end - overlap_start)
            
            if overlap > best_overlap:
                best_overlap = overlap
                assigned_speaker = speaker_seg['speaker']
        
        aligned_transcript.append({
            'speaker': assigned_speaker,
            'text': text,
            'start': whisper_start,
            'end': whisper_end
        })
    
    print("✅ Alignment complete\n")
    return aligned_transcript

# ================= OUTPUT =================
def save_transcript(aligned_transcript, output_path):
    """Save formatted transcript to file"""
    print(f"💾 Saving transcript to {output_path.name}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("CONVERSATION TRANSCRIPT\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        
        current_speaker = None
        
        for item in aligned_transcript:
            speaker = item['speaker']
            text = item['text']
            
            # Group consecutive segments from same speaker
            if speaker != current_speaker:
                if current_speaker is not None:
                    f.write("\n")
                f.write(f"{speaker}: {text}\n")
                current_speaker = speaker
            else:
                # Continue same speaker's text
                f.write(f"{text}\n")
        
        f.write("\n" + "=" * 60 + "\n")
    
    print(f"✅ Transcript saved successfully!\n")

def save_detailed_json(segments, aligned_transcript, output_path):
    """Save detailed analysis as JSON"""
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'duration': RECORD_SECONDS,
        'speaker_segments': [
            {
                'id': seg['id'],
                'start_time': float(seg['start_time']),
                'end_time': float(seg['end_time']),
                'duration': float(seg['duration']),
                'speaker': seg['speaker'],
                'confidence': float(seg['confidence']),
                'all_scores': {k: float(v) for k, v in seg['all_scores'].items()}
            }
            for seg in segments
        ],
        'transcript': [
            {
                'speaker': item['speaker'],
                'text': item['text'],
                'start': float(item['start']),
                'end': float(item['end'])
            }
            for item in aligned_transcript
        ]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Detailed JSON saved to {output_path.name}\n")

# ================= MAIN PIPELINE =================
def analyze_conversation():
    """Main pipeline for conversation analysis"""
    print("\n" + "=" * 60)
    print("CONVERSATION ANALYZER")
    print("=" * 60 + "\n")
    
    # Step 1: Record conversation
    audio_path = record_conversation()
    
    # Step 2: Segment audio by silence
    segments = segment_audio_by_silence(audio_path)
    
    if not segments:
        print("❌ No speech segments detected. Try adjusting SILENCE_THRESH.")
        return
    
    # Step 3: Load enrolled speakers
    speakers = load_speaker_embeddings()
    
    if not speakers:
        print("❌ No enrolled speakers found. Please enroll speakers first.")
        return
    
    # Step 4: Identify speakers in each segment
    segments = assign_speakers_to_segments(segments, speakers)
    
    # Step 5: Transcribe conversation
    transcript_result = transcribe_conversation(audio_path)
    
    # Step 6: Align transcript with speakers
    aligned_transcript = align_transcript_with_speakers(transcript_result, segments)
    
    # Step 7: Save outputs with sequential numbering
    # Find next available conversation number
    existing_convos = sorted(OUTPUT_DIR.glob("convo_*.txt"))
    if existing_convos:
        # Extract numbers from existing files
        numbers = []
        for f in existing_convos:
            try:
                num = int(f.stem.split('_')[1])
                numbers.append(num)
            except (IndexError, ValueError):
                continue
        next_num = max(numbers) + 1 if numbers else 1
    else:
        next_num = 1
    
    txt_output = OUTPUT_DIR / f"convo_{next_num}.txt"
    json_output = OUTPUT_DIR / f"convo_{next_num}.json"
    
    save_transcript(aligned_transcript, txt_output)
    save_detailed_json(segments, aligned_transcript, json_output)
    
    print("=" * 60)
    print("✅ ANALYSIS COMPLETE!")
    print(f"📄 Text transcript: {txt_output}")
    print(f"📊 Detailed JSON: {json_output}")
    print("=" * 60 + "\n")

# ================= MAIN =================
if __name__ == "__main__":
    try:
        analyze_conversation()
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
