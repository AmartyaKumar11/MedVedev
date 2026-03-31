"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Sidebar } from "@/components/Sidebar";
import { SOAPViewer } from "@/components/SOAPViewer";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { API_BASE, getPatientSessionsApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function ReportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const doctor = useAppStore((s) => s.doctor);
  const patients = useAppStore((s) => s.patients);
  const activePatientId = useAppStore((s) => s.activePatientId);
  const soap = useAppStore((s) => s.soap);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<
    { session_id: string; created_at: string; pdf_url: string }[]
  >([]);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await getPatientSessionsApi({ patient_id: reportId });
        if (cancelled) return;
        setSessions(res.sessions);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.status === 401) {
          window.localStorage.removeItem("token");
          router.push("/signin");
          return;
        }
        setError("Unable to load sessions for this patient.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId, router]);

  const patient =
    (activePatientId ? patients.find((p) => p.id === activePatientId) : null) ??
    null;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-[calc(100vh-4rem)] sticky top-8 hidden lg:block">
          <Sidebar />
        </div>

        <div className="grid gap-6">
          <Topbar
            title="Report"
            right={
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              </div>
            }
          />

          <GlassCard className="p-6">
            <div className="text-[11px] tracking-[0.22em] text-white/40">
              PATIENT DETAILS
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <div className="text-xs tracking-[0.18em] text-white/45">
                  NAME
                </div>
                <div className="mt-2 text-sm text-white/80">
                  {patient?.name ?? "—"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <div className="text-xs tracking-[0.18em] text-white/45">
                  PATIENT ID
                </div>
                <div className="mt-2 text-sm text-white/80">{reportId}</div>
              </div>
            </div>
          </GlassCard>

          <SOAPViewer soap={soap} />

          <GlassCard className="p-6">
            <div className="text-[11px] tracking-[0.22em] text-white/40">
              SESSION HISTORY
            </div>
            {loading ? (
              <div className="mt-3 text-sm text-white/60">Loading sessions…</div>
            ) : error ? (
              <div className="mt-3 text-sm text-red-400/80">{error}</div>
            ) : sessions.length === 0 ? (
              <div className="mt-3 text-sm text-white/60">No sessions yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-white/80">
                        Session on {new Date(s.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`${API_BASE}${s.pdf_url}`, "_blank", "noopener,noreferrer")
                      }
                    >
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

