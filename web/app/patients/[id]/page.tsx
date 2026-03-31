"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { API_BASE, getPatientSessionsApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function PatientHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const doctor = useAppStore((s) => s.doctor);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<
    { session_id: string; created_at: string; pdf_url: string | null }[]
  >([]);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { sessions } = await getPatientSessionsApi({ patient_id: patientId });
        if (!cancelled) setSessions(sessions);
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
        if (!cancelled) setError("Could not load session history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, router]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-[calc(100vh-4rem)] sticky top-8 hidden lg:block">
          <Sidebar />
        </div>

        <div className="grid gap-6">
          <Topbar
            title="Patient Sessions"
            right={
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost">Back</Button>
                </Link>
                <Link href="/patients/new">
                  <Button>Add New Patient</Button>
                </Link>
              </div>
            }
          />

          <GlassCard className="p-5">
            <div className="text-sm font-medium text-white/85">Session History</div>
            <div className="mt-1 text-xs text-white/45">
              Patient ID <span className="text-white/70">{patientId}</span>
            </div>

            <div className="mt-5 grid gap-3">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                  Loading sessions…
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                  {error}
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                  No sessions yet.
                </div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="rounded-2xl border border-white/10 bg-white/6 p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-white/85">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        Session <span className="text-white/70">{s.session_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.pdf_url ? (
                        <a
                          href={`${API_BASE}${s.pdf_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-white/85 hover:text-white/95"
                        >
                          View Report
                        </a>
                      ) : (
                        <div className="text-xs text-white/40">No report</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

