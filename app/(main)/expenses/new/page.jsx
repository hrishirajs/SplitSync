"use client";

import { useRouter } from "next/navigation";
import { ExpenseForm } from "./components/expense-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AppPageHero } from "@/components/app-page-hero";

export default function NewExpensePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <AppPageHero
        eyebrow="New expense"
        title="Add a shared expense with a premium flow."
        description="The form stays fast, but now it looks more like a polished product surface than a bare input stack."
        backHref="/dashboard"
        stats={[
          { value: "Equal", label: "split mode" },
          { value: "PDF", label: "receipt upload" },
          { value: "Auto", label: "category suggestion" },
        ]}
      >
        <div className="premium-surface panel-glow space-y-4 p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What’s included</div>
          <div className="space-y-2 text-sm leading-7 text-muted-foreground">
            <p>Individual and group expenses</p>
            <p>Recurring templates and favorites</p>
            <p>Receipt uploads and auto-categorization</p>
          </div>
        </div>
      </AppPageHero>

      <Card>
        <CardContent>
          <Tabs className="pb-3" defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              <TabsTrigger value="group">Group Expense</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-0">
              <ExpenseForm
                type="individual"
                onSuccess={(id) => {
                  if (id) {
                    router.push(`/person/${id}`);
                  } else {
                    router.push("/dashboard");
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="group" className="mt-0">
              <ExpenseForm
                type="group"
                onSuccess={(id) => router.push(`/groups/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
