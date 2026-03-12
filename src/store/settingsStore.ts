import { create } from 'zustand';

interface SettingsState {
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language: string;
  apiBaseUrl: string;
  setWhisperModel: (model: SettingsState['whisperModel']) => void;
  setLanguage: (lang: string) => void;
  setApiBaseUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  whisperModel: 'small',
  language: 'auto',
  apiBaseUrl: 'http://10.0.2.2:8000',
  setWhisperModel: (model) => set({ whisperModel: model }),
  setLanguage: (lang) => set({ language: lang }),
  setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
}));
