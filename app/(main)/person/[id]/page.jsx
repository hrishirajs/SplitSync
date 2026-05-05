"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { AppPageHero } from "@/components/app-page-hero";

export default function PersonExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="space-y-6">
      <AppPageHero
        eyebrow="Person view"
        title={otherUser?.name}
        description={otherUser?.email}
        backHref="/contacts"
        primaryAction={
          <Button asChild size="lg">
            <Link href={`/settlements/user/${params.id}`}>
              <ArrowLeftRight className="h-4 w-4" />
              Settle up
            </Link>
          </Button>
        }
        secondaryAction={
          <Button asChild size="lg" variant="outline">
            <Link href="/expenses/new">
              <PlusCircle className="h-4 w-4" />
              Add expense
            </Link>
          </Button>
        }
        stats={[
          { value: `$${Math.abs(balance).toFixed(2)}`, label: balance >= 0 ? "owed to you" : "you owe" },
          { value: `${expenses.length}`, label: "expenses" },
          { value: `${settlements.length}`, label: "settlements" },
        ]}
      >
        <div className="premium-surface panel-glow flex items-center gap-4 p-5">
          <Avatar className="h-16 w-16">
            <AvatarImage src={otherUser?.imageUrl} />
            <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Counterpart</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{otherUser?.name}</div>
            <p className="text-sm text-muted-foreground">{otherUser?.email}</p>
          </div>
        </div>
      </AppPageHero>

      {/* Balance card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes
                  you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
            >
              ${Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for expenses and settlements */}
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
