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
import { getPatients } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function DashboardClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") ?? "dashboard";

  const doctor = useAppStore((s) => s.doctor);
  const patients = useAppStore((s) => s.patients);
  const setPatients = useAppStore((s) => s.setPatients);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);

  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { patients } = await getPatients();
      if (!cancelled) setPatients(patients);
    })();
    return () => {
      cancelled = true;
    };
  }, [setPatients]);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  const filtered = patients.filter((p) =>
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
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/55">
                    No patients found.
                  </div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      className="grid gap-3 sm:grid-cols-[1fr_auto]"
                    >
                      <PatientCard patient={p} />
                      <div className="flex items-center justify-end">
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

