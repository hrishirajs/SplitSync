import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isExpenseApproved } from "../lib/expense-approval";
import {
  advanceNextRunUntilFuture,
  getNextRecurrenceDate,
} from "../lib/recurrence";

const expenseSplitShape = v.array(
  v.object({
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    amount: v.number(),
    paid: v.boolean(),
  })
);

const buildExpenseDocument = (args, user, overrides = {}) => ({
  description: args.description,
  amount: args.amount,
  category: args.category || "Other",
  date: args.date,
  paidByUserId: args.paidByUserId,
  splitType: args.splitType,
  splits: args.splits,
  groupId: args.groupId,
  approvalStatus: overrides.approvalStatus ?? "approved",
  receiptName: args.receiptName,
  receiptType: args.receiptType,
  receiptDataUrl: args.receiptDataUrl,
  sourceTemplateId: args.sourceTemplateId,
  createdBy: user._id,
});

// Create a new expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: expenseSplitShape,
    groupId: v.optional(v.id("groups")),
    receiptName: v.optional(v.string()),
    receiptType: v.optional(v.string()),
    receiptDataUrl: v.optional(v.string()),
    sourceTemplateId: v.optional(v.id("expenseTemplates")),
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    // Verify that splits add up to the total amount (with small tolerance for floating point issues)
    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const tolerance = 0.01; // Allow for small rounding errors
    if (Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("Split amounts must add up to the total expense amount");
    }

    // If there's a group, verify the user is a member
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const isMember = group.members.some(
        (member) => member.userId === user._id
      );
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }

      // If the group requires approval, new group expenses start pending.
      const approvalStatus = group.approvalRequired ? "pending" : "approved";

      // Create the expense
      const expenseId = await ctx.db.insert(
        "expenses",
        buildExpenseDocument(args, user, { approvalStatus })
      );

      return expenseId;
    }

    // Create the expense
    const expenseId = await ctx.db.insert(
      "expenses",
      buildExpenseDocument(args, user)
    );

    return expenseId;
  },
});

export const saveExpenseTemplate = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: expenseSplitShape,
    groupId: v.optional(v.id("groups")),
    isFavorite: v.boolean(),
    isRecurring: v.boolean(),
    recurrenceFrequency: v.optional(v.string()),
    recurrenceInterval: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    return await ctx.db.insert("expenseTemplates", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
      isFavorite: args.isFavorite,
      isRecurring: args.isRecurring,
      recurrenceFrequency: args.isRecurring ? args.recurrenceFrequency : undefined,
      recurrenceInterval: args.isRecurring ? args.recurrenceInterval : undefined,
      nextRunAt: args.isRecurring ? args.nextRunAt : undefined,
      lastRunAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const getExpenseTemplates = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    const templates = await ctx.db
      .query("expenseTemplates")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .collect();

    return templates.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const deleteExpenseTemplate = mutation({
  args: { templateId: v.id("expenseTemplates") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    const template = await ctx.db.get(args.templateId);

    if (!template) throw new Error("Template not found");
    if (template.createdBy !== user._id) {
      throw new Error("You don't have permission to delete this template");
    }

    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

export const getDueRecurringExpenseTemplates = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const templates = await ctx.db
      .query("expenseTemplates")
      .withIndex("by_nextRunAt", (q) => q.lte("nextRunAt", now))
      .collect();

    return templates.filter(
      (template) => template.isRecurring && template.nextRunAt !== undefined
    );
  },
});

export const runRecurringExpenseTemplate = internalMutation({
  args: {
    templateId: v.id("expenseTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);

    if (!template) throw new Error("Template not found");
    if (!template.isRecurring) throw new Error("Template is not recurring");

    const occurrenceDate = template.nextRunAt ?? Date.now();
    let approvalStatus = "approved";

    if (template.groupId) {
      const group = await ctx.db.get(template.groupId);
      approvalStatus = group?.approvalRequired ? "pending" : "approved";
    }

    const expenseId = await ctx.db.insert("expenses", {
      description: template.description,
      amount: template.amount,
      category: template.category || "Other",
      date: occurrenceDate,
      paidByUserId: template.paidByUserId,
      splitType: template.splitType,
      splits: template.splits,
      groupId: template.groupId,
      approvalStatus,
      receiptName: undefined,
      receiptType: undefined,
      receiptDataUrl: undefined,
      sourceTemplateId: template._id,
      createdBy: template.createdBy,
    });

    const nextRunAt = advanceNextRunUntilFuture(
      getNextRecurrenceDate(
        occurrenceDate,
        template.recurrenceFrequency,
        template.recurrenceInterval
      ),
      template.recurrenceFrequency,
      template.recurrenceInterval
    );

    await ctx.db.patch(template._id, {
      nextRunAt: nextRunAt ?? undefined,
      lastRunAt: occurrenceDate,
      updatedAt: Date.now(),
    });

    return expenseId;
  },
});

// ----------- Expenses Page -----------

// Get expenses between current user and a specific person
export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (me._id === userId) throw new Error("Cannot query yourself");

    /* ───── 1. All expenses where BOTH are involved (1:1 + groups) ───── */
    const allExpenses = await ctx.db.query("expenses").collect();
    const expenses = allExpenses.filter((e) => {
      const meInvolved =
        e.paidByUserId === me._id || e.splits.some((s) => s.userId === me._id);
      const themInvolved =
        e.paidByUserId === userId || e.splits.some((s) => s.userId === userId);
      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    /* ───── 2. Settlements between the two of us (1:1 + groups) ─────── */
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), me._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), me._id)
            )
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    /* ───── 3. Compute running balance ──────────────────────────────── */
    let balance = 0;

    for (const e of expenses) {
      if (!isExpenseApproved(e)) continue;
      // Only calculate balance for direct debts between me and the other user
      // Ignore expenses where a third party paid
      if (e.paidByUserId === me._id) {
        // I paid, they owe me
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount;
      } else if (e.paidByUserId === userId) {
        // They paid, I owe them
        const split = e.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) balance -= split.amount;
      }
      // If a third party paid (neither me nor them), don't include in 1-on-1 balance
      // This will be handled in group balances instead
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id)
        balance += s.amount; // I paid them back
      else balance -= s.amount; // they paid me back
    }

    /* ───── 5. Return payload ───────────────────────────────────────── */
    const other = await ctx.db.get(userId);
    if (!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});

// Delete an expense
export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    // Get the expense
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    // Check if user is authorized to delete this expense
    // Only the creator of the expense or the payer can delete it
    if (expense.createdBy !== user._id && expense.paidByUserId !== user._id) {
      throw new Error("You don't have permission to delete this expense");
    }

    // Delete any settlements that specifically reference this expense
    // Since we can't use array.includes directly in the filter, we'll
    // fetch all settlements and then filter in memory
    const allSettlements = await ctx.db.query("settlements").collect();

    const relatedSettlements = allSettlements.filter(
      (settlement) =>
        settlement.relatedExpenseIds !== undefined &&
        settlement.relatedExpenseIds.includes(args.expenseId)
    );

    for (const settlement of relatedSettlements) {
      // Remove this expense ID from the relatedExpenseIds array
      const updatedRelatedExpenseIds = settlement.relatedExpenseIds.filter(
        (id) => id !== args.expenseId
      );

      if (updatedRelatedExpenseIds.length === 0) {
        // If this was the only related expense, delete the settlement
        await ctx.db.delete(settlement._id);
      } else {
        // Otherwise update the settlement to remove this expense ID
        await ctx.db.patch(settlement._id, {
          relatedExpenseIds: updatedRelatedExpenseIds,
        });
      }
    }

    // Delete the expense
    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});
