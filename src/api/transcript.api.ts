import { Config } from '../constants/config';
import { MOCK_TRANSCRIPT, MOCK_SOAP } from '../mocks/mockData';
import { TranscriptSegment, SOAPNote } from '../types';
import client from './client';

export async function getTranscriptApi(sessionId: string): Promise<TranscriptSegment[]> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_TRANSCRIPT.filter((s) => s.sessionId === sessionId).length
      ? MOCK_TRANSCRIPT
      : MOCK_TRANSCRIPT.map((s) => ({ ...s, sessionId }));
  }
  const res = await client.get(`/transcript/${sessionId}`);
  return res.data;
}

export async function getSOAPNoteApi(sessionId: string): Promise<SOAPNote> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 500));
    return { ...MOCK_SOAP, sessionId };
  }
  const res = await client.get(`/note/${sessionId}`);
  return res.data;
}
