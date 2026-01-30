"""
GUI Application for Facial Recognition System
Graphical interface with live camera preview
GPU-accelerated for better performance
"""

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import cv2
from PIL import Image, ImageTk
import threading
import numpy as np
from deepface import DeepFace
from utils import save_embeddings, find_best_match, list_enrolled_patients, create_database_structure
from datetime import datetime
import os

# Configure TensorFlow to use GPU
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['CUDA_VISIBLE_DEVICES'] = '0'

try:
    import tensorflow as tf
    # Enable GPU memory growth
    physical_devices = tf.config.list_physical_devices('GPU')
    if physical_devices:
        for device in physical_devices:
            tf.config.experimental.set_memory_growth(device, True)
        print(f"✓ GPU acceleration enabled: {len(physical_devices)} GPU(s) found")
    else:
        print("⚠ No GPU found, using CPU")
except Exception as e:
    print(f"⚠ GPU configuration failed: {e}")


class FacialRecognitionGUI:
    def __init__(self, root):
        """Initialize the GUI application"""
        self.root = root
        self.root.title("🏥 Patient Facial Recognition System")
        self.root.geometry("1400x850")
        self.root.minsize(1200, 700)
        self.root.configure(bg='#1e1e1e')
        
        # Database settings
        self.database_path = r"C:\Users\ASUS\Desktop\PRJ-3\facemod\face"
        create_database_structure(self.database_path)
        
        # Recognition settings
        self.detector_backend = 'retinaface'
        self.model_name = 'Facenet512'
        self.threshold = 0.75
        
        # Camera settings
        self.cap = None
        self.camera_running = False
        self.current_frame = None
        
        # Mode settings
        self.mode = "preview"  # preview, enroll, recognize
        self.enrolling_patient = None
        self.enrolled_image = None
        self.enrolled_embedding = None
        
        # Recognition tracking
        self.last_recognition = None
        self.last_recognition_time = 0
        
        # Performance optimization
        self.skip_frames = 0
        self.process_every_n_frames = 3  # Only process every 3rd frame
        
        self.setup_ui()
        self.start_camera()
    
    def setup_ui(self):
        """Setup the user interface"""
        # Title
        title_frame = tk.Frame(self.root, bg='#2d2d2d', height=80)
        title_frame.pack(fill=tk.X, padx=10, pady=10)
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(
            title_frame, 
            text="🏥 PATIENT FACIAL RECOGNITION SYSTEM",
            font=("Arial", 24, "bold"),
            bg='#2d2d2d',
            fg='#ffffff'
        )
        title_label.pack(pady=20)
        
        # Main container
        main_container = tk.Frame(self.root, bg='#1e1e1e')
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left side - Camera feed
        left_frame = tk.Frame(main_container, bg='#2d2d2d', width=900)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        left_frame.pack_propagate(False)
        
        camera_label = tk.Label(
            left_frame,
            text="📷 LIVE CAMERA FEED",
            font=("Arial", 14, "bold"),
            bg='#2d2d2d',
            fg='#ffffff'
        )
        camera_label.pack(pady=10)
        
        # Camera container with fixed size
        camera_container = tk.Frame(left_frame, bg='#000000', width=850, height=640)
        camera_container.pack(padx=10, pady=10)
        camera_container.pack_propagate(False)
        
        self.camera_canvas = tk.Label(camera_container, bg='#000000')
        self.camera_canvas.pack(fill=tk.BOTH, expand=True)
        
        # Status label
        self.status_label = tk.Label(
            left_frame,
            text="📹 Camera Ready",
            font=("Arial", 12),
            bg='#2d2d2d',
            fg='#00ff00'
        )
        self.status_label.pack(pady=10)
        
        # Right side - Controls
        right_frame = tk.Frame(main_container, bg='#2d2d2d', width=400)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 0))
        right_frame.pack_propagate(False)
        
        control_label = tk.Label(
            right_frame,
            text="🎮 CONTROLS",
            font=("Arial", 14, "bold"),
            bg='#2d2d2d',
            fg='#ffffff'
        )
        control_label.pack(pady=15)
        
        # Buttons
        button_style = {
            'font': ("Arial", 12, "bold"),
            'width': 25,
            'height': 2,
            'bd': 0,
            'relief': tk.FLAT,
            'cursor': 'hand2'
        }
        
        self.enroll_btn = tk.Button(
            right_frame,
            text="🎯 ENROLL NEW PATIENT",
            bg='#0066cc',
            fg='white',
            command=self.start_enrollment,
            **button_style
        )
        self.enroll_btn.pack(pady=10, padx=20)
        
        self.recognize_btn = tk.Button(
            right_frame,
            text="🎥 START RECOGNITION",
            bg='#00aa00',
            fg='white',
            command=self.start_recognition,
            **button_style
        )
        self.recognize_btn.pack(pady=10, padx=20)
        
        self.stop_btn = tk.Button(
            right_frame,
            text="⏹️ STOP / PREVIEW MODE",
            bg='#ff6600',
            fg='white',
            command=self.stop_current_mode,
            **button_style
        )
        self.stop_btn.pack(pady=10, padx=20)
        
        # Info panel
        info_frame = tk.Frame(right_frame, bg='#3d3d3d')
        info_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        info_title = tk.Label(
            info_frame,
            text="ℹ️ SYSTEM INFO",
            font=("Arial", 12, "bold"),
            bg='#3d3d3d',
            fg='#ffffff'
        )
        info_title.pack(pady=10)
        
        # Scrollable info text
        self.info_text = tk.Text(
            info_frame,
            font=("Courier", 9),
            bg='#2d2d2d',
            fg='#00ff00',
            wrap=tk.WORD,
            height=15,
            bd=0,
            relief=tk.FLAT
        )
        self.info_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.update_info_panel()
        
        # Bottom buttons
        bottom_frame = tk.Frame(right_frame, bg='#2d2d2d')
        bottom_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=10)
        
        view_btn = tk.Button(
            bottom_frame,
            text="📋 View Patients",
            bg='#555555',
            fg='white',
            font=("Arial", 10),
            command=self.view_patients,
            cursor='hand2'
        )
        view_btn.pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)
        
        exit_btn = tk.Button(
            bottom_frame,
            text="❌ Exit",
            bg='#cc0000',
            fg='white',
            font=("Arial", 10),
            command=self.on_closing,
            cursor='hand2'
        )
        exit_btn.pack(side=tk.RIGHT, padx=5, expand=True, fill=tk.X)
    
    def update_info_panel(self):
        """Update the information panel"""
        self.info_text.delete(1.0, tk.END)
        
        info = f"""
Model: {self.model_name}
Detector: {self.detector_backend}
Threshold: {self.threshold}
Mode: {self.mode.upper()}

GPU Status:
"""
        self.info_text.insert(tk.END, info)
        
        # Check GPU
        try:
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                self.info_text.insert(tk.END, f"✓ ENABLED ({len(gpus)} GPU)\n")
            else:
                self.info_text.insert(tk.END, "✗ Not available (CPU)\n")
        except:
            self.info_text.insert(tk.END, "✗ Not available (CPU)\n")
        
        self.info_text.insert(tk.END, f"\nDatabase:\n{self.database_path}\n\nEnrolled Patients:\n")
        
        patients = list_enrolled_patients(self.database_path)
        if patients:
            for i, patient in enumerate(patients, 1):
                self.info_text.insert(tk.END, f"{i}. {patient}\n")
        else:
            self.info_text.insert(tk.END, "No patients enrolled\n")
    
    def start_camera(self):
        """Start the camera feed"""
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        self.camera_running = True
        self.update_camera()
    
    def update_camera(self):
        """Update camera frame continuously"""
        if not self.camera_running:
            return
        
        ret, frame = self.cap.read()
        if ret:
            frame = cv2.flip(frame, 1)
            self.current_frame = frame.copy()
            
            # Frame skipping for performance
            self.skip_frames += 1
            process_frame = (self.skip_frames % self.process_every_n_frames == 0)
            
            # Process based on mode
            if self.mode == "preview":
                display_frame = self.draw_preview_mode(frame)
            elif self.mode == "enroll":
                display_frame = self.draw_enroll_mode(frame, process_frame)
            elif self.mode == "recognize":
                display_frame = self.draw_recognize_mode(frame, process_frame)
            else:
                display_frame = frame
            
            # Convert to PhotoImage
            display_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(display_frame)
            
            # Fixed resize to maintain aspect ratio
            img = img.resize((850, 640), Image.Resampling.LANCZOS)
            
            imgtk = ImageTk.PhotoImage(image=img)
            self.camera_canvas.imgtk = imgtk
            self.camera_canvas.configure(image=imgtk)
        
        self.root.after(50, self.update_camera)
    
    def draw_preview_mode(self, frame):
        """Draw preview mode overlay"""
        h, w = frame.shape[:2]
        
        # Try simple face detection for preview
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            # Draw box around detected face
            for (x, y, w_face, h_face) in faces:
                cv2.rectangle(frame, (x, y), (x + w_face, y + h_face), (0, 255, 0), 3)
                cv2.putText(frame, "FACE DETECTED", 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (0, 255, 0), 2)
        else:
            # Draw guide rectangle if no face
            guide_w, guide_h = 300, 400
            guide_x, guide_y = (w - guide_w) // 2, (h - guide_h) // 2
            cv2.rectangle(frame, (guide_x, guide_y), 
                         (guide_x + guide_w, guide_y + guide_h), 
                         (0, 165, 255), 2)
            cv2.putText(frame, "NO FACE DETECTED", 
                       (guide_x + 30, guide_y - 15), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
        
        cv2.putText(frame, "PREVIEW MODE", 
                   (w//2 - 150, 50), cv2.FONT_HERSHEY_SIMPLEX, 
                   1.2, (255, 255, 255), 3)
        
        return frame
    
    def draw_enroll_mode(self, frame, process=True):
        """Draw enrollment mode overlay"""
        h, w = frame.shape[:2]
        
        # Draw instruction
        cv2.rectangle(frame, (0, 0), (w, 100), (0, 100, 200), -1)
        
        cv2.putText(frame, f"ENROLLING: {self.enrolling_patient}", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 
                   1.0, (255, 255, 255), 2)
        
        cv2.putText(frame, "Look straight at the camera", 
                   (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 
                   0.8, (255, 255, 0), 2)
        
        # Real-time face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            for (x, y, w_face, h_face) in faces:
                cv2.rectangle(frame, (x, y), (x + w_face, y + h_face), (0, 255, 0), 3)
                cv2.putText(frame, "READY TO CAPTURE", 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (0, 255, 0), 2)
        else:
            cv2.putText(frame, "Position your face in view", 
                       (w//2 - 150, h//2), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.8, (0, 165, 255), 2)
        
        return frame
    
    def draw_recognize_mode(self, frame, process=True):
        """Draw recognition mode overlay"""
        h, w = frame.shape[:2]
        
        cv2.putText(frame, "RECOGNITION MODE", 
                   (w//2 - 180, 50), cv2.FONT_HERSHEY_SIMPLEX, 
                   1.2, (0, 255, 0), 3)
        
        # Try recognition every 3 seconds and only when processing
        import time
        current_time = time.time()
        
        if process and current_time - self.last_recognition_time > 3:
            self.perform_recognition(frame)
            self.last_recognition_time = current_time
        
        # Display last recognition
        if self.last_recognition:
            name, confidence, facial_area = self.last_recognition
            
            if facial_area:
                x, y, w_face, h_face = facial_area['x'], facial_area['y'], facial_area['w'], facial_area['h']
                
                color = (0, 255, 0) if name else (0, 165, 255)
                cv2.rectangle(frame, (x, y), (x + w_face, y + h_face), color, 3)
                
                if name:
                    # Background for text
                    cv2.rectangle(frame, (x, y - 70), (x + w_face, y), (0, 255, 0), -1)
                    
                    cv2.putText(frame, name, 
                               (x + 10, y - 40), cv2.FONT_HERSHEY_SIMPLEX, 
                               0.9, (0, 0, 0), 2)
                    
                    cv2.putText(frame, f"Match: {confidence:.1%}", 
                               (x + 10, y - 15), cv2.FONT_HERSHEY_SIMPLEX, 
                               0.6, (0, 0, 0), 2)
                else:
                    cv2.putText(frame, "Not Recognized", 
                               (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                               0.7, (0, 165, 255), 2)
        
        return frame
    
    def perform_recognition(self, frame):
        """Perform face recognition on current frame"""
        try:
            face_objs = DeepFace.extract_faces(
                img_path=frame,
                detector_backend='opencv',
                enforce_detection=False,
                align=True
            )
            
            if not face_objs:
                return
            
            face_obj = face_objs[0]
            aligned_face = face_obj['face']
            facial_area = face_obj['facial_area']
            
            if aligned_face.max() <= 1.0:
                aligned_face = (aligned_face * 255).astype(np.uint8)
            
            embedding_objs = DeepFace.represent(
                img_path=aligned_face,
                model_name=self.model_name,
                detector_backend='skip',
                enforce_detection=False
            )
            
            live_embedding = np.array(embedding_objs[0]['embedding'])
            
            matched_name, confidence = find_best_match(
                live_embedding,
                self.database_path,
                self.threshold
            )
            
            self.last_recognition = (matched_name, confidence, facial_area)
            
            if matched_name:
                timestamp = datetime.now().strftime("%H:%M:%S")
                self.update_status(f"✅ {matched_name} recognized at {timestamp} ({confidence:.1%})", "#00ff00")
        except:
            pass
    
    def start_enrollment(self):
        """Start enrollment process"""
        patient_name = simpledialog.askstring(
            "Enroll Patient",
            "Enter patient full name:",
            parent=self.root
        )
        
        if not patient_name or not patient_name.strip():
            return
        
        patient_name = patient_name.strip()
        
        # Check if already enrolled
        enrolled = list_enrolled_patients(self.database_path)
        if patient_name.replace(" ", "_") in enrolled:
            if not messagebox.askyesno(
                "Already Enrolled",
                f"{patient_name} is already enrolled.\nDo you want to re-enroll?"
            ):
                return
        
        self.mode = "enroll"
        self.enrolling_patient = patient_name
        self.enrolled_image = None
        self.enrolled_embedding = None
        
        self.update_status(f"📸 Enrolling {patient_name} - Look straight at camera", "#0066cc")
        self.update_info_panel()
        
        # Show instructions
        messagebox.showinfo(
            "Enrollment Instructions",
            "Position yourself in front of the camera\n\n"
            "Look straight ahead\n"
            "Ensure good lighting\n\n"
            "Click 'Capture Photo' button when ready!"
        )
        
        # Add capture button temporarily
        self.show_capture_button()
    
    def show_capture_button(self):
        """Show capture photo button"""
        if hasattr(self, 'capture_btn'):
            return
        
        self.capture_btn = tk.Button(
            self.root,
            text="📸 CAPTURE PHOTO",
            bg='#ff00ff',
            fg='white',
            font=("Arial", 16, "bold"),
            command=self.capture_photo,
            cursor='hand2',
            height=2,
            width=30
        )
        self.capture_btn.place(x=350, y=750)
    
    def hide_capture_button(self):
        """Hide capture button"""
        if hasattr(self, 'capture_btn'):
            self.capture_btn.destroy()
            del self.capture_btn
    
    def capture_photo(self):
        """Capture photo for enrollment"""
        if self.current_frame is None:
            return
        
        self.update_status("⏳ Processing...", "#ffaa00")
        
        try:
            # Try multiple detection methods for best results
            face_objs = None
            
            # Method 1: OpenCV (fastest)
            try:
                face_objs = DeepFace.extract_faces(
                    img_path=self.current_frame,
                    detector_backend='opencv',
                    enforce_detection=False,
                    align=True
                )
            except:
                pass
            
            # Method 2: SSD (good balance)
            if not face_objs or len(face_objs) == 0:
                try:
                    self.update_status("⏳ Trying SSD detection...", "#ffaa00")
                    face_objs = DeepFace.extract_faces(
                        img_path=self.current_frame,
                        detector_backend='ssd',
                        enforce_detection=False,
                        align=True
                    )
                except:
                    pass
            
            # Method 3: RetinaFace (most accurate)
            if not face_objs or len(face_objs) == 0:
                try:
                    self.update_status("⏳ Trying RetinaFace detection...", "#ffaa00")
                    face_objs = DeepFace.extract_faces(
                        img_path=self.current_frame,
                        detector_backend='retinaface',
                        enforce_detection=False,
                        align=True
                    )
                except:
                    pass
            
            # Method 4: Haar Cascade as last resort
            if not face_objs or len(face_objs) == 0:
                try:
                    self.update_status("⏳ Using simple detection...", "#ffaa00")
                    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                    gray = cv2.cvtColor(self.current_frame, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                    
                    if len(faces) > 0:
                        # Manually extract the face region
                        (x, y, w, h) = faces[0]
                        face_region = self.current_frame[y:y+h, x:x+w]
                        face_objs = [{
                            'face': cv2.resize(face_region, (224, 224)) / 255.0,
                            'facial_area': {'x': x, 'y': y, 'w': w, 'h': h},
                            'confidence': 1.0
                        }]
                except:
                    pass
            
            if not face_objs or len(face_objs) == 0:
                messagebox.showerror(
                    "No Face Detected", 
                    "Could not detect a face after trying all methods!\n\n"
                    "Tips:\n"
                    "• Ensure GOOD LIGHTING (very important!)\n"
                    "• Face the camera DIRECTLY\n"
                    "• Move CLOSER to the camera\n"
                    "• Remove glasses/hat/mask\n"
                    "• Make sure face is clearly visible"
                )
                self.update_status("❌ No face detected", "#ff0000")
                return
            
            face_obj = face_objs[0]
            aligned_face = face_obj['face']
            
            # Check confidence if available (skip if 0 or very low as it might be default)
            confidence = face_obj.get('confidence', 1.0)
            if confidence > 0.1 and confidence < 0.5:
                if not messagebox.askyesno(
                    "Low Confidence",
                    f"Face detection confidence is {confidence:.1%}\n\n"
                    "This might affect recognition accuracy.\n"
                    "Do you want to continue anyway?"
                ):
                    self.update_status("❌ Capture cancelled", "#ff0000")
                    return
            
            if aligned_face.max() <= 1.0:
                aligned_face = (aligned_face * 255).astype(np.uint8)
            
            self.update_status("⏳ Generating embedding...", "#ffaa00")
            
            embedding_objs = DeepFace.represent(
                img_path=aligned_face,
                model_name=self.model_name,
                detector_backend='skip',
                enforce_detection=False
            )
            
            embedding = np.array(embedding_objs[0]['embedding'])
            
            self.enrolled_image = self.current_frame.copy()
            self.enrolled_embedding = embedding
            
            self.update_status("✓ Photo captured! Saving...", "#00ff00")
            
            # Save immediately
            self.finish_enrollment()
        
        except Exception as e:
            error_msg = str(e)
            messagebox.showerror(
                "Capture Error", 
                f"Failed to capture photo:\n\n{error_msg}\n\n"
                "Please try again with:\n"
                "• Better lighting\n"
                "• Clear view of your face\n"
                "• No obstructions"
            )
            self.update_status("❌ Capture failed", "#ff0000")
            print(f"Capture error details: {e}")
    
    def finish_enrollment(self):
        """Finish enrollment and save data"""
        self.hide_capture_button()
        
        try:
            patient_folder = save_embeddings(
                self.enrolling_patient,
                [self.enrolled_embedding],
                [self.enrolled_image],
                self.database_path
            )
            
            messagebox.showinfo(
                "Success!",
                f"✅ {self.enrolling_patient} enrolled successfully!\n\n"
                f"Photo captured and saved\n"
                f"Saved to: {patient_folder}"
            )
            
            self.mode = "preview"
            self.update_status("✅ Enrollment complete - Preview mode", "#00ff00")
            self.update_info_panel()
        
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save: {str(e)}")
            self.update_status("❌ Save failed", "#ff0000")
    
    def start_recognition(self):
        """Start recognition mode"""
        patients = list_enrolled_patients(self.database_path)
        
        if not patients:
            messagebox.showwarning(
                "No Patients",
                "Please enroll at least one patient before starting recognition."
            )
            return
        
        self.mode = "recognize"
        self.last_recognition = None
        self.last_recognition_time = 0
        self.update_status("🎥 Recognition mode active - Scanning...", "#00ff00")
        self.update_info_panel()
    
    def stop_current_mode(self):
        """Stop current mode and return to preview"""
        self.hide_capture_button()
        self.mode = "preview"
        self.last_recognition = None
        self.update_status("📹 Preview mode", "#00ff00")
        self.update_info_panel()
    
    def view_patients(self):
        """Show enrolled patients"""
        patients = list_enrolled_patients(self.database_path)
        
        if not patients:
            messagebox.showinfo("Enrolled Patients", "No patients enrolled yet.")
            return
        
        patient_list = "\n".join([f"{i}. {p}" for i, p in enumerate(patients, 1)])
        messagebox.showinfo(
            "Enrolled Patients",
            f"Total: {len(patients)}\n\n{patient_list}"
        )
    
    def update_status(self, text, color):
        """Update status label"""
        self.status_label.config(text=text, fg=color)
    
    def on_closing(self):
        """Handle window closing"""
        self.camera_running = False
        if self.cap:
            self.cap.release()
        self.root.destroy()


def main():
    """Main GUI application"""
    root = tk.Tk()
    app = FacialRecognitionGUI(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()


if __name__ == "__main__":
    main()
