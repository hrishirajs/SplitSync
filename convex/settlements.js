import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isExpenseApproved } from "../lib/expense-approval";

export const createSettlement = mutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.users.getCurrentUser);
    if (!caller) throw new Error("Not authenticated");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId)
      throw new Error("Payer and receiver cannot be the same user");
    if (caller._id !== args.paidByUserId && caller._id !== args.receivedByUserId)
      throw new Error("You must be either the payer or the receiver");

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");
      const isMember = (uid) => group.members.some((m) => m.userId === uid);
      if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId))
        throw new Error("Both parties must be members of the group");
    }

    return await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseIds: args.relatedExpenseIds,
      createdBy: caller._id,
    });
  },
});

export const getSettlementData = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) return null;

    if (args.entityType === "user") {
      const other = await ctx.db.get(args.entityId);
      if (!other) throw new Error("User not found");

      const allExpenses = await ctx.db.query("expenses").collect();
      const expenses = allExpenses.filter((exp) => {
        const involvesMe = exp.paidByUserId === me._id || exp.splits.some((s) => s.userId === me._id);
        const involvesThem = exp.paidByUserId === other._id || exp.splits.some((s) => s.userId === other._id);
        return involvesMe && involvesThem && isExpenseApproved(exp);
      });

      let owed = 0, owing = 0;

      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          const split = exp.splits.find((s) => s.userId === other._id && !s.paid);
          if (split) owed += split.amount;
        }
        if (exp.paidByUserId === other._id) {
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) owing += split.amount;
        }
      }

      const settlements = await ctx.db
        .query("settlements")
        .filter((q) =>
          q.or(
            q.and(q.eq(q.field("paidByUserId"), me._id), q.eq(q.field("receivedByUserId"), other._id)),
            q.and(q.eq(q.field("paidByUserId"), other._id), q.eq(q.field("receivedByUserId"), me._id))
          )
        )
        .collect();

      for (const st of settlements) {
        if (st.paidByUserId === me._id) owing = Math.max(0, owing - st.amount);
        else owed = Math.max(0, owed - st.amount);
      }

      return {
        type: "user",
        counterpart: { userId: other._id, name: other.name, email: other.email, imageUrl: other.imageUrl },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing,
      };
    } else if (args.entityType === "group") {
      const group = await ctx.db.get(args.entityId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some((m) => m.userId === me._id);
      if (!isMember) throw new Error("You are not a member of this group");

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      const balances = {};
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 };
      });

      for (const exp of expenses) {
        if (!isExpenseApproved(exp)) continue;
        if (exp.paidByUserId === me._id) {
          exp.splits.forEach((split) => {
            if (split.userId !== me._id && !split.paid) balances[split.userId].owed += split.amount;
          });
        } else if (balances[exp.paidByUserId]) {
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) balances[exp.paidByUserId].owing += split.amount;
        }
      }

      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of settlements) {
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(0, balances[st.receivedByUserId].owing - st.amount);
        }
        if (st.receivedByUserId === me._id && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(0, balances[st.paidByUserId].owed - st.amount);
        }
      }

      const members = await Promise.all(Object.keys(balances).map((id) => ctx.db.get(id)));
      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid);
        const { owed, owing } = balances[uid];
        return { userId: uid, name: m?.name || "Unknown", imageUrl: m?.imageUrl, youAreOwed: owed, youOwe: owing, netBalance: owed - owing };
      });

      return {
        type: "group",
        group: { id: group._id, name: group.name, description: group.description },
        balances: list,
      };
    }

    throw new Error("Invalid entityType; expected 'user' or 'group'");
  },
});

export const getOverallBalanceWithUser = query({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) return { youAreOwed: 0, youOwe: 0, netBalance: 0 };

    const other = await ctx.db.get(args.otherUserId);
    if (!other) throw new Error("User not found");

    const allExpenses = await ctx.db.query("expenses").collect();
    const expenses = allExpenses.filter((exp) => {
      const involvesMe = exp.paidByUserId === me._id || exp.splits.some((s) => s.userId === me._id);
      const involvesThem = exp.paidByUserId === other._id || exp.splits.some((s) => s.userId === other._id);
      return involvesMe && involvesThem && isExpenseApproved(exp);
    });

    let owed = 0, owing = 0;

    for (const exp of expenses) {
      if (exp.paidByUserId === me._id) {
        const split = exp.splits.find((s) => s.userId === other._id && !s.paid);
        if (split) owed += split.amount;
      }
      if (exp.paidByUserId === other._id) {
        const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) owing += split.amount;
      }
    }

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("paidByUserId"), me._id), q.eq(q.field("receivedByUserId"), other._id)),
          q.and(q.eq(q.field("paidByUserId"), other._id), q.eq(q.field("receivedByUserId"), me._id))
        )
      )
      .collect();

    for (const st of settlements) {
      if (st.paidByUserId === me._id) owing = Math.max(0, owing - st.amount);
      else owed = Math.max(0, owed - st.amount);
    }

    return { otherUserId: other._id, otherUserName: other.name, youAreOwed: owed, youOwe: owing, netBalance: owed - owing };
  },
});

export const settleEverythingWithUser = mutation({
  args: {
    otherUserId: v.id("users"),
    totalAmount: v.number(),
    note: v.optional(v.string()),
    iAmPaying: v.boolean(),
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) throw new Error("Not authenticated");

    const other = await ctx.db.get(args.otherUserId);
    if (!other) throw new Error("User not found");
    if (args.totalAmount <= 0) throw new Error("Amount must be positive");
    if (me._id === args.otherUserId) throw new Error("Cannot settle with yourself");

    const allGroups = await ctx.db.query("groups").collect();
    const sharedGroups = allGroups.filter(
      (g) =>
        g.members.some((m) => m.userId === me._id) &&
        g.members.some((m) => m.userId === args.otherUserId)
    );

    const groupBalances = [];

    for (const group of sharedGroups) {
      const expenses = (await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect()).filter((exp) => isExpenseApproved(exp));

      let owed = 0, owing = 0;

      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          const split = exp.splits.find((s) => s.userId === args.otherUserId && !s.paid);
          if (split) owed += split.amount;
        }
        if (exp.paidByUserId === args.otherUserId) {
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) owing += split.amount;
        }
      }

      const groupSettlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of groupSettlements) {
        if (st.paidByUserId === me._id && st.receivedByUserId === args.otherUserId) {
          owing = Math.max(0, owing - st.amount);
        } else if (st.paidByUserId === args.otherUserId && st.receivedByUserId === me._id) {
          owed = Math.max(0, owed - st.amount);
        }
      }

      const net = owed - owing;
      if (net !== 0) groupBalances.push({ group, net });
    }

    const chosenDirectionBalances = args.iAmPaying
      ? groupBalances.filter((gb) => gb.net < 0).sort((a, b) => a.net - b.net)
      : groupBalances.filter((gb) => gb.net > 0).sort((a, b) => b.net - a.net);

    const oppositeDirectionBalances = args.iAmPaying
      ? groupBalances.filter((gb) => gb.net > 0).sort((a, b) => b.net - a.net)
      : groupBalances.filter((gb) => gb.net < 0).sort((a, b) => a.net - b.net);

    const chosenPaidBy = args.iAmPaying ? me._id : args.otherUserId;
    const chosenReceivedBy = args.iAmPaying ? args.otherUserId : me._id;
    const oppositePaidBy = chosenReceivedBy;
    const oppositeReceivedBy = chosenPaidBy;
    const now = Date.now();

    const round2 = (n) => Math.round(n * 100) / 100;
    const minSettlement = 0.005;

    const insertSettlement = async ({ amount, paidByUserId, receivedByUserId, groupId }) => {
      const roundedAmount = round2(amount);
      if (roundedAmount <= minSettlement) return 0;
      await ctx.db.insert("settlements", {
        amount: roundedAmount,
        note: args.note,
        date: now,
        paidByUserId,
        receivedByUserId,
        groupId,
        createdBy: me._id,
      });
      return roundedAmount;
    };

    let counterflowTotal = 0;
    for (const { group, net } of oppositeDirectionBalances) {
      const cleared = await insertSettlement({
        amount: Math.abs(net),
        paidByUserId: oppositePaidBy,
        receivedByUserId: oppositeReceivedBy,
        groupId: group._id,
      });
      counterflowTotal = round2(counterflowTotal + cleared);
    }

    let remainingChosen = round2(args.totalAmount + counterflowTotal);
    for (const { group, net } of chosenDirectionBalances) {
      if (remainingChosen <= minSettlement) break;
      const groupDebt = Math.abs(net);
      const settled = await insertSettlement({
        amount: Math.min(groupDebt, remainingChosen),
        paidByUserId: chosenPaidBy,
        receivedByUserId: chosenReceivedBy,
        groupId: group._id,
      });
      remainingChosen = round2(Math.max(0, remainingChosen - settled));
    }

    if (remainingChosen > minSettlement) {
      await ctx.db.insert("settlements", {
        amount: round2(remainingChosen),
        note: args.note,
        date: now,
        paidByUserId: chosenPaidBy,
        receivedByUserId: chosenReceivedBy,
        createdBy: me._id,
      });
    }
  },
});