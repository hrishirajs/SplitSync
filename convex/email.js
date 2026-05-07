import { action, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Resend } from "resend";

const FROM = "SplitSync <onboarding@resend.dev>";

// ─── Email Templates ─────────────────────────────────────────────────────────

function welcomeEmailHtml(name) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px">SplitSync</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Smart expense splitting</p>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:600">Welcome, ${name}! 🎉</h2>
          <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6">
            You're all set to start splitting expenses with friends, family, and groups — without the awkwardness.
          </p>
          <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">Here's what you can do with SplitSync:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:20px;padding-right:14px;vertical-align:top">💸</td>
                <td><strong style="color:#111827;font-size:14px">Split expenses</strong><br>
                <span style="color:#6b7280;font-size:13px">Equal, percentage, or exact splits with anyone</span></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:20px;padding-right:14px;vertical-align:top">👥</td>
                <td><strong style="color:#111827;font-size:14px">Create groups</strong><br>
                <span style="color:#6b7280;font-size:13px">Track shared expenses for trips, households, or teams</span></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:20px;padding-right:14px;vertical-align:top">📊</td>
                <td><strong style="color:#111827;font-size:14px">Smart settle</strong><br>
                <span style="color:#6b7280;font-size:13px">See exactly who owes what and settle up in one tap</span></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:10px 0">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:20px;padding-right:14px;vertical-align:top">🔁</td>
                <td><strong style="color:#111827;font-size:14px">Recurring expenses</strong><br>
                <span style="color:#6b7280;font-size:13px">Set up rent, subscriptions, and regular splits automatically</span></td>
              </tr></table>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6)">
            <a href="https://split-sync-rho.vercel.app/dashboard" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">
              Go to Dashboard →
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">You're receiving this because you signed up for SplitSync.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function expenseEmailHtml({ recipientName, payerName, description, amount, splitAmount, category, date, iPaid, groupName }) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const formattedAmount = `$${amount.toFixed(2)}`;
  const formattedSplit = `$${splitAmount.toFixed(2)}`;
  const isGroup = !!groupName;
  const statusColor = iPaid ? "#16a34a" : "#dc2626";
  const statusText = iPaid
    ? `You paid ${formattedAmount} — others owe you their share`
    : `${payerName} paid ${formattedAmount} — your share is ${formattedSplit}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">SplitSync</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">New expense added</p>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 20px;color:#4b5563;font-size:15px">Hi <strong style="color:#111827">${recipientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">
            A new expense has been added${isGroup ? ` to <strong style="color:#111827">${groupName}</strong>` : ""}.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><span style="font-size:22px;font-weight:700;color:#111827">${formattedAmount}</span></td>
                  <td align="right"><span style="background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px">${category || "Other"}</span></td>
                </tr>
              </table>
              <p style="margin:8px 0 0;color:#111827;font-size:17px;font-weight:600">${description}</p>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:13px">${formattedDate}${isGroup ? ` • ${groupName}` : ""}</p>
            </td></tr>
            <tr><td style="padding:0 24px 20px">
              <div style="border-top:1px solid #e5e7eb;padding-top:16px">
                <p style="margin:0;color:${statusColor};font-size:14px;font-weight:500">${statusText}</p>
                ${!iPaid ? `<p style="margin:8px 0 0;color:#111827;font-size:20px;font-weight:700">Your share: ${formattedSplit}</p>` : ""}
              </div>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6)">
            <a href="https://split-sync-rho.vercel.app/dashboard" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">
              View in SplitSync →
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">You're receiving this because you're part of this expense on SplitSync.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Internal Query — load expense data for notification ─────────────────────

export const getExpenseForEmail = internalQuery({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) return null;

    const payer = await ctx.db.get(expense.paidByUserId);
    let groupName = null;
    if (expense.groupId) {
      const group = await ctx.db.get(expense.groupId);
      groupName = group?.name ?? null;
    }

    const recipients = await Promise.all(
      expense.splits.map(async (split) => {
        const u = await ctx.db.get(split.userId);
        return {
          email: u?.email ?? null,
          name: u?.name ?? "there",
          splitAmount: split.amount,
          isPayer: split.userId === expense.paidByUserId,
        };
      })
    );

    return {
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payerName: payer?.name ?? "Someone",
      groupName,
      recipients,
    };
  },
});

// ─── Internal Actions ─────────────────────────────────────────────────────────

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { console.error("RESEND_API_KEY not set"); return; }

    const resend = new Resend(apiKey);
    try {
      await resend.emails.send({
        from: FROM,
        to: args.email,
        subject: "Welcome to SplitSync 🎉",
        html: welcomeEmailHtml(args.name),
      });
      console.log("Welcome email sent to", args.email);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  },
});

export const sendExpenseNotifications = internalAction({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { console.error("RESEND_API_KEY not set"); return; }

    const expense = await ctx.runQuery(internal.email.getExpenseForEmail, {
      expenseId: args.expenseId,
    });
    if (!expense) return;

    const resend = new Resend(apiKey);

    for (const recipient of expense.recipients) {
      if (!recipient.email) continue;
      try {
        await resend.emails.send({
          from: FROM,
          to: recipient.email,
          subject: `New expense: ${expense.description} ($${expense.amount.toFixed(2)})`,
          html: expenseEmailHtml({
            recipientName: recipient.name,
            payerName: expense.payerName,
            description: expense.description,
            amount: expense.amount,
            splitAmount: recipient.splitAmount,
            category: expense.category,
            date: expense.date,
            iPaid: recipient.isPayer,
            groupName: expense.groupName,
          }),
        });
        console.log("Expense notification sent to", recipient.email);
      } catch (error) {
        console.error("Failed to send to", recipient.email, error);
      }
    }
  },
});

// ─── Public action (kept for Inngest backward compat) ────────────────────────

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(args.apiKey);
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  },
});