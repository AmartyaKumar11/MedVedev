import { Config } from '../constants/config';
import { MOCK_SESSIONS } from '../mocks/mockData';
import { Session } from '../types';
import client from './client';

export async function startSessionApi(doctorId: string): Promise<Session> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      id: `sess-${Date.now()}`,
      doctorId,
      startedAt: new Date().toISOString(),
    };
  }
  const res = await client.post('/session/start', { doctorId });
  return res.data;
}

export async function finalizeSessionApi(sessionId: string): Promise<Session> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return { ...MOCK_SESSIONS[0], id: sessionId, endedAt: new Date().toISOString() };
  }
  const res = await client.post(`/session/${sessionId}/finalize`);
  return res.data;
}

export async function getSessionsApi(): Promise<Session[]> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_SESSIONS;
  }
  const res = await client.get('/session');
  return res.data;
}
