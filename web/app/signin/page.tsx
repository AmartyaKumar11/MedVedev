"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function SignInPage() {
  const router = useRouter();
  const setDoctor = useAppStore((s) => s.setDoctor);

  const [doctorId, setDoctorId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { access_token } = await login({
        name: doctorId.trim(),
        password,
      });
      window.localStorage.setItem("token", access_token);
      setDoctor({ id: "authenticated", name: doctorId.trim(), age: 0 });
      router.push("/dashboard");
    } catch (e) {
      const failedFetch =
        e instanceof TypeError &&
        (String(e.message).includes("fetch") || String(e.message).includes("Load failed"));
      setError(
        failedFetch
          ? "Cannot reach the API. Start the backend on http://127.0.0.1:8000 and refresh. Ignore unrelated sw.js errors from browser extensions or old site data."
          : "Sign in failed. Use the same doctor name and password you used at enrollment.",
      );
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
        <Link href="/signup">
          <Button variant="ghost">Create account</Button>
        </Link>
      </div>

      <div className="mt-10 grid place-items-center">
        <GlassCard className="w-full max-w-md p-7">
          <div className="text-[11px] tracking-[0.22em] text-white/40">
            SIGN IN
          </div>
          <div className="mt-3 text-2xl font-semibold text-white/90">
            Doctor Console
          </div>
          <div className="mt-2 text-sm leading-6 text-white/58">
            Use your Doctor ID to access dashboard and sessions.
          </div>

          <form onSubmit={submit} className="mt-7 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs tracking-[0.18em] text-white/40">
                DOCTOR NAME
              </div>
              <Input
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="Same name as enrollment"
                autoComplete="username"
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
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-sm text-white/75">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting || doctorId.trim() === ""}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>

            <div className="pt-2 text-xs text-white/40">
              New to MEDVEDEV V2?{" "}
              <Link href="/signup" className="text-white/70 hover:text-white/85">
                Create an account
              </Link>
              .
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

