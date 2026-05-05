import { GlassCard } from "@/components/GlassCard";
import type { Patient } from "@/lib/api";

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <GlassCard className="p-4 hover:bg-muted/70 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">
            {patient.name}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Last visit{" "}
            {patient.lastVisitISO
              ? new Date(patient.lastVisitISO).toLocaleDateString()
              : "—"}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{patient.age}y</div>
      </div>
    </GlassCard>
  );
}

