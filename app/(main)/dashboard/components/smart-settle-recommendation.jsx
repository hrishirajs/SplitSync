"use client";

import Link from "next/link";
import { ArrowRightLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSmartSettleRecommendation } from "@/lib/smart-settle";

export function SmartSettleRecommendation({ balances }) {
  const recommendation = getSmartSettleRecommendation(balances);

  if (!recommendation) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart settle recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You&apos;re already in a good spot. No strong settlement priority
            right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Smart settle recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            {recommendation.direction === "owe"
              ? `Pay ${recommendation.name}`
              : `Request from ${recommendation.name}`}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {recommendation.description}
          </p>
          <p className="mt-3 text-xl font-bold">
            ${recommendation.amount.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full">
            <Link href={`/settlements/user/${recommendation.userId}`}>
              {recommendation.actionLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
