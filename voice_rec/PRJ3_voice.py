import streamlit as st
import sounddevice as sd
import soundfile as sf
import torch
import numpy as np
import whisper
from pathlib import Path
from numpy.linalg import norm
from speechbrain.inference.speaker import EncoderClassifier
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import json
from datetime import datetime
import threading
import queue
import time
import io
from multiprocessing import Manager

# ================= CONFIG =================
SAMPLE_RATE = 16000
ENROLL_DURATION = 5  # seconds for enrollment
SILENCE_THRESH = -50
MIN_SILENCE_LEN = 500
MIN_SEGMENT_LEN = 300

# Paths
BASE_DIR = Path(__file__).parent
RAW_AUDIO_DIR = BASE_DIR / "data" / "raw_audio"
OUTPUT_DIR = BASE_DIR / "data" / "outputs"
EMB_ROOT = BASE_DIR / "data" / "embeddings_ecapa"

RAW_AUDIO_DIR.mkdir(exist_ok=True, parents=True)
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
EMB_ROOT.mkdir(exist_ok=True, parents=True)

# ================= SESSION STATE INIT =================
if 'recording' not in st.session_state:
    st.session_state.recording = False
if 'live_transcript' not in st.session_state:
    st.session_state.live_transcript = []
if 'audio_queue' not in st.session_state:
    st.session_state.audio_queue = queue.Queue()
if 'stop_recording' not in st.session_state:
    st.session_state.stop_recording = False
if 'models_loaded' not in st.session_state:
    st.session_state.models_loaded = False
if 'selected_input_device' not in st.session_state:
    st.session_state.selected_input_device = None
if 'selected_output_device' not in st.session_state:
    st.session_state.selected_output_device = None
if 'whisper_model_size' not in st.session_state:
    st.session_state.whisper_model_size = 'small'
if 'transcription_language' not in st.session_state:
    st.session_state.transcription_language = 'auto'

# ================= AUDIO DEVICE FUNCTIONS =================
def get_audio_devices():
    """Get list of available input and output audio devices"""
    devices = sd.query_devices()
    
    input_devices = []
    output_devices = []
    
    for idx, device in enumerate(devices):
        if device['max_input_channels'] > 0:
            input_devices.append({
                'id': idx,
                'name': device['name'],
                'channels': device['max_input_channels'],
                'default': idx == sd.default.device[0]
            })
        if device['max_output_channels'] > 0:
            output_devices.append({
                'id': idx,
                'name': device['name'],
                'channels': device['max_output_channels'],
                'default': idx == sd.default.device[1]
            })
    
    return input_devices, output_devices

# ================= MODEL LOADING =================
@st.cache_resource
def load_models(model_size='large'):
    """Load ECAPA-TDNN and Whisper models"""
    try:
        with st.spinner("Loading ECAPA-TDNN model..."):
            classifier = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir="pretrained_models/ecapa-voxceleb",
                run_opts={"device": "cuda" if torch.cuda.is_available() else "cpu"}
            )
        
        with st.spinner(f"Loading Whisper {model_size.capitalize()} model (this may take a while)..."):
            whisper_model = whisper.load_model(model_size, device="cuda" if torch.cuda.is_available() else "cpu")
        
        return classifier, whisper_model
    except Exception as e:
        st.error(f"Error loading models: {e}")
        st.error("Try installing compatible versions: pip install speechbrain==0.5.16 huggingface-hub==0.20.0")
        raise

# ================= SPEAKER RECOGNITION FUNCTIONS =================
def load_speaker_embeddings():
    """Load all enrolled speaker embeddings and compute centroids"""
    speakers = {}
    for person_dir in EMB_ROOT.iterdir():
        if not person_dir.is_dir():
            continue
            
        embeddings = []
        for emb_file in person_dir.glob("*.npy"):
            embeddings.append(np.load(emb_file))
        
        if embeddings:
            centroid = np.mean(embeddings, axis=0)
            speakers[person_dir.name] = {
                'centroid': centroid,
                'count': len(embeddings)
            }
    
    return speakers

def get_embedding_from_audio(audio_data, classifier):
    """Extract ECAPA embedding from audio numpy array"""
    # Normalize
    if audio_data.ndim > 1:
        audio_data = audio_data[:, 0]
    
    peak = np.max(np.abs(audio_data))
    if peak > 0:
        audio_data = audio_data / peak
    
    # Convert to torch tensor
    wav = torch.tensor(audio_data).unsqueeze(0)
    
    # Get embedding
    embedding = classifier.encode_batch(wav).squeeze().cpu().numpy()
    return embedding

def identify_speaker(segment_embedding, speakers, threshold=0.50):
    """Match segment embedding to enrolled speakers"""
    if not speakers:
        return "Unknown", 0.0, {}
    
    best_name = "Unknown"
    best_score = -1
    all_scores = {}
    
    for speaker_name, speaker_data in speakers.items():
        centroid = speaker_data['centroid']
        
        # Cosine similarity
        score = np.dot(segment_embedding, centroid) / (norm(segment_embedding) * norm(centroid))
        all_scores[speaker_name] = round(float(score), 3)
        
        if score > best_score:
            best_score = score
            best_name = speaker_name
    
    # Always return the speaker with highest confidence
    return best_name, round(float(best_score), 3), all_scores

def segment_audio_by_silence(audio_data, sample_rate):
    """Split audio based on silence detection"""
    # Convert numpy array to AudioSegment
    audio_bytes = io.BytesIO()
    sf.write(audio_bytes, audio_data, sample_rate, format='WAV')
    audio_bytes.seek(0)
    audio = AudioSegment.from_wav(audio_bytes)
    
    # Detect non-silent chunks
    nonsilent_ranges = detect_nonsilent(
        audio,
        min_silence_len=MIN_SILENCE_LEN,
        silence_thresh=SILENCE_THRESH,
        seek_step=10
    )
    
    segments = []
    
    if not nonsilent_ranges:
        segments.append({
            'id': 0,
            'start_time': 0,
            'end_time': len(audio) / 1000.0,
            'duration': len(audio) / 1000.0,
            'audio_segment': audio
        })
    else:
        for i, (start_ms, end_ms) in enumerate(nonsilent_ranges):
            if (end_ms - start_ms) < MIN_SEGMENT_LEN:
                continue
                
            segment = {
                'id': i,
                'start_time': start_ms / 1000.0,
                'end_time': end_ms / 1000.0,
                'duration': (end_ms - start_ms) / 1000.0,
                'audio_segment': audio[start_ms:end_ms]
            }
            segments.append(segment)
    
    return segments

def get_embedding_from_segment(audio_segment, classifier):
    """Extract ECAPA embedding from pydub audio segment"""
    samples = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
    
    if samples.ndim > 1:
        samples = samples[:, 0]
    
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak
    
    wav = torch.tensor(samples).unsqueeze(0)
    embedding = classifier.encode_batch(wav).squeeze().cpu().numpy()
    return embedding

# ================= ENROLLMENT FUNCTIONS =================
def enroll_speaker(name, classifier, input_device=None):
    """Record and enroll a new speaker"""
    name = name.strip().lower().replace(" ", "_")
    person_dir = EMB_ROOT / name
    person_dir.mkdir(exist_ok=True)
    
    st.info(f"🎤 Recording for {ENROLL_DURATION} seconds... Speak clearly!")
    
    # Record audio with selected device
    audio = sd.rec(
        int(ENROLL_DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32",
        device=input_device
    )
    
    # Wait for recording to complete
    sd.wait()
    
    # Get embedding
    embedding = get_embedding_from_audio(audio.flatten(), classifier)
    
    # Save
    existing = list(person_dir.glob("*.npy"))
    sample_num = len(existing) + 1
    np.save(person_dir / f"{sample_num}.npy", embedding)
    
    return name, sample_num

# ================= LIVE TRANSCRIPTION FUNCTIONS =================
def audio_callback(indata, frames, time_info, status, audio_queue):
    """Callback for audio stream"""
    if status:
        print(f"Audio callback status: {status}")
    audio_queue.put(indata.copy())

def process_live_audio(classifier, whisper_model, speakers, audio_queue, transcript_list, stop_flag, language='auto', chunk_duration=3):
    """Process audio chunks for live transcription"""
    # Language is passed as parameter to avoid session_state access from thread
    audio_buffer = []
    chunk_samples = int(chunk_duration * SAMPLE_RATE)
    
    while not stop_flag[0]:
        try:
            # Get audio from queue
            audio_chunk = audio_queue.get(timeout=0.1)
            audio_buffer.extend(audio_chunk.flatten())
            
            # Process when we have enough audio
            if len(audio_buffer) >= chunk_samples:
                audio_data = np.array(audio_buffer[:chunk_samples], dtype=np.float32)
                audio_buffer = audio_buffer[chunk_samples:]
                
                # Check if there's actual speech (simple energy check)
                if np.max(np.abs(audio_data)) < 0.01:
                    continue
                
                # Get speaker identity
                segments = segment_audio_by_silence(audio_data, SAMPLE_RATE)
                
                if segments:
                    # Get speaker from first segment
                    embedding = get_embedding_from_segment(segments[0]['audio_segment'], classifier)
                    speaker, confidence, _ = identify_speaker(embedding, speakers)
                else:
                    speaker = "Unknown"
                    confidence = 0.0
                
                # Transcribe
                temp_path = RAW_AUDIO_DIR / "temp_live.wav"
                sf.write(temp_path, audio_data, SAMPLE_RATE)
                
                # Use language parameter (None for auto-detect)
                lang = None if language == 'auto' else language
                
                result = whisper_model.transcribe(
                    str(temp_path),
                    language=lang,
                    fp16=torch.cuda.is_available()
                )
                
                text = result['text'].strip()
                
                if text:
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    transcript_item = {
                        'time': timestamp,
                        'speaker': speaker,
                        'confidence': confidence,
                        'text': text
                    }
                    # Add debug info about all scores
                    if segments:
                        embedding = get_embedding_from_segment(segments[0]['audio_segment'], classifier)
                        _, _, all_scores = identify_speaker(embedding, speakers)
                        transcript_item['all_scores'] = all_scores
                    
                    transcript_list.append(transcript_item)
                
        except queue.Empty:
            continue
        except Exception as e:
            print(f"Error in live processing: {e}")
            continue

def start_live_recording(classifier, whisper_model, speakers, input_device=None, language='auto'):
    """Start live recording and transcription"""
    st.session_state.recording = True
    
    # Use a manager list that can be shared and modified by threads
    manager = Manager()
    transcript_list = manager.list()
    
    st.session_state.live_transcript = []
    st.session_state.transcript_list_ref = transcript_list
    
    # Create shared objects for threading
    audio_queue = queue.Queue()
    stop_flag = [False]  # Mutable flag for thread
    
    st.session_state.audio_queue = audio_queue
    st.session_state.stop_flag = stop_flag
    
    # Start audio stream with proper callback signature and selected device
    stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype='float32',
        device=input_device,
        callback=lambda indata, frames, time_info, status: audio_callback(indata, frames, time_info, status, audio_queue)
    )
    stream.start()
    
    # Start processing thread with language parameter
    processing_thread = threading.Thread(
        target=process_live_audio,
        args=(classifier, whisper_model, speakers, audio_queue, transcript_list, stop_flag, language, 3),
        daemon=True
    )
    processing_thread.start()
    st.session_state.processing_thread = processing_thread
    
    return stream

def stop_live_recording(stream):
    """Stop live recording"""
    if 'stop_flag' in st.session_state:
        st.session_state.stop_flag[0] = True
    
    st.session_state.recording = False
    
    if stream:
        time.sleep(0.5)  # Give thread time to finish
        stream.stop()
        stream.close()

def save_live_transcript():
    """Save live transcript to file"""
    if not st.session_state.live_transcript:
        return None
    
    # Find next conversation number
    existing_convos = sorted(OUTPUT_DIR.glob("convo_*.txt"))
    if existing_convos:
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
    
    # Save text
    with open(txt_output, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("LIVE CONVERSATION TRANSCRIPT\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        
        for item in st.session_state.live_transcript:
            f.write(f"[{item['time']}] {item['speaker']} (conf: {item['confidence']}): {item['text']}\n")
        
        f.write("\n" + "=" * 60 + "\n")
    
    # Save JSON
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'transcript': st.session_state.live_transcript
        }, f, indent=2, ensure_ascii=False)
    
    return txt_output, json_output

# ================= STREAMLIT UI =================
def main():
    st.set_page_config(
        page_title="PRJ3 Voice Recognition",
        page_icon="🎤",
        layout="wide"
    )
    
    st.title("🎤 PRJ3 Voice Recognition System")
    st.markdown("**Real-time Speaker Recognition & Transcription**")
    
    # Check GPU
    if torch.cuda.is_available():
        st.success(f"✅ GPU Detected: {torch.cuda.get_device_name(0)}")
    else:
        st.warning("⚠️ Running on CPU (slower)")
    
    # Load models
    if not st.session_state.models_loaded:
        classifier, whisper_model = load_models(st.session_state.whisper_model_size)
        st.session_state.classifier = classifier
        st.session_state.whisper_model = whisper_model
        st.session_state.models_loaded = True
        st.success(f"✅ Models loaded successfully! (Whisper: {st.session_state.whisper_model_size})")
    else:
        classifier = st.session_state.classifier
        whisper_model = st.session_state.whisper_model
    
    # Load speakers
    speakers = load_speaker_embeddings()
    
    # Sidebar
    st.sidebar.header("📊 System Info")
    st.sidebar.metric("Enrolled Speakers", len(speakers))
    if speakers:
        st.sidebar.write("**Speakers:**")
        for name, data in speakers.items():
            st.sidebar.write(f"- {name} ({data['count']} samples)")
    
    st.sidebar.markdown("---")
    st.sidebar.header("🤖 Model Settings")
    
    # Whisper model selector
    model_options = {
        'tiny': 'Tiny (~39M params, fastest)',
        'base': 'Base (~74M params, fast)',
        'small': 'Small (~244M params, balanced)',
        'medium': 'Medium (~769M params, accurate)',
        'large': 'Large (~1550M params, most accurate)'
    }
    
    selected_model = st.sidebar.selectbox(
        "Whisper Model",
        options=list(model_options.keys()),
        index=list(model_options.keys()).index(st.session_state.whisper_model_size),
        format_func=lambda x: model_options[x],
        key="model_selector",
        help="Larger models are more accurate but slower. Change requires reload."
    )
    
    # Check if model changed
    if selected_model != st.session_state.whisper_model_size:
        st.session_state.whisper_model_size = selected_model
        st.session_state.models_loaded = False
        st.sidebar.warning("Model changed! Please refresh the page to reload.")
        if st.sidebar.button("🔄 Reload Models"):
            st.cache_resource.clear()
            st.rerun()
    
    # Language selector
    language_options = {
        'auto': 'Auto-detect',
        'en': 'English',
        'hi': 'Hindi (हिन्दी)',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'ru': 'Russian',
        'pt': 'Portuguese'
    }
    
    st.session_state.transcription_language = st.sidebar.selectbox(
        "Transcription Language",
        options=list(language_options.keys()),
        index=list(language_options.keys()).index(st.session_state.transcription_language),
        format_func=lambda x: language_options[x],
        key="language_selector",
        help="Select the language for transcription. Auto-detect works for all languages."
    )
    
    st.sidebar.markdown("---")
    st.sidebar.header("🎛️ Audio Settings")
    
    # Get available devices
    input_devices, output_devices = get_audio_devices()
    
    # Input device selection
    st.sidebar.subheader("🎤 Microphone")
    input_device_names = [f"{d['name']} {'(Default)' if d['default'] else ''}" for d in input_devices]
    default_input_idx = next((i for i, d in enumerate(input_devices) if d['default']), 0)
    
    selected_input_idx = st.sidebar.selectbox(
        "Select Input Device",
        range(len(input_devices)),
        index=default_input_idx,
        format_func=lambda i: input_device_names[i],
        key="input_device_selector"
    )
    st.session_state.selected_input_device = input_devices[selected_input_idx]['id']
    
    # Output device selection (for future use)
    st.sidebar.subheader("🔊 Speaker")
    output_device_names = [f"{d['name']} {'(Default)' if d['default'] else ''}" for d in output_devices]
    default_output_idx = next((i for i, d in enumerate(output_devices) if d['default']), 0)
    
    selected_output_idx = st.sidebar.selectbox(
        "Select Output Device",
        range(len(output_devices)),
        index=default_output_idx,
        format_func=lambda i: output_device_names[i],
        key="output_device_selector"
    )
    st.session_state.selected_output_device = output_devices[selected_output_idx]['id']
    
    # Show selected devices info
    st.sidebar.info(f"📥 Input: {input_devices[selected_input_idx]['name'][:30]}...")
    st.sidebar.info(f"📤 Output: {output_devices[selected_output_idx]['name'][:30]}...")
    
    # Main tabs
    tab1, tab2, tab3 = st.tabs(["🎙️ Live Mode", "➕ Add New Voice", "📁 View Transcripts"])
    
    # ========== TAB 1: LIVE MODE ==========
    with tab1:
        st.header("Live Transcription Mode")
        
        if not speakers:
            st.error("❌ No speakers enrolled! Please add voices in the 'Add New Voice' tab first.")
        else:
            col1, col2 = st.columns([1, 4])
            
            with col1:
                if not st.session_state.recording:
                    if st.button("▶️ Start Live Recording", type="primary", use_container_width=True):
                        stream = start_live_recording(
                            classifier, 
                            whisper_model, 
                            speakers,
                            input_device=st.session_state.selected_input_device,
                            language=st.session_state.transcription_language
                        )
                        st.session_state.stream = stream
                        st.rerun()
                else:
                    if st.button("⏹️ Stop Recording", type="secondary", use_container_width=True):
                        stop_live_recording(st.session_state.stream)
                        # Save transcript
                        result = save_live_transcript()
                        if result:
                            st.success(f"✅ Transcript saved: {result[0].name}")
                        st.rerun()
            
            with col2:
                if st.session_state.recording:
                    st.info("🔴 **RECORDING IN PROGRESS** - Speak naturally into your microphone")
                else:
                    st.info("⏸️ **STOPPED** - Click 'Start Live Recording' to begin")
            
            # Display live transcript
            st.subheader("📝 Live Transcript")
            
            if st.session_state.recording:
                # Copy from manager list to session state for display
                if 'transcript_list_ref' in st.session_state and st.session_state.transcript_list_ref:
                    st.session_state.live_transcript = list(st.session_state.transcript_list_ref)
                
                # Display transcript
                if st.session_state.live_transcript:
                    for item in reversed(st.session_state.live_transcript[-20:]):  # Show last 20
                        speaker_color = "blue" if item['speaker'] != "Unknown" else "gray"
                        
                        # Show all scores for debugging
                        scores_str = ""
                        if 'all_scores' in item and item['all_scores']:
                            scores_str = " | Scores: " + ", ".join([f"{k}: {v}" for k, v in item['all_scores'].items()])
                        
                        st.markdown(
                            f"**[{item['time']}]** "
                            f"<span style='color:{speaker_color}; font-weight:bold;'>{item['speaker']}</span> "
                            f"<span style='color:green; font-size:0.8em;'>(conf: {item['confidence']})</span>"
                            f"<span style='color:orange; font-size:0.7em;'>{scores_str}</span>: "
                            f"{item['text']}",
                            unsafe_allow_html=True
                        )
                else:
                    st.write("*Waiting for speech...*")
                
                # Auto-refresh every 2 seconds
                time.sleep(2)
                st.rerun()
            else:
                if st.session_state.live_transcript:
                    for item in st.session_state.live_transcript:
                        speaker_color = "blue" if item['speaker'] != "Unknown" else "gray"
                        st.markdown(
                            f"**[{item['time']}]** "
                            f"<span style='color:{speaker_color}; font-weight:bold;'>{item['speaker']}</span> "
                            f"<span style='color:green; font-size:0.8em;'>(conf: {item['confidence']})</span>: "
                            f"{item['text']}",
                            unsafe_allow_html=True
                        )
                else:
                    st.write("*No transcript yet. Start recording to begin.*")
    
    # ========== TAB 2: ADD NEW VOICE ==========
    with tab2:
        st.header("Enroll New Speaker")
        
        st.markdown("""
        **Instructions:**
        1. Enter the person's name below
        2. Click 'Record Voice Sample'
        3. Speak clearly for 5 seconds
        4. Repeat 2-3 times for better accuracy
        """)
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            speaker_name = st.text_input("Speaker Name", placeholder="e.g., john, mary, alice")
        
        with col2:
            st.write("")  # Spacer
            st.write("")  # Spacer
            record_button = st.button("🎤 Record Voice Sample", type="primary", use_container_width=True)
        
        if record_button:
            if not speaker_name:
                st.error("❌ Please enter a speaker name!")
            else:
                try:
                    name, sample_num = enroll_speaker(
                        speaker_name, 
                        classifier,
                        input_device=st.session_state.selected_input_device
                    )
                    st.success(f"✅ Enrolled '{name}' - Sample #{sample_num}")
                    st.balloons()
                    time.sleep(1)
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Error during enrollment: {e}")
        
        # Show enrolled speakers
        st.subheader("📋 Enrolled Speakers")
        if speakers:
            for name, data in speakers.items():
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"**{name}**")
                with col2:
                    st.write(f"{data['count']} samples")
        else:
            st.info("No speakers enrolled yet.")
    
    # ========== TAB 3: VIEW TRANSCRIPTS ==========
    with tab3:
        st.header("Saved Transcripts")
        
        transcript_files = sorted(OUTPUT_DIR.glob("convo_*.txt"), reverse=True)
        
        if not transcript_files:
            st.info("No transcripts saved yet.")
        else:
            for txt_file in transcript_files:
                with st.expander(f"📄 {txt_file.name}"):
                    content = txt_file.read_text(encoding='utf-8')
                    st.code(content, language=None)
                    
                    # Download button
                    st.download_button(
                        label="Download",
                        data=content,
                        file_name=txt_file.name,
                        mime="text/plain"
                    )

if __name__ == "__main__":
    main()
