import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isExpenseApproved } from "../lib/expense-approval";

export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) return { selectedGroup: null, groups: [] };

    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === currentUser._id)
    );

    if (args.groupId) {
      const selectedGroup = userGroups.find((group) => group._id === args.groupId);
      if (!selectedGroup) throw new Error("Group not found or you're not a member");

      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          };
        })
      );

      const validMembers = memberDetails.filter((member) => member !== null);

      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          approvalRequired: selectedGroup.approvalRequired ?? false,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    } else {
      return {
        selectedGroup: null,
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    }
  },
});

export const getGroupExpenses = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) return { deleted: false, group: null, members: [], expenses: [], pendingExpenses: [], settlements: [], balances: [], userLookupMap: {}, groupSpent: 0 };

    const group = await ctx.db.get(groupId);
    if (!group) return { deleted: true };

    if (!group.members.some((m) => m.userId === currentUser._id))
      throw new Error("You are not a member of this group");

    const expenses = (await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect()).sort((a, b) => b.date - a.date);

    const approvedExpenses = expenses.filter((expense) => isExpenseApproved(expense));
    const pendingExpenses = expenses.filter((expense) => !isExpenseApproved(expense));
    const groupSpent = approvedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();

    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return { id: u._id, name: u.name, imageUrl: u.imageUrl, role: m.role };
      })
    );
    const ids = memberDetails.map((m) => m.id);

    const totals = Object.fromEntries(ids.map((id) => [id, 0]));
    const ledger = {};
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => { if (a !== b) ledger[a][b] = 0; });
    });

    for (const exp of approvedExpenses) {
      const payer = exp.paidByUserId;
      for (const split of exp.splits) {
        if (split.userId === payer || split.paid) continue;
        const debtor = split.userId;
        const amt = split.amount;
        totals[payer] += amt;
        totals[debtor] -= amt;
        ledger[debtor][payer] += amt;
      }
    }

    for (const s of settlements) {
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a >= b) return;
        const aOwesB = ledger[a][b];
        const bOwesA = ledger[b][a];
        if (aOwesB > 0 && bOwesA > 0) {
          const diff = aOwesB - bOwesA;
          if (diff > 0) { ledger[a][b] = diff; ledger[b][a] = 0; }
          else if (diff < 0) { ledger[b][a] = -diff; ledger[a][b] = 0; }
          else { ledger[a][b] = ledger[b][a] = 0; }
        }
      });
    });

    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id],
      owes: Object.entries(ledger[m.id]).filter(([, v]) => v > 0).map(([to, amount]) => ({ to, amount })),
      owedBy: ids.filter((other) => ledger[other][m.id] > 0).map((other) => ({ from: other, amount: ledger[other][m.id] })),
    }));

    const userLookupMap = {};
    memberDetails.forEach((member) => { userLookupMap[member.id] = member; });

    return {
      deleted: false,
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        budgetGoal: group.budgetGoal ?? null,
        approvalRequired: group.approvalRequired ?? false,
        createdBy: group.createdBy,
      },
      members: memberDetails,
      expenses,
      pendingExpenses,
      settlements,
      balances,
      userLookupMap,
      groupSpent,
    };
  },
});

export const updateGroupApprovalMode = mutation({
  args: { groupId: v.id("groups"), approvalRequired: v.boolean() },
  handler: async (ctx, { groupId, approvalRequired }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const myMembership = group.members.find((m) => m.userId === currentUser._id);
    const canEdit = group.createdBy === currentUser._id || myMembership?.role === "admin";
    if (!canEdit) throw new Error("You don't have permission to update this group");

    await ctx.db.patch(groupId, { approvalRequired });
    return { success: true };
  },
});

export const approveExpense = mutation({
  args: { groupId: v.id("groups"), expenseId: v.id("expenses") },
  handler: async (ctx, { groupId, expenseId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const myMembership = group.members.find((m) => m.userId === currentUser._id);
    const canEdit = group.createdBy === currentUser._id || myMembership?.role === "admin";
    if (!canEdit) throw new Error("You don't have permission to approve expenses");

    const expense = await ctx.db.get(expenseId);
    if (!expense) throw new Error("Expense not found");
    if (expense.groupId !== groupId) throw new Error("Expense does not belong to this group");
    if (expense.approvalStatus !== "pending") throw new Error("Expense is not pending approval");

    await ctx.db.patch(expenseId, { approvalStatus: "approved" });
    return { success: true };
  },
});

export const rejectExpense = mutation({
  args: { groupId: v.id("groups"), expenseId: v.id("expenses") },
  handler: async (ctx, { groupId, expenseId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const myMembership = group.members.find((m) => m.userId === currentUser._id);
    const canEdit = group.createdBy === currentUser._id || myMembership?.role === "admin";
    if (!canEdit) throw new Error("You don't have permission to reject expenses");

    const expense = await ctx.db.get(expenseId);
    if (!expense) throw new Error("Expense not found");
    if (expense.groupId !== groupId) throw new Error("Expense does not belong to this group");
    if (expense.approvalStatus !== "pending") throw new Error("Expense is not pending approval");

    await ctx.db.delete(expenseId);
    return { success: true };
  },
});

export const updateGroupBudgetGoal = mutation({
  args: { groupId: v.id("groups"), budgetGoal: v.number() },
  handler: async (ctx, { groupId, budgetGoal }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const myMembership = group.members.find((m) => m.userId === currentUser._id);
    const canEdit = group.createdBy === currentUser._id || myMembership?.role === "admin";
    if (!canEdit) throw new Error("You don't have permission to update this group");

    if (!Number.isFinite(budgetGoal) || budgetGoal <= 0)
      throw new Error("Budget goal must be a positive number");

    await ctx.db.patch(groupId, { budgetGoal });
    return { success: true };
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const myMembership = group.members.find((m) => m.userId === currentUser._id);
    const canDelete = group.createdBy === currentUser._id || myMembership?.role === "admin";
    if (!canDelete) throw new Error("You don't have permission to delete this group");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const exp of expenses) await ctx.db.delete(exp._id);

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const st of settlements) await ctx.db.delete(st._id);

    await ctx.db.delete(groupId);
    return { success: true };
  },
});