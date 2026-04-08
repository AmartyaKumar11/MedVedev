import { create } from "zustand";

import type { Doctor, Patient, SoapNote, TranscriptLine } from "@/lib/api";

type AppState = {
  doctor: Doctor | null;
  setDoctor: (doctor: Doctor | null) => void;

  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;

  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;

  recordingId: string | null;
  setRecordingId: (id: string | null) => void;

  transcript: TranscriptLine[];
  setTranscript: (t: TranscriptLine[]) => void;

  soap: SoapNote | null;
  setSoap: (s: SoapNote | null) => void;

  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;

  logout: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  doctor: null,
  setDoctor: (doctor) => set({ doctor }),

  patients: [],
  setPatients: (patients) => set({ patients }),
  addPatient: (patient) =>
    set((s) => ({ patients: [patient, ...s.patients] })),

  activePatientId: null,
  setActivePatientId: (id) => set({ activePatientId: id }),

  recordingId: null,
  setRecordingId: (id) => set({ recordingId: id }),

  transcript: [],
  setTranscript: (transcript) => set({ transcript }),

  soap: null,
  setSoap: (soap) => set({ soap }),

  pdfUrl: null,
  setPdfUrl: (pdfUrl) => set({ pdfUrl }),

  logout: () =>
    set({
      doctor: null,
      activePatientId: null,
      recordingId: null,
      transcript: [],
      soap: null,
      pdfUrl: null,
    }),
}));

