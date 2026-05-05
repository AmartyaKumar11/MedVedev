import { Suspense } from "react";

import { GlassCard } from "@/components/GlassCard";
import { ConsultationClient } from "@/app/consultation/ConsultationClient";

export default function ConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <GlassCard className="p-7">
            <div className="text-sm font-medium text-foreground">Loading...</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Preparing consultation UI.
            </div>
          </GlassCard>
        </div>
      }
    >
      <ConsultationClient />
    </Suspense>
  );
}

