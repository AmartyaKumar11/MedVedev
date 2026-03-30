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
import { getSOAP, getTranscript, startRecording, stopRecording } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function ConsultationClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const doctor = useAppStore((s) => s.doctor);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);
  const recordingId = useAppStore((s) => s.recordingId);
  const setRecordingId = useAppStore((s) => s.setRecordingId);
  const transcript = useAppStore((s) => s.transcript);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const soap = useAppStore((s) => s.soap);
  const setSoap = useAppStore((s) => s.setSoap);

  const patientId = sp.get("patientId");

  const [processing, setProcessing] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "recording" | "processing">(
    "idle",
  );

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  React.useEffect(() => {
    setTranscript([]);
    setSoap(null);
    setActivePatientId(patientId);
  }, [patientId, setActivePatientId, setSoap, setTranscript]);

  async function onStart() {
    setStatus("recording");
    const { recordingId } = await startRecording();
    setRecordingId(recordingId);
  }

  async function onStop() {
    if (!recordingId) return;
    setProcessing(true);
    setStatus("processing");
    await stopRecording({ recordingId });
    setRecordingId(null);
    const { transcript } = await getTranscript({ recordingId });
    setTranscript(transcript);
    setProcessing(false);
    setStatus("idle");
  }

  async function generate() {
    if (!transcript.length) return;
    setProcessing(true);
    setStatus("processing");
    const rid = recordingId ?? "last";
    const { soap } = await getSOAP({ recordingId: rid });
    setSoap(soap);
    setProcessing(false);
    setStatus("idle");
    router.push(`/report/${encodeURIComponent(rid)}`);
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

          {!patientId ? (
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

              <div className="grid gap-6 lg:grid-cols-2">
                <TranscriptViewer lines={transcript} />
                <SOAPViewer soap={soap} />
              </div>

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

