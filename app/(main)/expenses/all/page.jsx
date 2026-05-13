"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  PlusCircle, Search, Users, User, TrendingUp, TrendingDown, Filter,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { AppPageHero } from "@/components/app-page-hero";
import { getAllCategories } from "@/lib/expense-categories";

const categories = getAllCategories();
const getCategoryName = (id) =>
  categories.find((c) => c.id === id)?.name || id || "Other";

// ─── Summary cards ────────────────────────────────────────────────────────────
function SummaryCards({ totalSpent, monthlySpending, balances }) {
  const currentMonth = new Date().getMonth();
  const currentMonthSpend = monthlySpending?.[currentMonth]?.total ?? 0;
  const lastMonthSpend = monthlySpending?.[currentMonth - 1]?.total ?? 0;
  const trend =
    lastMonthSpend > 0
      ? ((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            This Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${(totalSpent ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">total spent</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${currentMonthSpend.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-green-500" />
            )}
            <p className={`text-xs ${trend > 0 ? "text-red-500" : "text-green-500"}`}>
              {Math.abs(trend).toFixed(0)}% vs last month
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            You Are Owed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            ${(balances?.youAreOwed ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            from {balances?.oweDetails?.youAreOwedBy?.length ?? 0} people
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            You Owe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-500">
            ${(balances?.youOwe ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            to {balances?.oweDetails?.youOwe?.length ?? 0} people
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Individual tab ───────────────────────────────────────────────────────────
// Receives pre-fetched expenses as props — NO hooks inside .map()
function IndividualTab({ expenses, currentUserId }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      expenses.filter((e) =>
        e.description?.toLowerCase().includes(search.toLowerCase())
      ),
    [expenses, search]
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search individual expenses..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No individual expenses yet</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/expenses/new">Add your first expense</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-2 divide-y divide-border/50">
            {filtered.map((expense) => {
              const iPaid = expense.paidByUserId === currentUserId;
              const myShare = expense.splits?.find((s) => s.userId === currentUserId);
              return (
                <Link
                  key={expense._id}
                  href={expense.otherUser?.id ? `/person/${expense.otherUser.id}` : "#"}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </span>
                        <Badge variant="secondary" className="text-xs py-0">
                          {getCategoryName(expense.category)}
                        </Badge>
                        {expense.otherUser && (
                          <span className="text-xs text-muted-foreground">
                            with {expense.otherUser.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-sm">${expense.amount.toFixed(2)}</p>
                    {myShare && (
                      <p className={`text-xs mt-0.5 ${iPaid ? "text-green-600" : "text-red-500"}`}>
                        {iPaid
                          ? `you lent $${(expense.amount - myShare.amount).toFixed(2)}`
                          : `your share $${myShare.amount.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Group tab ────────────────────────────────────────────────────────────────
// Receives pre-fetched expenses as props — NO hooks inside .map()
function GroupTab({ expenses, currentUserId }) {
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");

  const groups = useMemo(() => {
    const seen = new Set();
    return expenses
      .filter((e) => e.groupId && !seen.has(e.groupId) && seen.add(e.groupId))
      .map((e) => ({ id: e.groupId, name: e.groupName }));
  }, [expenses]);

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        const matchSearch = e.description
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const matchGroup =
          selectedGroupId === "all" || e.groupId === selectedGroupId;
        return matchSearch && matchGroup;
      }),
    [expenses, search, selectedGroupId]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search group expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No group expenses yet</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/expenses/new">Add a group expense</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-2 divide-y divide-border/50">
            {filtered.map((expense) => {
              const iPaid = expense.paidByUserId === currentUserId;
              const myShare = expense.splits?.find((s) => s.userId === currentUserId);
              return (
                <Link
                  key={expense._id}
                  href={`/groups/${expense.groupId}`}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </span>
                        <Badge variant="secondary" className="text-xs py-0">
                          {getCategoryName(expense.category)}
                        </Badge>
                        <Badge variant="outline" className="text-xs py-0">
                          {expense.groupName}
                        </Badge>
                        {expense.approvalStatus === "pending" && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0 text-amber-600 border-amber-300"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-sm">${expense.amount.toFixed(2)}</p>
                    {myShare && (
                      <p className={`text-xs mt-0.5 ${iPaid ? "text-green-600" : "text-red-500"}`}>
                        {iPaid
                          ? `you lent $${(expense.amount - myShare.amount).toFixed(2)}`
                          : `your share $${myShare.amount.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AllExpensesPage() {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { data: allExpenses, isLoading: expensesLoading } = useConvexQuery(
    api.expenses.getAllUserExpenses
  );
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );
  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );
  const { data: monthlySpending, isLoading: monthlyLoading } = useConvexQuery(
    api.dashboard.getMonthlySpending
  );

  const isLoading =
    expensesLoading || balancesLoading || totalSpentLoading || monthlyLoading || !currentUser;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="w-full py-12">
          <BarLoader width="100%" color="#36d7b7" />
        </div>
      ) : (
        <>
          <AppPageHero
            eyebrow="All activity"
            title="My Expenses"
            description="Every expense — individual and group — in one place."
            primaryAction={
              <Button asChild size="lg">
                <Link href="/expenses/new">
                  <PlusCircle className="h-4 w-4" />
                  Add expense
                </Link>
              </Button>
            }
            stats={[
              { value: `$${(totalSpent ?? 0).toFixed(2)}`, label: "spent this year" },
              { value: `$${(balances?.youAreOwed ?? 0).toFixed(2)}`, label: "owed to you" },
              { value: `$${(balances?.youOwe ?? 0).toFixed(2)}`, label: "you owe" },
            ]}
          />

          <SummaryCards
            totalSpent={totalSpent}
            monthlySpending={monthlySpending}
            balances={balances}
          />

          <Tabs defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Individual ({allExpenses?.individual?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="group" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group ({allExpenses?.group?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-6">
              <IndividualTab
                expenses={allExpenses?.individual ?? []}
                currentUserId={currentUser._id}
              />
            </TabsContent>

            <TabsContent value="group" className="mt-6">
              <GroupTab
                expenses={allExpenses?.group ?? []}
                currentUserId={currentUser._id}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}