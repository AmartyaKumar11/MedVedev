print("=" * 50)
print("GPU Detection Test")
print("=" * 50)

# Try importing torch
try:
    import torch
    print(f"\nPyTorch CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA Device Count: {torch.cuda.device_count()}")
        print(f"CUDA Device Name: {torch.cuda.get_device_name(0)}")
        print(f"CUDA Version: {torch.version.cuda}")
        print(f"Current Device: {torch.cuda.current_device()}")
    else:
        print("CUDA is NOT available!")
except ImportError:
    print("\nPyTorch is not installed")

# Try faster-whisper with CUDA
try:
    from faster_whisper import WhisperModel
    print("\nTesting faster-whisper with CUDA...")
    model = WhisperModel("tiny", device="cuda", compute_type="float16")
    print("✓ Successfully loaded Whisper model on CUDA!")
    print("✓ GPU is working correctly!")
except Exception as e:
    print(f"\nError with faster-whisper CUDA: {e}")

print("\n" + "=" * 50)
