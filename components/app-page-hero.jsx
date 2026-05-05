import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export function AppPageHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  backHref,
  backLabel = "Back",
  stats = [],
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "premium-surface panel-glow relative overflow-hidden p-5 sm:p-7",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(124,207,170,0.2),transparent_34%)]" />
      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {backHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            ) : null}
            {eyebrow ? (
              <Badge variant="outline" className="border-border/70 bg-background/70 text-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl font-display text-4xl tracking-[-0.07em] text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-3">
              {primaryAction}
              {secondaryAction}
            </div>
          )}

          {stats.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-[0_16px_36px_-30px_rgba(11,17,22,0.4)] backdrop-blur-md"
                >
                  <div className="text-2xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

export function HeroActionLink({ href, children, variant = "default" }) {
  return (
    <Button asChild variant={variant} size="lg">
      <Link href={href}>
        {children}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
