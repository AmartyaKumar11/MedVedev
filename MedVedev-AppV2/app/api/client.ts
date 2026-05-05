/**
 * Thin Axios client shared by every API module.
 *
 * - Automatically injects `Authorization: Bearer <token>` on every request
 *   once the doctor is logged in.
 * - Returns a plain axios instance — callers handle errors themselves.
 */

import axios from "axios";
import { API_BASE_URL } from "./config";
import { getToken } from "./tokenStore";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
});

// Attach the stored JWT before every request
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as any;
    }
  }
  return config;
});

export default client;
