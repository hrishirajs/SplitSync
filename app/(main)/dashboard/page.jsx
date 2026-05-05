"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";
import { SmartSettleRecommendation } from "./components/smart-settle-recommendation";
import { AppPageHero } from "@/components/app-page-hero";

export default function Dashboard() {
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );

  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );

  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.dashboard.getMonthlySpending);

  const isLoading =
    balancesLoading ||
    groupsLoading ||
    totalSpentLoading ||
    monthlySpendingLoading;

  // `getUserBalances` already nets across 1:1 + group expenses/settlements.
  const totalYouOwe = balances?.youOwe || 0;
  const totalYouAreOwed = balances?.youAreOwed || 0;
  const totalBalance = balances?.totalBalance || 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="w-full py-12 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      ) : (
        <>
          <AppPageHero
            eyebrow="Command center"
            title="Dashboard"
            description="A calm, premium overview of balances, spending, and group activity."
            primaryAction={
              <Button asChild size="lg">
                <Link href="/expenses/new">
                  <PlusCircle className="h-4 w-4" />
                  Add expense
                </Link>
              </Button>
            }
            secondaryAction={
              <Button asChild size="lg" variant="outline">
                <Link href="/contacts">
                  <Users className="h-4 w-4" />
                  Create group
                </Link>
              </Button>
            }
            stats={[
              { value: `$${Math.abs(totalBalance).toFixed(2)}`, label: totalBalance >= 0 ? "net credit" : "net debit" },
              { value: `$${totalYouAreOwed.toFixed(2)}`, label: "you are owed" },
              { value: `$${totalYouOwe.toFixed(2)}`, label: "you owe" },
              { value: `${groups?.length || 0}`, label: "active groups" },
            ]}
          >
            <div className="premium-surface panel-glow space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Monthly spend</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    ${totalSpent?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Smart settle, approvals, and budgeting stay visible from a single view.
              </p>
            </div>
          </AppPageHero>

          {/* Balance overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalBalance > 0 ? (
                    <span className="text-green-600">
                      +${totalBalance.toFixed(2)}
                    </span>
                  ) : totalBalance < 0 ? (
                    <span className="text-red-600">
                      -${Math.abs(totalBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span>$0.00</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBalance > 0
                    ? "You are owed money"
                    : totalBalance < 0
                      ? "You owe money"
                      : "All settled up!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You are owed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalYouAreOwed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {balances?.oweDetails?.youAreOwedBy?.length || 0} people
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You owe
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balances?.oweDetails?.youOwe?.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      ${totalYouOwe.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      To {balances?.oweDetails?.youOwe?.length || 0} people
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${totalYouOwe.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You don't owe anyone
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Expense summary */}
              <ExpenseSummary
                monthlySpending={monthlySpending}
                totalSpent={totalSpent}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <SmartSettleRecommendation balances={balances} />

              {/* Balance details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Details</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} groups={groups} />
                </CardContent>
              </Card>

              {/* Groups */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Groups</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GroupList groups={groups} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/contacts?createGroup=true">
                      <Users className="mr-2 h-4 w-4" />
                      Create new group
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
