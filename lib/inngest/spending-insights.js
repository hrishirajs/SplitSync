import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const spendingInsights = inngest.createFunction(
  { name: "Generate Spending Insights", id: "generate-spending-insights", triggers: [{ cron: "0 8 1 * *" }] },
  async ({ step }) => {
    /* ─── 1. Pull users with expenses this month ────────────────────── */
    const users = await step.run("Fetch users with expenses", async () => {
      return await convex.query(api.inngest.getUsersWithExpenses);
    });

    /* ─── 2. Iterate users & send insight email ─────────────────────── */
    const results = [];

    for (const user of users) {
      /* a. Pull last-month expenses (skip if none) */
      const expenses = await step.run(`Expenses · ${user._id}`, () =>
        convex.query(api.inngest.getUserMonthlyExpenses, { userId: user._id })
      );
      if (!expenses?.length) continue;

      /* b. Build JSON blob for the prompt */
      const expenseData = JSON.stringify({
        expenses,
        totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
        categories: expenses.reduce((cats, e) => {
          cats[e.category ?? "uncategorised"] =
            (cats[e.category] ?? 0) + e.amount;
          return cats;
        }, {}),
      });

      /* c. Generate AI insights using Gemini */
      try {
        const htmlBody = await step.run(`AI Insights · ${user._id}`, async () => {
          const prompt = `Analyze these personal spending patterns and provide insights in HTML format (no markdown, just raw HTML tags). 
Include sections for:
1. 📊 Monthly Overview (total spending summary)
2. 🏷️ Top Spending Categories (as a styled HTML table)
3. ⚠️ Unusual Spending Patterns (if any)
4. 💰 Saving Opportunities
5. 📅 Recommendations for Next Month

Keep it concise, friendly, and actionable. Use inline CSS for styling.
Do NOT include \`\`\`html or any markdown code fences — just return raw HTML.

Expense data: ${expenseData}`;

          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

          const result = await model.generateContent(prompt);
          return result.response.text();
        });

        /* d. Send the email */
        await step.run(`Email · ${user._id}`, () =>
          convex.action(api.email.sendEmail, {
            to: user.email,
            subject: "Your Monthly Spending Insights",
            html: `
              <h1>Your Monthly Financial Insights</h1>
              <p>Hi ${user.name},</p>
              <p>Here's your personalized spending analysis for the past month:</p>
              ${htmlBody}
            `,
            apiKey: process.env.RESEND_API_KEY,
          })
        );

        results.push({ userId: user._id, success: true });
      } catch (err) {
        results.push({
          userId: user._id,
          success: false,
          error: err.message,
        });
      }
    }

    /* ─── 3. Summary for the cron log ───────────────────────────────── */
    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
);
