"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { MicRecorder } from "@/components/MicRecorder";
import { Sidebar } from "@/components/Sidebar";
import { SOAPViewer } from "@/components/SOAPViewer";
import { Topbar } from "@/components/Topbar";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { Button } from "@/components/ui/button";
import { API_BASE, getPatientsApi, processSession } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function ConsultationClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const doctor = useAppStore((s) => s.doctor);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);
  const transcript = useAppStore((s) => s.transcript);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const soap = useAppStore((s) => s.soap);
  const setSoap = useAppStore((s) => s.setSoap);

  const patientId = sp.get("patientId");
  const patientNameParam = sp.get("patientName");

  const [processing, setProcessing] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "recording" | "processing">(
    "idle",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pdfHref, setPdfHref] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  React.useEffect(() => {
    setTranscript([]);
    setSoap(null);
    setPdfHref(null);
    setError(null);
    setActivePatientId(patientId);
  }, [patientId, setActivePatientId, setSoap, setTranscript]);

  React.useEffect(() => {
    return () => {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function onStart() {
    setError(null);
    if (!patientId && !patientNameParam) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start();
      setStatus("recording");
    } catch {
      setError("Could not start microphone recording. Please allow microphone access.");
      setStatus("idle");
    }
  }

  function onCancelRecording() {
    setError(null);
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setStatus("idle");
      return;
    }
    mr.onstop = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      setStatus("idle");
    };
    mr.stop();
  }

  async function onStop() {
    if (!patientId && !patientNameParam) return;
    setProcessing(true);
    setStatus("processing");
    setError(null);
    setPdfHref(null);
    try {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") {
        setError("No active recording found.");
        return;
      }

      const blob = await new Promise<Blob>((resolve) => {
        mr.onstop = () => {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          resolve(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
        };
        mr.stop();
      });

      const file = new File([blob], `consultation_${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });

      let patientName: string | undefined;
      if (patientId) {
        const { patients } = await getPatientsApi();
        const patient = patients.find((p) => p.id === patientId);
        patientName = patient?.name?.trim();
      } else if (patientNameParam) {
        patientName = patientNameParam.trim();
      }
      if (!patientName) {
        setError("Patient record not found. Please try from dashboard again.");
        return;
      }

      const result = await processSession({
        file,
        patient_name: patientName,
      });
      setTranscript(result.conversation);
      setSoap(result.soap);
      setPdfHref(`${API_BASE}${result.pdf_url}`);

      // If this was a brand-new patient flow (patientNameParam), resolve the created patient_id
      // so "Generate Report" and history pages work.
      if (!patientId) {
        const { patients } = await getPatientsApi();
        const match = patients
          .filter((p) => p.name.trim().toLowerCase() === patientName.toLowerCase())
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
        if (match) {
          setActivePatientId(match.id);
        }
      }
    } catch (e) {
      const status =
        typeof e === "object" && e !== null && "status" in e
          ? (e as { status?: number }).status
          : undefined;
      if (status === 401) {
        window.localStorage.removeItem("token");
        router.push("/signin");
        return;
      }
      setError("Processing failed. Please try again.");
    } finally {
      setProcessing(false);
      setStatus("idle");
    }
  }

  async function generate() {
    if (!transcript.length) return;
    const pid = patientId ?? useAppStore.getState().activePatientId ?? "";
    if (!pid) return;
    router.push(`/report/${encodeURIComponent(pid)}`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-[calc(100vh-4rem)] sticky top-8 hidden lg:block">
          <Sidebar />
        </div>

        <div className="grid gap-6">
          <Topbar
            title="Consultation"
            right={
              <Link href="/dashboard">
                <Button variant="ghost">Back</Button>
              </Link>
            }
          />

          {!patientId && !patientNameParam ? (
            <GlassCard className="p-7">
              <div className="text-sm font-medium text-white/85">
                No patient selected
              </div>
              <div className="mt-2 text-sm text-white/50">
                Go back to the dashboard and start a consultation from a patient.
              </div>
              <div className="mt-5">
                <Link href="/dashboard">
                  <Button>Return to Dashboard</Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <>
              <MicRecorder
                processing={processing}
                onStart={() => void onStart()}
                onStop={() => void onStop()}
                onCancel={onCancelRecording}
              />

              {status === "processing" ? (
                <GlassCard className="p-6">
                  <div className="text-sm font-medium text-white/85">
                    Processing…
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    Generating transcript with speaker labels.
                  </div>
                </GlassCard>
              ) : null}

              {error ? (
                <GlassCard className="p-6">
                  <div className="text-sm text-white/75">{error}</div>
                </GlassCard>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <TranscriptViewer lines={transcript} />
                <SOAPViewer soap={soap} />
              </div>

              {pdfHref ? (
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/75">Report ready.</span>
                    <a
                      href={pdfHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/85 hover:text-white/95"
                    >
                      Download PDF
                    </a>
                  </div>
                </GlassCard>
              ) : null}

              <div className="flex items-center justify-end">
                <Button
                  disabled={processing || transcript.length === 0}
                  onClick={() => void generate()}
                >
                  Generate Report
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

