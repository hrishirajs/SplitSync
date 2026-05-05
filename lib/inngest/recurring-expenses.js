import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { inngest } from "./client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const recurringExpenses = inngest.createFunction(
  { name: "Generate Recurring Expenses", id: "generate-recurring-expenses", triggers: [{ cron: "0 7 * * *" }] },
  async ({ step }) => {
    const templates = await step.run("Fetch recurring templates", async () => {
      return await convex.query(api.expenses.getDueRecurringExpenseTemplates);
    });

    const results = [];

    for (const template of templates) {
      try {
        const expenseId = await step.run(`Generate · ${template._id}`, () =>
          convex.mutation(api.expenses.runRecurringExpenseTemplate, {
            templateId: template._id,
          })
        );

        results.push({ templateId: template._id, expenseId, success: true });
      } catch (error) {
        results.push({
          templateId: template._id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
);
