export type Doctor = {
  id: string;
  name: string;
  age: number;
};

export const API_BASE = "http://127.0.0.1:8000";

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender?: string;
  lastVisitISO?: string;
};

export type TranscriptLine = { speaker: string; text: string; tsSec?: number };

export type SoapNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type ApiPatient = {
  id: string;
  name: string;
  created_at: string;
};

export type ApiPatientSession = {
  session_id: string;
  created_at: string;
  pdf_url: string | null;
};

export async function login(input: {
  name: string;
  password: string;
}): Promise<{ access_token: string; token_type: "bearer" }> {
  const form = new FormData();
  form.append("name", input.name);
  form.append("password", input.password);

  const res = await fetch(`${API_BASE}/doctor/login`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = res.status === 401 ? "Invalid credentials" : "Login failed";
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return (await res.json()) as { access_token: string; token_type: "bearer" };
}

export async function getPatientsApi(): Promise<{ patients: ApiPatient[] }> {
  const res = await fetch(`${API_BASE}/patients`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!res.ok) {
    throw Object.assign(new Error("Failed to load patients"), {
      status: res.status,
    });
  }
  return (await res.json()) as { patients: ApiPatient[] };
}

export async function getPatientSessionsApi(input: {
  patient_id: string;
}): Promise<{ sessions: ApiPatientSession[] }> {
  const res = await fetch(`${API_BASE}/patients/${input.patient_id}/sessions`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!res.ok) {
    throw Object.assign(new Error("Failed to load sessions"), {
      status: res.status,
    });
  }
  return (await res.json()) as { sessions: ApiPatientSession[] };
}

export async function processSession(input: {
  file: File;
  patient_name: string;
}): Promise<{ conversation: TranscriptLine[]; soap: SoapNote; pdf_url: string }> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("patient_name", input.patient_name);

  const res = await fetch(`${API_BASE}/session/process`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });
  if (res.status === 401) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!res.ok) {
    throw Object.assign(new Error("Processing failed"), { status: res.status });
  }
  return (await res.json()) as {
    conversation: TranscriptLine[];
    soap: SoapNote;
    pdf_url: string;
  };
}

