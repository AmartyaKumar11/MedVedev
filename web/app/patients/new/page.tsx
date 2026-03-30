"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPatient } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function NewPatientPage() {
  const router = useRouter();
  const doctor = useAppStore((s) => s.doctor);
  const addPatient = useAppStore((s) => s.addPatient);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);

  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [gender, setGender] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim() === "") {
      setError("Please enter a patient name.");
      return;
    }
    if (typeof age !== "number" || age <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    setSubmitting(true);
    try {
      const { patient } = await createPatient({
        name: name.trim(),
        age,
        gender: gender.trim() || undefined,
      });
      addPatient(patient);
      setActivePatientId(patient.id);
      router.push(`/consultation?patientId=${encodeURIComponent(patient.id)}`);
    } catch {
      setError("Could not create patient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-[calc(100vh-4rem)] sticky top-8 hidden lg:block">
          <Sidebar />
        </div>

        <div className="grid gap-6">
          <Topbar
            title="Add New Patient"
            right={
              <Link href="/dashboard">
                <Button variant="ghost">Back</Button>
              </Link>
            }
          />

          <GlassCard className="p-7 max-w-2xl">
            <div className="text-[11px] tracking-[0.22em] text-white/40">
              PATIENT DETAILS
            </div>
            <form onSubmit={submit} className="mt-6 grid gap-3">
              <div className="grid gap-2">
                <div className="text-xs tracking-[0.18em] text-white/40">
                  NAME
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <div className="text-xs tracking-[0.18em] text-white/40">
                  AGE
                </div>
                <Input
                  value={age}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setAge(v === "" ? "" : Number(v));
                  }}
                  placeholder="e.g. 45"
                  inputMode="numeric"
                />
              </div>
              <div className="grid gap-2">
                <div className="text-xs tracking-[0.18em] text-white/40">
                  GENDER (OPTIONAL)
                </div>
                <Input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Female / Male / Other"
                  autoComplete="off"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-sm text-white/75">
                  {error}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Start Consultation"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

