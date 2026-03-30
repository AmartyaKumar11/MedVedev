import Link from "next/link";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.26em] text-white/40">
            MEDVEDEV V2
          </div>
          <div className="flex items-center gap-2">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-white/40">
              CLINICAL CONVERSATION INTELLIGENCE
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white/92 sm:text-5xl">
              MEDVEDEV V2
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
              Speaker-aware transcription and clinical summarization, designed
              for calm, clean workflows—ready for backend integration when you
              are.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                "Speaker Diarization",
                "Multilingual Transcription",
                "SOAP Note Generation",
                "PDF Reports",
              ].map((f) => (
                <div
                  key={f}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs text-white/70 backdrop-blur-xl"
                >
                  {f}
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="p-7">
            <div className="text-[11px] tracking-[0.22em] text-white/40">
              FEATURES
            </div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  title: "Speaker Diarization",
                  desc: "Doctor / patient labeling for clinical clarity.",
                },
                {
                  title: "Multilingual Transcription",
                  desc: "Handles mixed-language symptom descriptions.",
                },
                {
                  title: "SOAP Note Generation",
                  desc: "Structured notes: subjective → plan.",
                },
                {
                  title: "PDF Reports",
                  desc: "Clean exports for documentation and sharing.",
                },
              ].map((x) => (
                <div
                  key={x.title}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4"
                >
                  <div className="text-sm font-medium text-white/85">
                    {x.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-white/50">
                    {x.desc}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-16 border-t border-white/8 pt-8">
          <div className="flex flex-col justify-between gap-3 text-xs text-white/40 sm:flex-row">
            <div>© {new Date().getFullYear()} MEDVEDEV V2</div>
            <div>Pure dark UI · Glass panels · Mock data only</div>
          </div>
        </div>
      </div>
    </div>
  );
}
