"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard?tab=patients", label: "Patients" },
  { href: "/dashboard?tab=sessions", label: "Sessions" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);

  return (
    <GlassCard className="h-full p-4 flex flex-col">
      <div className="px-2 py-2">
        <div className="text-[11px] tracking-[0.24em] text-white/40">
          MEDVEDEV V2
        </div>
        <div className="mt-1 text-sm text-white/80">
          Clinical Conversation Intelligence
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white/90 border border-white/12"
                  : "text-white/60 hover:text-white/85 hover:bg-white/6 border border-transparent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => {
            logout();
            router.push("/signin");
          }}
        >
          Logout
        </Button>
      </div>
    </GlassCard>
  );
}

