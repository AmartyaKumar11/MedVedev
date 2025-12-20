# 🏥 Patient Facial Recognition System

A professional facial recognition system for patient check-in using state-of-the-art deep learning models with **modern GUI interface**.

## 🎯 Features

- **Modern GUI Application**: Real-time camera preview with visual feedback
- **Real-Time Face Detection**: Green boxes show when face is detected
- **Single Photo Enrollment**: Fast enrollment with just one photo
- **Multi-Method Detection**: 4 fallback detection methods for reliability
- **Live Recognition**: Real-time patient identification with confidence scores
- **GPU Support**: Automatic GPU acceleration if available
- **Performance Optimized**: Frame skipping and efficient processing

## 🔧 Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | Python 3.10+ | Core programming |
| **Core Library** | DeepFace | Multi-model wrapper for face recognition |
| **Face Detection** | OpenCV, SSD, RetinaFace, Haar Cascade | Multiple fallback methods |
| **Recognition Model** | FaceNet512 | 512-dimensional embeddings |
| **GUI Framework** | Tkinter | User interface |
| **Storage** | Pickle | Embedding storage |
| **Computer Vision** | OpenCV | Camera capture and image processing |

## 📦 Installation

1. **Navigate to the project**:
   ```bash
   cd C:\Users\ASUS\Desktop\PRJ-3\facemod
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Usage

### GUI Application (Recommended)

Run the graphical interface:
```bash
python gui_app.py
```

**Features:**
- Live camera preview with face detection boxes
- One-click patient enrollment
- Real-time recognition mode
- Visual status indicators
- GPU status monitoring

### Console Applications (Alternative)

**Main menu application:**
```bash
python main.py
```

**Enroll a new patient:**
```bash
python enroll.py "John Doe"
```

**Start recognition:**
```bash
python recognize.py
```

## 📁 Database Structure

The system creates this structure in `C:\Users\ASUS\Desktop\PRJ-3\facemod\face`:

```
face/
├── John_Doe/
│   ├── front.jpg
│   └── embeddings.pkl  # 512-dimensional vector
│
├── Jane_Smith/
│   └── ...
```

## 🔄 How It Works

### Enrollment Process

1. **Capture**: Single front-facing photo
2. **Detection**: Uses 4 methods (OpenCV → SSD → RetinaFace → Haar Cascade)
3. **Alignment**: Face is normalized and aligned
4. **Embedding Generation**: FaceNet512 converts face to 512-number vector
5. **Storage**: Saves image + embedding to patient folder

### Recognition Process

1. **Real-time Scan**: Continuous camera monitoring (every 3 seconds)
2. **Face Detection**: Quick OpenCV detection for speed
3. **Vector Comparison**: Calculates cosine similarity with stored embeddings
4. **Thresholding**: Match if similarity > 0.75 (75%)
5. **Display**: Shows patient name and confidence score

## 🎨 GUI Interface

### Main Window
- **Left Panel**: Live camera feed (640x480)
- **Right Panel**: Control buttons and system info
- **Status Bar**: Real-time status updates

### Features
- **🎯 Enroll New Patient**: Capture and save new patient
- **🎥 Start Recognition**: Begin live patient identification
- **⏹️ Stop/Preview Mode**: Return to preview
- **📋 View Patients**: List all enrolled patients
- **❌ Exit**: Close application

### Visual Feedback
- **Green Box**: Face detected and ready
- **Orange Box**: No face detected
- **Status Colors**: Green (success), Red (error), Yellow (processing)

## 📊 Performance Metrics

- **Detection Speed**: 20-30 FPS (CPU optimized)
- **Recognition Interval**: Every 3 seconds
- **Processing**: Every 3rd frame (for smoothness)
- **Camera Resolution**: 640x480 (optimized)
- **Embedding Size**: 512 dimensions per face
- **Match Threshold**: 0.75 (75% similarity)
- **Detection Methods**: 4 fallback options

## 🛠️ Configuration

### Adjust Recognition Threshold

Edit in `gui_app.py` or `recognize.py`:
```python
self.threshold = 0.75  # Change to 0.6 for more lenient, 0.85 for stricter
```

### Change Camera Resolution

Edit in `gui_app.py`:
```python
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)   # Change width
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)  # Change height
```

### Adjust Processing Speed

Edit in `gui_app.py`:
```python
self.process_every_n_frames = 3  # Process every 3rd frame (higher = faster but less responsive)
```

## 💡 Tips for Best Results

### Enrollment
- ✅ Ensure **bright, even lighting**
- ✅ Face camera **directly**
- ✅ Remove **glasses, hats, masks** if possible
- ✅ Keep face **centered** in green box
- ✅ Wait for "FACE DETECTED" message

### Recognition
- ✅ Same lighting conditions as enrollment
- ✅ Face camera at similar distance
- ✅ Allow 3 seconds for processing
- ✅ Stay relatively still during recognition

## 🔐 Security Considerations

- Embeddings stored locally (no cloud dependency)
- JPG images retained for manual verification
- Cosine similarity prevents simple photo spoofing
- Single-angle enrollment reduces storage needs
- 75% threshold balances security and usability

## 📝 Files Overview

| File | Purpose |
|------|---------|
| `gui_app.py` | **Modern GUI application** (recommended) |
| `main.py` | Console menu application |
| `enroll.py` | Patient enrollment script |
| `recognize.py` | Live recognition script |
| `utils.py` | Helper functions (cosine similarity, storage) |
| `requirements.txt` | Python dependencies |

## 🐛 Troubleshooting

**Camera not detected:**
- Check if another app is using the camera
- Try closing other video applications
- Restart the application

**No face detected:**
- **Increase lighting** (most common issue)
- Face camera directly
- Move closer to camera
- Remove obstructions (glasses, mask, hair)
- Check that green box appears in preview mode

**Low FPS / Laggy:**
- Already optimized for CPU
- Close other applications
- Reduce `process_every_n_frames` value
- Lower camera resolution

**Low confidence scores:**
- Re-enroll patient with better lighting
- Ensure consistent environment
- Lower threshold to 0.65-0.70

**GPU not detected:**
- Normal if CUDA not installed
- CPU mode works well with optimizations
- To enable GPU: Install CUDA Toolkit + cuDNN

## 🚀 Performance Optimization

The system includes several optimizations:
- **Frame skipping**: Only processes every 3rd frame
- **Lower resolution**: 640x480 for speed
- **Fast detector**: OpenCV used primarily
- **Delayed processing**: Recognition every 3 seconds
- **GPU support**: Auto-enables if available
- **Efficient updates**: 50ms frame delay

## 📄 License

Free to use for educational and commercial purposes.

## 👤 Author

Built for PRJ-3 Patient Check-In System

---

**Quick Start:** Run `python gui_app.py` to launch the GUI! 🚀
