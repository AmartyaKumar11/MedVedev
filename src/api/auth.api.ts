import { Config } from '../constants/config';
import { MOCK_DOCTOR } from '../mocks/mockData';
import { Doctor } from '../types';
import client from './client';

export async function loginApi(email: string, password: string): Promise<{ doctor: Doctor; token: string }> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 800));
    return { doctor: MOCK_DOCTOR, token: 'mock-jwt-token-12345' };
  }
  const res = await client.post('/auth/login', { email, password });
  return res.data;
}

export async function registerApi(name: string, email: string, password: string): Promise<{ doctor: Doctor; token: string }> {
  if (Config.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 800));
    return { doctor: { ...MOCK_DOCTOR, name, email }, token: 'mock-jwt-token-12345' };
  }
  const res = await client.post('/auth/register', { name, email, password });
  return res.data;
}
