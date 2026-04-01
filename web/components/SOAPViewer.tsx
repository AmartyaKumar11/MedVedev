import { GlassCard } from "@/components/GlassCard";
import type { SoapNote } from "@/lib/api";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="text-[11px] tracking-[0.22em] text-muted-foreground">
        {title.toUpperCase()}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {text}
      </div>
    </div>
  );
}

function toDisplayText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter((s) => s.trim().length > 0)
      .join("\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string") return obj.text;
    if ("subsections" in obj && Array.isArray(obj.subsections)) {
      return obj.subsections
        .map((item) => toDisplayText(item))
        .filter((s) => s.trim().length > 0)
        .join("\n");
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function SOAPViewer({ soap }: { soap: SoapNote | null }) {
  const subjective = toDisplayText((soap as any)?.subjective);
  const objective = toDisplayText((soap as any)?.objective);
  const assessment = toDisplayText((soap as any)?.assessment);
  const plan = toDisplayText((soap as any)?.plan);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">SOAP Note</div>
        <div className="text-[11px] tracking-[0.18em] text-muted-foreground">
          GENERATED
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {!soap ? (
          <div className="text-sm text-muted-foreground">
            No SOAP note yet.
          </div>
        ) : (
          <>
            <Section title="Subjective" text={subjective} />
            <Section title="Objective" text={objective} />
            <Section title="Assessment" text={assessment} />
            <Section title="Plan" text={plan} />
          </>
        )}
      </div>
    </GlassCard>
  );
}

