"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { AudioRecorderCard } from "@/components/AudioRecorderCard";
import { AudioUploadCard } from "@/components/AudioUploadCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDoctor } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const ENROLL_SCRIPT = `Hello, my name is Dr. [Your Name].

I am recording this sample to help the system learn my voice for future consultations.

Today I will describe a few common medical scenarios.

A patient may come with fever, cough, and body aches for the past three days.

Another patient may complain of stomach pain, bloating, or discomfort after eating.

Sometimes patients describe symptoms in mixed languages like Hindi and English.

For example, they may say "pet mein dard ho raha hai" or "sir bhaari lag raha hai".

It is important for me to clearly understand their symptoms and ask follow-up questions.

I may ask about duration, severity, and any associated symptoms.

I also explain treatment options and lifestyle changes to the patient.

This recording should capture my natural speaking voice across different tones and sentences.

Thank you.`;

type SampleKey = 0 | 1 | 2;

export default function SignUpPage() {
  const router = useRouter();
  const setDoctor = useAppStore((s) => s.setDoctor);

  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [password, setPassword] = React.useState("");

  const [samples, setSamples] = React.useState<[File | null, File | null, File | null]>([
    null,
    null,
    null,
  ]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function setSample(idx: SampleKey, file: File | null) {
    setSamples((s) => {
      const next: [File | null, File | null, File | null] = [
        s[0],
        s[1],
        s[2],
      ];
      next[idx] = file;
      return next;
    });
  }

  const audioCount = samples.filter(Boolean).length;
  const canSubmit =
    name.trim().length > 0 &&
    typeof age === "number" &&
    age > 0 &&
    password.length >= 1 &&
    audioCount === 3 &&
    !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (audioCount !== 3) {
      setError("You must upload/record exactly 3 audio samples before submitting.");
      return;
    }
    if (typeof age !== "number" || age <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    setSubmitting(true);
    try {
      const { doctor } = await createDoctor({
        name: name.trim(),
        age,
        password,
        enrollmentAudios: samples.filter(Boolean) as File[],
      });
      setDoctor(doctor);
      router.push("/dashboard");
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-[11px] tracking-[0.26em] text-white/40">
          MEDVEDEV V2
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <GlassCard className="p-7">
          <div className="text-[11px] tracking-[0.22em] text-white/40">
            CREATE ACCOUNT
          </div>
          <div className="mt-3 text-2xl font-semibold text-white/90">
            Doctor Enrollment
          </div>
          <div className="mt-2 text-sm leading-6 text-white/58">
            Record three voice samples to personalize diarization and improve
            clinical accuracy.
          </div>

          <form onSubmit={submit} className="mt-7 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs tracking-[0.18em] text-white/40">
                DOCTOR NAME
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. —"
                autoComplete="name"
              />
            </div>
            <div className="grid gap-2">
              <div className="text-xs tracking-[0.18em] text-white/40">AGE</div>
              <Input
                value={age}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setAge(v === "" ? "" : Number(v));
                }}
                placeholder="e.g. 38"
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-2">
              <div className="text-xs tracking-[0.18em] text-white/40">
                PASSWORD
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="mt-2 rounded-2xl border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] tracking-[0.22em] text-white/45">
                RECORDING SCRIPT (READ EXACTLY)
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">
                {ENROLL_SCRIPT}
              </pre>
            </div>

            {error ? (
              <div className="rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-sm text-white/75">
                {error}
              </div>
            ) : null}

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-white/45">
                Samples captured: <span className="text-white/80">{audioCount}/3</span>
              </div>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </GlassCard>

        <div className="grid gap-5">
          {[0, 1, 2].map((i) => (
            <GlassCard key={i} className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/85">
                  Audio Sample {i + 1}
                </div>
                <div className="text-[11px] tracking-[0.18em] text-white/40">
                  REQUIRED
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AudioRecorderCard
                  label={`Sample ${i + 1}`}
                  file={samples[i as SampleKey]}
                  onFile={(f) => setSample(i as SampleKey, f)}
                />
                <AudioUploadCard
                  label={`Upload Sample ${i + 1}`}
                  file={samples[i as SampleKey]}
                  onFile={(f) => setSample(i as SampleKey, f)}
                />
              </div>
            </GlassCard>
          ))}

          <div className="text-xs text-white/40 leading-6">
            You must provide <span className="text-white/70">exactly three</span> audio samples to continue.
          </div>
        </div>
      </div>
    </div>
  );
}

