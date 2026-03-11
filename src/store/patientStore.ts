import { create } from 'zustand';
import { Patient, Recording } from '../types';
import { MOCK_PATIENTS } from '../mocks/mockData';

interface PatientState {
  patients: Patient[];
  recordings: Record<number, Recording[]>;
  addPatient: (name: string) => void;
  addRecording: (patientId: number, audioUri: string, durationMs?: number) => void;
  getRecordings: (patientId: number) => Recording[];
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [...MOCK_PATIENTS],
  recordings: {},

  addPatient: (name) => {
    const ids = get().patients.map((p) => p.id);
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    set((state) => ({
      patients: [...state.patients, { id: nextId, name: name.trim() }],
    }));
  },

  addRecording: (patientId, audioUri, durationMs = 0) => {
    const state = get();
    const patient = state.patients.find((p) => p.id === patientId);
    const patientName = patient?.name ?? `Patient ${patientId}`;
    const count = (state.recordings[patientId] ?? []).length;
    const newRecording: Recording = {
      id: `rec-${Date.now()}`,
      patientId,
      name: `${patientName} ${count + 1}`,
      audioUri,
      createdAt: new Date().toISOString(),
      durationMs,
    };
    set((s) => ({
      recordings: {
        ...s.recordings,
        [patientId]: [...(s.recordings[patientId] ?? []), newRecording],
      },
    }));
  },

  getRecordings: (patientId) => get().recordings[patientId] ?? [],
}));
