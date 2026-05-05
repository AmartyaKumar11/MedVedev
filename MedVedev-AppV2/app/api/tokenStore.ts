import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store based JWT store.
 */

let _token: string | null = null;
let _doctorId: string | null = null;
let _doctorName: string | null = null;

export async function setToken(token: string, doctorId: string, doctorName: string) {
  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('doctorId', doctorId);
  await SecureStore.setItemAsync('doctorName', doctorName);
  // also set in-memory for sync access
  _token = token; _doctorId = doctorId; _doctorName = doctorName;
}

export async function loadToken() {
  _token = await SecureStore.getItemAsync('token');
  _doctorId = await SecureStore.getItemAsync('doctorId');
  _doctorName = await SecureStore.getItemAsync('doctorName');
}

export function getToken(): string | null {
  return _token;
}

export function getDoctorId(): string | null {
  return _doctorId;
}

export function getDoctorName(): string | null {
  return _doctorName;
}

export async function clearToken() {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('doctorId');
  await SecureStore.deleteItemAsync('doctorName');
  _token = null; _doctorId = null; _doctorName = null;
}
