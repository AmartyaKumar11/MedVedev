"""
Test script to verify PRJ3_voice.py dependencies and basic functionality
"""
import sys

print("=" * 60)
print("PRJ3 Voice Recognition - Dependency Test")
print("=" * 60)

# Test imports
print("\n1. Testing imports...")
errors = []

try:
    import streamlit as st
    print("✅ streamlit")
except ImportError as e:
    errors.append(f"❌ streamlit: {e}")
    print(f"❌ streamlit: Not installed")

try:
    import sounddevice as sd
    print("✅ sounddevice")
except ImportError as e:
    errors.append(f"❌ sounddevice: {e}")
    print(f"❌ sounddevice: Not installed")

try:
    import soundfile as sf
    print("✅ soundfile")
except ImportError as e:
    errors.append(f"❌ soundfile: {e}")
    print(f"❌ soundfile: Not installed")

try:
    import torch
    print(f"✅ torch (version: {torch.__version__})")
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("   GPU: Not available (will use CPU)")
except ImportError as e:
    errors.append(f"❌ torch: {e}")
    print(f"❌ torch: Not installed")

try:
    import numpy as np
    print(f"✅ numpy (version: {np.__version__})")
except ImportError as e:
    errors.append(f"❌ numpy: {e}")
    print(f"❌ numpy: Not installed")

try:
    import whisper
    print("✅ whisper (openai-whisper)")
except ImportError as e:
    errors.append(f"❌ whisper: {e}")
    print(f"❌ whisper: Not installed")

try:
    from speechbrain.pretrained import EncoderClassifier
    print("✅ speechbrain")
except ImportError as e:
    errors.append(f"❌ speechbrain: {e}")
    print(f"❌ speechbrain: Not installed")

try:
    from pydub import AudioSegment
    print("✅ pydub")
except ImportError as e:
    errors.append(f"❌ pydub: {e}")
    print(f"❌ pydub: Not installed")

try:
    from pathlib import Path
    from datetime import datetime
    import json
    import threading
    import queue
    import time
    import io
    print("✅ Standard library modules")
except ImportError as e:
    errors.append(f"❌ Standard library: {e}")
    print(f"❌ Standard library: {e}")

print("\n" + "=" * 60)

if errors:
    print("\n⚠️ Missing dependencies detected!")
    print("\nTo install all required packages, run:")
    print("pip install streamlit sounddevice soundfile torch numpy openai-whisper speechbrain pydub")
    print("\nOr install from requirements file:")
    print("pip install -r requirements.txt")
    print("\n" + "=" * 60)
    sys.exit(1)
else:
    print("\n✅ All dependencies are installed!")
    print("\nYou can now run the app with:")
    print("streamlit run PRJ3_voice.py")
    print("\n" + "=" * 60)
    sys.exit(0)
