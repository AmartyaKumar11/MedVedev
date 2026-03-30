import { GlassCard } from "@/components/GlassCard";
import type { SoapNote } from "@/lib/api";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
      <div className="text-[11px] tracking-[0.22em] text-white/45">
        {title.toUpperCase()}
      </div>
      <div className="mt-2 text-sm leading-6 text-white/80 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

export function SOAPViewer({ soap }: { soap: SoapNote | null }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white/85">SOAP Note</div>
        <div className="text-[11px] tracking-[0.18em] text-white/40">
          GENERATED
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {!soap ? (
          <div className="text-sm text-white/40">
            No SOAP note yet.
          </div>
        ) : (
          <>
            <Section title="Subjective" text={soap.subjective} />
            <Section title="Objective" text={soap.objective} />
            <Section title="Assessment" text={soap.assessment} />
            <Section title="Plan" text={soap.plan} />
          </>
        )}
      </div>
    </GlassCard>
  );
}

