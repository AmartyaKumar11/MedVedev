import { GlassCard } from "@/components/GlassCard";
import { Suspense } from "react";

import { DashboardClient } from "@/app/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <GlassCard className="p-7">
            <div className="text-sm font-medium text-foreground">Loading...</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Preparing dashboard.
            </div>
          </GlassCard>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}

