import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { isExpenseApproved } from "../lib/expense-approval";

const isRelevantApprovedExpense = (expense, userId) =>
  isExpenseApproved(expense) &&
  (expense.paidByUserId === userId ||
    expense.splits.some((s) => s.userId === userId));

export const getUserBalances = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return { youOwe: 0, youAreOwed: 0, totalBalance: 0, oweDetails: { youOwe: [], youAreOwedBy: [] } };

    const expenses = (await ctx.db.query("expenses").collect()).filter((e) =>
      isRelevantApprovedExpense(e, user._id)
    );

    const balanceByUser = {};

    for (const e of expenses) {
      const isPayer = e.paidByUserId === user._id;
      const mySplit = e.splits.find((s) => s.userId === user._id);

      if (isPayer) {
        for (const s of e.splits) {
          if (s.userId === user._id || s.paid) continue;
          (balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        (balanceByUser[e.paidByUserId] ??= { owed: 0, owing: 0 }).owing += mySplit.amount;
      }
    }

    const settlements = (await ctx.db.query("settlements").collect()).filter(
      (s) => s.paidByUserId === user._id || s.receivedByUserId === user._id
    );

    for (const s of settlements) {
      if (s.paidByUserId === user._id) {
        (balanceByUser[s.receivedByUserId] ??= { owed: 0, owing: 0 }).owing -= s.amount;
      } else {
        (balanceByUser[s.paidByUserId] ??= { owed: 0, owing: 0 }).owed -= s.amount;
      }
    }

    const youOweList = [];
    const youAreOwedByList = [];
    let youOwe = 0;
    let youAreOwed = 0;

    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing;
      if (net === 0) continue;
      const counterpart = await ctx.db.get(uid);
      const base = {
        userId: uid,
        name: counterpart?.name ?? "Unknown",
        imageUrl: counterpart?.imageUrl,
        amount: Math.abs(net),
      };
      if (net > 0) { youAreOwedByList.push(base); youAreOwed += net; }
      else { youOweList.push(base); youOwe += -net; }
    }

    youOweList.sort((a, b) => b.amount - a.amount);
    youAreOwedByList.sort((a, b) => b.amount - a.amount);

    return {
      youOwe,
      youAreOwed,
      totalBalance: youAreOwed - youOwe,
      oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
    };
  },
});

export const getTotalSpent = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return 0;

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect();

    const userExpenses = expenses.filter((expense) =>
      isRelevantApprovedExpense(expense, user._id)
    );

    let totalSpent = 0;
    userExpenses.forEach((expense) => {
      const userSplit = expense.splits.find((split) => split.userId === user._id);
      if (userSplit) totalSpent += userSplit.amount;
    });

    return totalSpent;
  },
});

export const getMonthlySpending = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect();

    const userExpenses = allExpenses.filter((expense) =>
      isRelevantApprovedExpense(expense, user._id)
    );

    const monthlyTotals = {};
    for (let i = 0; i < 12; i++) {
      monthlyTotals[new Date(currentYear, i, 1).getTime()] = 0;
    }

    userExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const userSplit = expense.splits.find((split) => split.userId === user._id);
      if (userSplit) monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + userSplit.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month: parseInt(month), total }))
      .sort((a, b) => a.month - b.month);
  },
});

export const getUserGroups = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    const allGroups = await ctx.db.query("groups").collect();
    const groups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === user._id)
    );

    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const expenses = (await ctx.db
          .query("expenses")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()).filter((expense) => isExpenseApproved(expense));

        let balance = 0, youOwe = 0, youAreOwed = 0;

        expenses.forEach((expense) => {
          if (expense.paidByUserId === user._id) {
            expense.splits.forEach((split) => {
              if (split.userId !== user._id && !split.paid) {
                balance += split.amount;
                youAreOwed += split.amount;
              }
            });
          } else {
            const userSplit = expense.splits.find((split) => split.userId === user._id);
            if (userSplit && !userSplit.paid) {
              balance -= userSplit.amount;
              youOwe += userSplit.amount;
            }
          }
        });

        const settlements = await ctx.db
          .query("settlements")
          .filter((q) =>
            q.and(
              q.eq(q.field("groupId"), group._id),
              q.or(
                q.eq(q.field("paidByUserId"), user._id),
                q.eq(q.field("receivedByUserId"), user._id)
              )
            )
          )
          .collect();

        settlements.forEach((settlement) => {
          if (settlement.paidByUserId === user._id) {
            balance += settlement.amount;
            youOwe = Math.max(0, youOwe - settlement.amount);
          } else {
            balance -= settlement.amount;
            youAreOwed = Math.max(0, youAreOwed - settlement.amount);
          }
        });

        return { ...group, id: group._id, balance, youOwe, youAreOwed };
      })
    );

    return enhancedGroups;
  },
});