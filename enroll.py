"""
Patient Enrollment System - Multi-Angle Face Capture
Captures 5 angles (front, left, right, up, down) and generates FaceNet512 embeddings
"""

import cv2
import numpy as np
from deepface import DeepFace
from pathlib import Path
import time
from utils import save_embeddings, create_database_structure


class FaceEnrollment:
    def __init__(self, database_path: str):
        """
        Initialize the enrollment system
        
        Args:
            database_path: Path to store face database
        """
        self.database_path = database_path
        create_database_structure(database_path)
        
        # Face detection backend (RetinaFace - most accurate)
        self.detector_backend = 'retinaface'
        
        # Recognition model (FaceNet512 - generates 512-dim vectors)
        self.model_name = 'Facenet512'
        
        # Angles to capture
        self.angles = [
            ('front', 'Look straight at the camera'),
            ('left', 'Turn your head LEFT (your left)'),
            ('right', 'Turn your head RIGHT (your right)'),
            ('up', 'Tilt your head UP slightly'),
            ('down', 'Tilt your head DOWN slightly')
        ]
        
        print(f"✓ Enrollment system initialized")
        print(f"  - Model: {self.model_name}")
        print(f"  - Detector: {self.detector_backend}")
        print(f"  - Database: {self.database_path}")
    
    def capture_frame(self, cap, angle_name: str, instruction: str) -> tuple:
        """
        Capture a single frame with face detection
        
        Args:
            cap: OpenCV VideoCapture object
            angle_name: Name of the angle (front, left, etc.)
            instruction: Instruction to show user
            
        Returns:
            Tuple of (captured_image, face_roi, embedding)
        """
        print(f"\n📸 Capturing: {angle_name.upper()}")
        print(f"   Instruction: {instruction}")
        print("   Press SPACE when ready, ESC to cancel")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to capture frame")
                return None, None, None
            
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            display_frame = frame.copy()
            
            # Try to detect face
            try:
                # Detect face using RetinaFace
                face_objs = DeepFace.extract_faces(
                    img_path=frame,
                    detector_backend=self.detector_backend,
                    enforce_detection=False,
                    align=True
                )
                
                if face_objs and len(face_objs) > 0:
                    # Draw rectangle around detected face
                    face_obj = face_objs[0]
                    facial_area = face_obj['facial_area']
                    x, y, w, h = facial_area['x'], facial_area['y'], facial_area['w'], facial_area['h']
                    
                    cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(display_frame, "Face Detected", (x, y-10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            except:
                pass
            
            # Display instructions
            cv2.putText(display_frame, f"{angle_name.upper()}: {instruction}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(display_frame, "SPACE: Capture | ESC: Cancel", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            cv2.imshow('Enrollment - Position Your Face', display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == 32:  # SPACE key
                print("   ⏳ Processing...")
                
                # Generate embedding using DeepFace
                try:
                    # Extract face with alignment
                    face_objs = DeepFace.extract_faces(
                        img_path=frame,
                        detector_backend=self.detector_backend,
                        enforce_detection=True,
                        align=True
                    )
                    
                    if not face_objs or len(face_objs) == 0:
                        print("   ❌ No face detected. Try again.")
                        continue
                    
                    face_obj = face_objs[0]
                    aligned_face = face_obj['face']
                    
                    # Convert to proper format for embedding
                    if aligned_face.max() <= 1.0:
                        aligned_face = (aligned_face * 255).astype(np.uint8)
                    
                    # Generate embedding
                    embedding_objs = DeepFace.represent(
                        img_path=aligned_face,
                        model_name=self.model_name,
                        detector_backend='skip',  # Already detected
                        enforce_detection=False
                    )
                    
                    embedding = np.array(embedding_objs[0]['embedding'])
                    
                    print(f"   ✓ {angle_name} captured! (Embedding size: {len(embedding)})")
                    time.sleep(0.5)
                    
                    return frame, aligned_face, embedding
                    
                except Exception as e:
                    print(f"   ❌ Error: {str(e)}")
                    print("   Try again with better lighting and positioning")
                    continue
                    
            elif key == 27:  # ESC key
                print("   Cancelled")
                return None, None, None
    
    def enroll_patient(self, patient_name: str) -> bool:
        """
        Enroll a new patient with multi-angle capture
        
        Args:
            patient_name: Name of the patient to enroll
            
        Returns:
            bool: True if successful, False otherwise
        """
        print(f"\n{'='*60}")
        print(f"🎯 ENROLLING NEW PATIENT: {patient_name}")
        print(f"{'='*60}")
        print("\n📋 You will be asked to capture 5 different angles")
        print("   This ensures accurate recognition from any position\n")
        
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot access webcam")
            return False
        
        # Set camera properties for better quality
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        embeddings = []
        images = []
        
        # Capture all 5 angles
        for angle_name, instruction in self.angles:
            frame, face, embedding = self.capture_frame(cap, angle_name, instruction)
            
            if frame is None or embedding is None:
                print("\n❌ Enrollment cancelled or failed")
                cap.release()
                cv2.destroyAllWindows()
                return False
            
            embeddings.append(embedding)
            images.append(frame)
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Save all data
        print(f"\n💾 Saving data...")
        patient_folder = save_embeddings(patient_name, embeddings, images, self.database_path)
        
        print(f"\n{'='*60}")
        print(f"✅ ENROLLMENT COMPLETE!")
        print(f"{'='*60}")
        print(f"Patient: {patient_name}")
        print(f"Angles captured: {len(embeddings)}")
        print(f"Saved to: {patient_folder}")
        print(f"\n{patient_name} can now be recognized during check-in!")
        
        return True


def main():
    """Main enrollment function"""
    import sys
    
    # Database path
    database_path = r"C:\Users\ASUS\Desktop\PRJ-3\face"
    
    print("\n" + "="*60)
    print("🏥 PATIENT ENROLLMENT SYSTEM")
    print("="*60)
    
    # Get patient name
    if len(sys.argv) > 1:
        patient_name = " ".join(sys.argv[1:])
    else:
        patient_name = input("\n👤 Enter patient name: ").strip()
    
    if not patient_name:
        print("❌ Patient name cannot be empty")
        return
    
    # Initialize enrollment system
    enrollment = FaceEnrollment(database_path)
    
    # Enroll the patient
    success = enrollment.enroll_patient(patient_name)
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
