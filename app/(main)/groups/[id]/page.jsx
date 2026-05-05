"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, Trash2, Users } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { GroupBalances } from "@/components/group-balances";
import { GroupMembers } from "@/components/group-members";
import { toast } from "sonner";
import { GroupBudgetGoal } from "./components/group-budget-goal";
import { PendingExpenseApprovals } from "./components/pending-expense-approvals";
import { AppPageHero } from "@/components/app-page-hero";

export default function GroupExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupExpenses,
    isDeleting ? "skip" : { groupId: params.id }
  );
  const deleteGroup = useConvexMutation(api.groups.deleteGroup);
  const updateGroupBudgetGoal = useConvexMutation(
    api.groups.updateGroupBudgetGoal
  );
  const updateGroupApprovalMode = useConvexMutation(
    api.groups.updateGroupApprovalMode
  );
  const approveExpense = useConvexMutation(api.groups.approveExpense);
  const rejectExpense = useConvexMutation(api.groups.rejectExpense);

  const isDeleted = data?.deleted === true;

  useEffect(() => {
    if (isDeleted) router.push("/contacts");
  }, [isDeleted, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const group = data?.group;
  const members = data?.members || [];
  const expenses = data?.expenses || [];
  const pendingExpenses = data?.pendingExpenses || [];
  const settlements = data?.settlements || [];
  const balances = data?.balances || [];
  const userLookupMap = data?.userLookupMap || {};
  const groupSpent = data?.groupSpent || 0;
  const currentUserMembership = members.find(
    (member) => member.id === currentUser?._id
  );
  const canEditBudget =
    data?.group?.createdBy === currentUser?._id ||
    currentUserMembership?.role === "admin";
  const canManageApprovals = canEditBudget;

  const handleDeleteGroup = async () => {
    if (!group?.id) return;
    const ok = window.confirm(
      `Delete "${group.name}"?\n\nThis will permanently delete the group, its expenses, and its settlements.`
    );
    if (!ok) return;

    try {
      setIsDeleting(true);
      await deleteGroup.mutate({ groupId: group.id });
      toast.success("Group deleted");
      router.push("/contacts");
    } catch (e) {
      // errors are already toasted by useConvexMutation
      setIsDeleting(false);
    }
  };

  const handleSaveBudgetGoal = async (budgetGoal) => {
    if (!group?.id) return;
    await updateGroupBudgetGoal.mutate({ groupId: group.id, budgetGoal });
    toast.success("Budget goal updated");
  };

  const handleToggleApprovalMode = async () => {
    if (!group?.id) return;
    await updateGroupApprovalMode.mutate({
      groupId: group.id,
      approvalRequired: !group.approvalRequired,
    });
    toast.success(
      !group.approvalRequired
        ? "Approval mode enabled"
        : "Approval mode disabled"
    );
  };

  const handleApproveExpense = async (expense) => {
    if (!group?.id) return;
    await approveExpense.mutate({ groupId: group.id, expenseId: expense._id });
    toast.success("Expense approved");
  };

  const handleRejectExpense = async (expense) => {
    if (!group?.id) return;
    await rejectExpense.mutate({ groupId: group.id, expenseId: expense._id });
    toast.success("Expense rejected");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AppPageHero
        eyebrow="Group view"
        title={group?.name}
        description={group?.description}
        backHref="/contacts"
        primaryAction={
          <Button asChild size="lg">
            <Link href={`/expenses/new`}>
              <PlusCircle className="h-4 w-4" />
              Add expense
            </Link>
          </Button>
        }
        secondaryAction={
          <Button asChild size="lg" variant="outline">
            <Link href={`/settlements/group/${params.id}`}>
              <ArrowLeftRight className="h-4 w-4" />
              Settle up
            </Link>
          </Button>
        }
        stats={[
          { value: `${members.length}`, label: "members" },
          { value: `${expenses.length}`, label: "expenses" },
          { value: `${settlements.length}`, label: "settlements" },
          { value: `$${groupSpent.toFixed(2)}`, label: "spent" },
        ]}
      >
        <div className="premium-surface panel-glow space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl border border-border/70 bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Group status</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {group?.approvalRequired ? "Approval required" : "Auto-approved"}
              </div>
              <p className="text-sm text-muted-foreground">
                {group?.budgetGoal ? `Budget goal: $${group.budgetGoal.toFixed(2)}` : "No budget goal set yet"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isLoading}
              title="Delete group"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              {deleteGroup.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </AppPageHero>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Group Budget Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupBudgetGoal
            budgetGoal={group?.budgetGoal ?? null}
            spentAmount={groupSpent}
            canEdit={Boolean(canEditBudget)}
            onSave={handleSaveBudgetGoal}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">Expense Approval Mode</CardTitle>
            {canEditBudget && (
              <Button
                variant={group?.approvalRequired ? "destructive" : "outline"}
                onClick={handleToggleApprovalMode}
                disabled={updateGroupApprovalMode.isLoading}
              >
                {group?.approvalRequired ? "Disable" : "Enable"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {group?.approvalRequired
              ? "New group expenses stay pending until an admin or the creator approves them."
              : "Group expenses are approved immediately. Turn this on to review expenses before they affect balances."}
          </p>
        </CardContent>
      </Card>

      <PendingExpenseApprovals
        pendingExpenses={pendingExpenses}
        userLookupMap={userLookupMap}
        canManage={canManageApprovals}
        onApprove={handleApproveExpense}
        onReject={handleRejectExpense}
      />

      {/* Grid layout for group details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Group Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members} />
            </CardContent>
          </Card>
        </div>
      </div>

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
            showOtherPerson={true}
            isGroupExpense={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            isGroupSettlement={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
