"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import SettlementForm from "./components/settlement-form";
import { AppPageHero } from "@/components/app-page-hero";

export default function SettlementPage() {
  const params = useParams();
  const router = useRouter();
  const { type, id } = params;

  const { data, isLoading } = useConvexQuery(
    api.settlements.getSettlementData,
    {
      entityType: type,
      entityId: id,
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  // Function to handle after successful settlement creation
  const handleSuccess = () => {
    // Redirect based on type
    if (type === "user") {
      router.push(`/person/${id}`);
    } else if (type === "group") {
      router.push(`/groups/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <AppPageHero
        eyebrow="Settlement"
        title="Record a settlement"
        description={
          type === "user"
            ? `Settling up with ${data?.counterpart?.name}`
            : `Settling up in ${data?.group?.name}`
        }
        backHref={type === "user" ? `/person/${id}` : `/groups/${id}`}
        stats={[
          {
            value: type === "user" ? "1:1" : "Group",
            label: "context",
          },
          { value: "Live", label: "balance sync" },
        ]}
      >
        <div className="premium-surface panel-glow flex items-center gap-4 p-5">
          {type === "user" ? (
            <Avatar className="h-16 w-16">
              <AvatarImage src={data?.counterpart?.imageUrl} />
              <AvatarFallback>{data?.counterpart?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-3xl border border-border/70 bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Settle target</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {type === "user" ? data?.counterpart?.name : data?.group?.name}
            </div>
            <p className="text-sm text-muted-foreground">Keep the record clean and consistent with the rest of the ledger.</p>
          </div>
        </div>
      </AppPageHero>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {type === "user" ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={data?.counterpart?.imageUrl} />
                <AvatarFallback>
                  {data?.counterpart?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
            <CardTitle>
              {type === "user" ? data?.counterpart?.name : data?.group?.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
