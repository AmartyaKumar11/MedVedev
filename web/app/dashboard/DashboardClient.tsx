"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { PatientCard } from "@/components/PatientCard";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPatientsApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function DashboardClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") ?? "dashboard";

  const doctor = useAppStore((s) => s.doctor);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);

  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [apiPatients, setApiPatients] = React.useState<
    { id: string; name: string; created_at: string }[]
  >([]);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const { patients } = await getPatientsApi();
        if (!cancelled) setApiPatients(patients);
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
        if (!cancelled) setApiError("Could not load patients.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  const filtered = apiPatients.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="min-h-[calc(100vh-0px)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-[calc(100vh-4rem)] sticky top-8 hidden lg:block">
            <Sidebar />
          </div>

          <div className="grid gap-6">
            <Topbar
              title={
                doctor
                  ? `Dr. ${doctor.name.replace(/^Dr\.\s*/i, "")}`
                  : "Dashboard"
              }
              right={
                <div className="text-xs text-white/45">
                  Doctor ID{" "}
                  <span className="text-white/75">{doctor?.id ?? "—"}</span>
                </div>
              }
            />

            <GlassCard className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-white/85">
                    Patients
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    Search and start a consultation.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search patients…"
                    className="sm:w-[280px]"
                  />
                  <Link href="/patients/new">
                    <Button>Add New Patient</Button>
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {loading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                    Loading patients…
                  </div>
                ) : apiError ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                    {apiError}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                    No patients found.
                  </div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      className="grid gap-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Link href={`/patients/${encodeURIComponent(p.id)}`}>
                          <PatientCard
                            patient={{
                              id: p.id,
                              name: p.name,
                              age: 0,
                              lastVisitISO: p.created_at,
                            }}
                          />
                        </Link>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/patients/${encodeURIComponent(p.id)}`)}
                          >
                            History
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActivePatientId(p.id);
                              router.push(
                                `/consultation?patientId=${encodeURIComponent(p.id)}`,
                              );
                            }}
                          >
                            Start Consultation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {tab !== "dashboard" ? (
              <GlassCard className="p-5">
                <div className="text-sm font-medium text-white/85">
                  {tab === "patients" ? "Patients" : "Sessions"}
                </div>
                <div className="mt-2 text-sm text-white/50">
                  This section is UI-only in the mock build.
                </div>
              </GlassCard>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

