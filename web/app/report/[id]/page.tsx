"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Sidebar } from "@/components/Sidebar";
import { SOAPViewer } from "@/components/SOAPViewer";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { getPDF, getSOAP } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function ReportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const doctor = useAppStore((s) => s.doctor);
  const patients = useAppStore((s) => s.patients);
  const activePatientId = useAppStore((s) => s.activePatientId);
  const soap = useAppStore((s) => s.soap);
  const setSoap = useAppStore((s) => s.setSoap);

  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!doctor) router.push("/signin");
  }, [doctor, router]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (soap) return;
      const { soap: fetchedSoap } = await getSOAP({ recordingId: reportId });
      if (!cancelled) setSoap(fetchedSoap);
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, setSoap, soap]);

  const patient =
    (activePatientId ? patients.find((p) => p.id === activePatientId) : null) ??
    null;

  async function download() {
    setDownloading(true);
    try {
      const { url } = await getPDF({ reportId });
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
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
            title="Report"
            right={
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button onClick={() => void download()} disabled={downloading}>
                  {downloading ? "Preparing..." : "Download PDF"}
                </Button>
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
                  REPORT ID
                </div>
                <div className="mt-2 text-sm text-white/80">{reportId}</div>
              </div>
            </div>
          </GlassCard>

          <SOAPViewer soap={soap} />
        </div>
      </div>
    </div>
  );
}

