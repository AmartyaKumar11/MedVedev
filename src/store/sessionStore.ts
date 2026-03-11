import { create } from 'zustand';
import { Session, TranscriptSegment } from '../types';

interface SessionState {
  activeSession: Session | null;
  transcript: TranscriptSegment[];
  isRecording: boolean;
  setActiveSession: (session: Session | null) => void;
  appendSegment: (segment: TranscriptSegment) => void;
  setRecording: (val: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  transcript: [],
  isRecording: false,
  setActiveSession: (session) => set({ activeSession: session }),
  appendSegment: (segment) =>
    set((state) => ({ transcript: [...state.transcript, segment] })),
  setRecording: (val) => set({ isRecording: val }),
  clearSession: () => set({ activeSession: null, transcript: [], isRecording: false }),
}));
