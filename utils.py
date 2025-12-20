"""
Utility functions for facial recognition system
Handles embedding comparison, storage management, and vector operations
"""

import os
import pickle
import numpy as np
from typing import List, Dict, Tuple, Optional
from pathlib import Path


def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two embeddings
    
    Args:
        embedding1: First face embedding vector
        embedding2: Second face embedding vector
        
    Returns:
        float: Similarity score between 0 and 1 (higher = more similar)
    """
    # Normalize vectors
    embedding1_norm = embedding1 / np.linalg.norm(embedding1)
    embedding2_norm = embedding2 / np.linalg.norm(embedding2)
    
    # Calculate cosine similarity
    similarity = np.dot(embedding1_norm, embedding2_norm)
    return float(similarity)


def find_best_match(live_embedding: np.ndarray, 
                    database_path: str, 
                    threshold: float = 0.75) -> Tuple[Optional[str], float]:
    """
    Find the best matching patient from the database
    
    Args:
        live_embedding: The embedding from live camera feed
        database_path: Path to the face database directory
        threshold: Minimum similarity score to consider a match (default: 0.75)
        
    Returns:
        Tuple of (patient_name, similarity_score) or (None, 0.0) if no match
    """
    best_match = None
    best_score = 0.0
    
    # Iterate through all patient folders
    for patient_folder in Path(database_path).iterdir():
        if not patient_folder.is_dir():
            continue
            
        embeddings_file = patient_folder / "embeddings.pkl"
        if not embeddings_file.exists():
            continue
            
        # Load stored embeddings
        with open(embeddings_file, 'rb') as f:
            stored_data = pickle.load(f)
            stored_embeddings = stored_data['embeddings']
        
        # Compare with all stored embeddings (5 angles)
        for embedding in stored_embeddings:
            similarity = cosine_similarity(live_embedding, embedding)
            
            if similarity > best_score:
                best_score = similarity
                best_match = patient_folder.name
    
    # Return match only if above threshold
    if best_score >= threshold:
        return best_match, best_score
    else:
        return None, best_score


def save_embeddings(patient_name: str, 
                   embeddings: List[np.ndarray], 
                   images: List[np.ndarray],
                   database_path: str) -> str:
    """
    Save patient embeddings and images to disk
    
    Args:
        patient_name: Name of the patient
        embeddings: List of 5 face embeddings (one per angle)
        images: List of 5 face images
        database_path: Path to the face database directory
        
    Returns:
        str: Path to the created patient folder
    """
    import cv2
    
    # Create patient folder
    patient_folder = Path(database_path) / patient_name.replace(" ", "_")
    patient_folder.mkdir(parents=True, exist_ok=True)
    
    # Save images
    angle_names = ['front', 'left', 'right', 'up', 'down']
    for i, (img, angle) in enumerate(zip(images, angle_names)):
        img_path = patient_folder / f"{angle}.jpg"
        cv2.imwrite(str(img_path), img)
    
    # Save embeddings
    embeddings_data = {
        'name': patient_name,
        'embeddings': embeddings,
        'angle_names': angle_names
    }
    
    embeddings_file = patient_folder / "embeddings.pkl"
    with open(embeddings_file, 'wb') as f:
        pickle.dump(embeddings_data, f)
    
    return str(patient_folder)


def load_patient_embeddings(patient_name: str, database_path: str) -> Optional[Dict]:
    """
    Load embeddings for a specific patient
    
    Args:
        patient_name: Name of the patient
        database_path: Path to the face database directory
        
    Returns:
        Dictionary with patient data or None if not found
    """
    patient_folder = Path(database_path) / patient_name.replace(" ", "_")
    embeddings_file = patient_folder / "embeddings.pkl"
    
    if not embeddings_file.exists():
        return None
    
    with open(embeddings_file, 'rb') as f:
        return pickle.load(f)


def list_enrolled_patients(database_path: str) -> List[str]:
    """
    Get list of all enrolled patients
    
    Args:
        database_path: Path to the face database directory
        
    Returns:
        List of patient names
    """
    patients = []
    
    for patient_folder in Path(database_path).iterdir():
        if patient_folder.is_dir():
            embeddings_file = patient_folder / "embeddings.pkl"
            if embeddings_file.exists():
                patients.append(patient_folder.name)
    
    return sorted(patients)


def create_database_structure(database_path: str):
    """
    Create the database directory structure if it doesn't exist
    
    Args:
        database_path: Path to create the face database
    """
    Path(database_path).mkdir(parents=True, exist_ok=True)
    print(f"✓ Database directory ready at: {database_path}")
