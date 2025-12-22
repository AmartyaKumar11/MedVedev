import whisper

model = whisper.load_model("base")

def transcribe(wav_path):
    result = model.transcribe(str(wav_path), fp16=False)
    return result["text"].strip()
