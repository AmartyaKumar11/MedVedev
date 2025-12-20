"""
Live Patient Recognition System
Real-time facial recognition for patient check-in
Uses cosine similarity with 0.75 threshold
"""

import cv2
import numpy as np
from deepface import DeepFace
import time
from datetime import datetime
from utils import find_best_match, list_enrolled_patients


class FaceRecognition:
    def __init__(self, database_path: str, threshold: float = 0.75):
        """
        Initialize the recognition system
        
        Args:
            database_path: Path to face database
            threshold: Similarity threshold (default: 0.75 = 75% match)
        """
        self.database_path = database_path
        self.threshold = threshold
        
        # Same settings as enrollment
        self.detector_backend = 'retinaface'
        self.model_name = 'Facenet512'
        
        # Recognition control
        self.last_recognition_time = 0
        self.recognition_cooldown = 3  # seconds between recognitions
        self.current_patient = None
        
        print(f"✓ Recognition system initialized")
        print(f"  - Model: {self.model_name}")
        print(f"  - Detector: {self.detector_backend}")
        print(f"  - Threshold: {self.threshold} (75% match required)")
        print(f"  - Database: {self.database_path}")
        
        # List enrolled patients
        patients = list_enrolled_patients(self.database_path)
        print(f"\n📋 Enrolled patients: {len(patients)}")
        for patient in patients:
            print(f"   - {patient}")
    
    def process_frame(self, frame: np.ndarray) -> tuple:
        """
        Process a single frame for face recognition
        
        Args:
            frame: Input frame from camera
            
        Returns:
            Tuple of (matched_name, confidence, face_location)
        """
        try:
            # Detect and extract face
            face_objs = DeepFace.extract_faces(
                img_path=frame,
                detector_backend=self.detector_backend,
                enforce_detection=True,
                align=True
            )
            
            if not face_objs or len(face_objs) == 0:
                return None, 0.0, None
            
            face_obj = face_objs[0]
            aligned_face = face_obj['face']
            facial_area = face_obj['facial_area']
            
            # Convert to proper format
            if aligned_face.max() <= 1.0:
                aligned_face = (aligned_face * 255).astype(np.uint8)
            
            # Generate embedding
            embedding_objs = DeepFace.represent(
                img_path=aligned_face,
                model_name=self.model_name,
                detector_backend='skip',
                enforce_detection=False
            )
            
            live_embedding = np.array(embedding_objs[0]['embedding'])
            
            # Find match in database
            matched_name, confidence = find_best_match(
                live_embedding, 
                self.database_path, 
                self.threshold
            )
            
            return matched_name, confidence, facial_area
            
        except Exception as e:
            return None, 0.0, None
    
    def run_recognition(self):
        """
        Run live face recognition system
        """
        print(f"\n{'='*60}")
        print("🎥 STARTING LIVE RECOGNITION")
        print(f"{'='*60}")
        print("\nPosition yourself in front of the camera")
        print("Press 'Q' to quit\n")
        
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot access webcam")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # Performance tracking
        frame_count = 0
        fps_start_time = time.time()
        fps = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to capture frame")
                break
            
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            display_frame = frame.copy()
            
            # Calculate FPS
            frame_count += 1
            if frame_count % 30 == 0:
                fps_end_time = time.time()
                fps = 30 / (fps_end_time - fps_start_time)
                fps_start_time = fps_end_time
            
            # Process frame (throttled to avoid overload)
            current_time = time.time()
            should_process = (current_time - self.last_recognition_time) > self.recognition_cooldown
            
            if should_process or self.current_patient is None:
                matched_name, confidence, facial_area = self.process_frame(frame)
                
                if matched_name:
                    self.current_patient = matched_name
                    self.last_recognition_time = current_time
                    
                    # Log recognition
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"\n{'='*60}")
                    print(f"✅ PATIENT RECOGNIZED!")
                    print(f"{'='*60}")
                    print(f"Name: {matched_name}")
                    print(f"Confidence: {confidence:.2%}")
                    print(f"Time: {timestamp}")
                    print(f"{'='*60}\n")
                    
                    # Draw green box for recognized patient
                    if facial_area:
                        x, y, w, h = facial_area['x'], facial_area['y'], facial_area['w'], facial_area['h']
                        cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 3)
                        
                        # Display name and confidence
                        label = f"{matched_name}"
                        conf_label = f"Match: {confidence:.1%}"
                        
                        # Background for text
                        (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
                        cv2.rectangle(display_frame, (x, y-60), (x+label_w+10, y), (0, 255, 0), -1)
                        
                        cv2.putText(display_frame, label, (x+5, y-35),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
                        cv2.putText(display_frame, conf_label, (x+5, y-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                        
                        # Success indicator
                        cv2.putText(display_frame, "CHECK-IN SUCCESSFUL", 
                                  (x, y+h+30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                
                elif confidence > 0.5:  # Partial match
                    if facial_area:
                        x, y, w, h = facial_area['x'], facial_area['y'], facial_area['w'], facial_area['h']
                        cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 165, 255), 2)
                        cv2.putText(display_frame, f"Partial Match: {confidence:.1%}", 
                                  (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
                        cv2.putText(display_frame, "Not recognized - Please enroll", 
                                  (x, y+h+25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
            
            else:
                # Still in cooldown, show cached result
                if self.current_patient:
                    try:
                        face_objs = DeepFace.extract_faces(
                            img_path=frame,
                            detector_backend=self.detector_backend,
                            enforce_detection=False,
                            align=False
                        )
                        
                        if face_objs and len(face_objs) > 0:
                            facial_area = face_objs[0]['facial_area']
                            x, y, w, h = facial_area['x'], facial_area['y'], facial_area['w'], facial_area['h']
                            cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                            cv2.putText(display_frame, self.current_patient, 
                                      (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    except:
                        pass
            
            # Display status info
            cv2.putText(display_frame, f"FPS: {fps:.1f}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(display_frame, f"Threshold: {self.threshold:.2f}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(display_frame, "Press 'Q' to quit", 
                       (10, display_frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.6, (255, 255, 0), 2)
            
            cv2.imshow('Patient Check-In System', display_frame)
            
            # Exit on 'Q' key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("\n✓ Recognition system stopped")


def main():
    """Main recognition function"""
    # Database path
    database_path = r"C:\Users\ASUS\Desktop\PRJ-3\face"
    
    print("\n" + "="*60)
    print("🏥 PATIENT CHECK-IN SYSTEM")
    print("="*60)
    
    # Initialize recognition system
    recognition = FaceRecognition(database_path, threshold=0.75)
    
    # Run recognition
    recognition.run_recognition()


if __name__ == "__main__":
    main()
