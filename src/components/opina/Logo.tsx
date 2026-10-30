import { cn } from "@/lib/utils";

export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-primary-foreground" strokeWidth={2}>
          <path d="M4 5h16v10H9l-5 4z" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1" className="fill-primary-foreground" />
          <circle cx="12.5" cy="10" r="1" className="fill-primary-foreground" />
          <circle cx="16" cy="10" r="1" className="fill-primary-foreground" />
        </svg>
      </div>
      <span className={cn("font-display text-lg font-semibold", inverted ? "text-sidebar-accent-foreground" : "text-foreground")}>
        Opina<span className="text-brand-violet">IA</span>
      </span>
    </div>
  );
}
