import { Config } from '../constants/config';
import { MOCK_SPEAKERS } from '../mocks/mockData';
import { SpeakerProfile } from '../types';
import client from './client';

export async function getSpeakersApi(): Promise<SpeakerProfile[]> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_SPEAKERS;
  }
  const res = await client.get('/doctor/speakers');
  return res.data;
}

export async function enrollVoiceApi(name: string, audioUri: string): Promise<SpeakerProfile> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 1000));
    return { id: `spk-${Date.now()}`, doctorId: 'doc-001', name, sampleCount: 1 };
  }
  const formData = new FormData();
  formData.append('name', name);
  formData.append('audio', { uri: audioUri, type: 'audio/wav', name: 'sample.wav' } as any);
  const res = await client.post('/doctor/enroll-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
