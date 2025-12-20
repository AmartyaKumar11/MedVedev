"""
Main Application - Patient Facial Recognition System
Menu-driven interface for enrollment and recognition
"""

import sys
from pathlib import Path

# Import modules
from enroll import FaceEnrollment
from recognize import FaceRecognition
from utils import list_enrolled_patients, create_database_structure


class FacialRecognitionApp:
    def __init__(self):
        """Initialize the application"""
        self.database_path = r"C:\Users\ASUS\Desktop\PRJ-3\face"
        create_database_structure(self.database_path)
        
        print("\n" + "="*70)
        print(" " * 15 + "🏥 PATIENT FACIAL RECOGNITION SYSTEM")
        print("="*70)
        print("\n📋 System Information:")
        print(f"   Database Location: {self.database_path}")
        print(f"   Face Detection: RetinaFace (High Accuracy)")
        print(f"   Recognition Model: FaceNet512 (512-dimensional vectors)")
        print(f"   Match Threshold: 75% (0.75 cosine similarity)")
    
    def show_menu(self):
        """Display main menu"""
        print("\n" + "="*70)
        print(" " * 25 + "📋 MAIN MENU")
        print("="*70)
        print("\n  [1] 🎯 Enroll New Patient")
        print("  [2] 🎥 Start Live Recognition (Check-In)")
        print("  [3] 📋 View Enrolled Patients")
        print("  [4] 📷 Test Camera Preview")
        print("  [5] ℹ️  System Information")
        print("  [6] ❌ Exit")
        print("\n" + "-"*70)
    
    def enroll_patient(self):
        """Handle patient enrollment"""
        print("\n" + "="*70)
        print(" " * 20 + "🎯 PATIENT ENROLLMENT")
        print("="*70)
        
        patient_name = input("\n👤 Enter patient full name: ").strip()
        
        if not patient_name:
            print("❌ Patient name cannot be empty")
            input("\nPress Enter to continue...")
            return
        
        # Check if already enrolled
        enrolled = list_enrolled_patients(self.database_path)
        if patient_name.replace(" ", "_") in enrolled:
            print(f"\n⚠️  Warning: {patient_name} is already enrolled!")
            choice = input("Do you want to re-enroll? (yes/no): ").strip().lower()
            if choice not in ['yes', 'y']:
                return
        
        # Perform enrollment
        enrollment = FaceEnrollment(self.database_path)
        enrollment.enroll_patient(patient_name)
        
        input("\nPress Enter to continue...")
    
    def start_recognition(self):
        """Handle live recognition"""
        enrolled = list_enrolled_patients(self.database_path)
        
        if not enrolled:
            print("\n⚠️  Warning: No patients enrolled yet!")
            print("   Please enroll at least one patient before starting recognition.")
            input("\nPress Enter to continue...")
            return
        
        recognition = FaceRecognition(self.database_path, threshold=0.75)
        recognition.run_recognition()
    
    def view_enrolled_patients(self):
        """Display list of enrolled patients"""
        print("\n" + "="*70)
        print(" " * 20 + "📋 ENROLLED PATIENTS")
        print("="*70)
        
        patients = list_enrolled_patients(self.database_path)
        
        if not patients:
            print("\n   No patients enrolled yet.")
        else:
            print(f"\n   Total Patients: {len(patients)}\n")
            for i, patient in enumerate(patients, 1):
                patient_folder = Path(self.database_path) / patient
                
                # Check files
                has_embeddings = (patient_folder / "embeddings.pkl").exists()
                image_count = len(list(patient_folder.glob("*.jpg")))
                
                status = "✅ Complete" if has_embeddings and image_count == 5 else "⚠️  Incomplete"
                
                print(f"   {i}. {patient.replace('_', ' ')}")
                print(f"      Status: {status} | Images: {image_count}/5 | Embeddings: {'Yes' if has_embeddings else 'No'}")
        
        input("\n" + "-"*70 + "\nPress Enter to continue...")
    
    def test_camera(self):
        """Test camera preview"""
        import cv2
        
        print("\n" + "="*70)
        print(" " * 22 + "📷 CAMERA PREVIEW TEST")
        print("="*70)
        print("\n🎥 Opening camera...")
        
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot access webcam")
            print("   Please check:")
            print("   - Camera is connected")
            print("   - No other app is using the camera")
            print("   - Camera permissions are granted")
            input("\nPress Enter to continue...")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        print("✓ Camera opened successfully!")
        print("\n📋 Instructions:")
        print("   - Position yourself in front of the camera")
        print("   - Check lighting and background")
        print("   - Press 'Q' to exit preview")
        print("\nStarting preview in 2 seconds...\n")
        
        import time
        time.sleep(2)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to capture frame")
                break
            
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Add helpful overlay
            height, width = frame.shape[:2]
            
            # Title
            cv2.putText(frame, "CAMERA PREVIEW TEST", 
                       (width//2 - 200, 40), cv2.FONT_HERSHEY_SIMPLEX, 
                       1.0, (255, 255, 255), 3)
            
            # Instructions
            cv2.putText(frame, "Press 'Q' to exit", 
                       (20, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.7, (0, 255, 255), 2)
            
            # Face position guide (center rectangle)
            guide_width = 300
            guide_height = 400
            guide_x = (width - guide_width) // 2
            guide_y = (height - guide_height) // 2
            
            cv2.rectangle(frame, (guide_x, guide_y), 
                         (guide_x + guide_width, guide_y + guide_height), 
                         (0, 255, 0), 2)
            cv2.putText(frame, "Position face here", 
                       (guide_x + 50, guide_y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Camera info
            cv2.putText(frame, f"Resolution: {width}x{height}", 
                       (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Camera Preview Test', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        print("\n✓ Camera preview closed")
        input("Press Enter to continue...")
    
    def show_info(self):
        """Display system information"""
        print("\n" + "="*70)
        print(" " * 22 + "ℹ️  SYSTEM INFORMATION")
        print("="*70)
        
        print("\n📊 Technical Specifications:")
        print("   ├─ Language: Python 3.13")
        print("   ├─ Core Library: DeepFace (Multi-model wrapper)")
        print("   ├─ Face Detection: RetinaFace")
        print("   │  └─ Advantages: High accuracy even with masks, glasses, or poor lighting")
        print("   ├─ Recognition Model: FaceNet512")
        print("   │  └─ Embedding Size: 512 dimensions")
        print("   └─ Matching Algorithm: Cosine Similarity")
        print("      └─ Threshold: 0.75 (75% match required)")
        
        print("\n🔄 Workflow:")
        print("   1️⃣  Enrollment Phase:")
        print("      ├─ Capture 5 angles (front, left, right, up, down)")
        print("      ├─ Detect face using RetinaFace")
        print("      ├─ Align and normalize face orientation")
        print("      ├─ Generate 512-dim embedding per angle")
        print("      └─ Store embeddings and images to disk")
        
        print("\n   2️⃣  Recognition Phase:")
        print("      ├─ Capture live video feed")
        print("      ├─ Detect and align face in real-time")
        print("      ├─ Generate live embedding")
        print("      ├─ Compare with all stored embeddings")
        print("      ├─ Calculate cosine similarity scores")
        print("      └─ Match if similarity > 75%")
        
        print(f"\n📁 Database Structure:")
        print(f"   {self.database_path}")
        print("   ├─ Patient_Name/")
        print("   │  ├─ front.jpg")
        print("   │  ├─ left.jpg")
        print("   │  ├─ right.jpg")
        print("   │  ├─ up.jpg")
        print("   │  ├─ down.jpg")
        print("   │  └─ embeddings.pkl (512-dim vectors)")
        
        enrolled_count = len(list_enrolled_patients(self.database_path))
        print(f"\n📈 Current Status:")
        print(f"   └─ Enrolled Patients: {enrolled_count}")
        
        input("\n" + "-"*70 + "\nPress Enter to continue...")
    
    def run(self):
        """Main application loop"""
        while True:
            self.show_menu()
            choice = input("Select an option (1-6): ").strip()
            
            if choice == '1':
                self.enroll_patient()
            elif choice == '2':
                self.start_recognition()
            elif choice == '3':
                self.view_enrolled_patients()
            elif choice == '4':
                self.test_camera()
            elif choice == '5':
                self.show_info()
            elif choice == '6':
                print("\n" + "="*70)
                print(" " * 25 + "👋 Goodbye!")
                print("="*70 + "\n")
                sys.exit(0)
            else:
                print("\n❌ Invalid option. Please select 1-6.")
                input("Press Enter to continue...")


def main():
    """Entry point"""
    try:
        app = FacialRecognitionApp()
        app.run()
    except KeyboardInterrupt:
        print("\n\n" + "="*70)
        print(" " * 20 + "⚠️  Program Interrupted")
        print("="*70 + "\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
