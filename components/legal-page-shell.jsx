import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function LegalPageShell({
  title,
  subtitle,
  effectiveDate,
  sections,
  contactEmail = "hello@splitsync.app",
}) {
  return (
    <div className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="premium-surface panel-glow p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-border/70 bg-background/70 text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Legal
            </Badge>
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Effective {effectiveDate}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <h1 className="font-display text-4xl tracking-[-0.06em] text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.title} className="bg-background/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl text-foreground">
                  {section.title}
                </CardTitle>
                {section.description && (
                  <CardDescription className="text-muted-foreground">
                    {section.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="premium-surface panel-glow p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Need help?
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                Questions about privacy or usage are welcome.
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Email us at{" "}
                <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
                .
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/dashboard">
                  Open app <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
