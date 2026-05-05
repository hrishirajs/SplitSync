"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export function PendingExpenseApprovals({
  pendingExpenses,
  userLookupMap,
  canManage,
  onApprove,
  onReject,
}) {
  if (!pendingExpenses?.length) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-500/30">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Pending approvals</h2>
            <p className="text-sm text-muted-foreground">
              These group expenses are waiting for approval and do not affect
              balances yet.
            </p>
          </div>
          <Badge variant="secondary">{pendingExpenses.length} pending</Badge>
        </div>

        <div className="space-y-3">
          {pendingExpenses.map((expense) => {
            const creator = userLookupMap[expense.createdBy];

            return (
              <div
                key={expense._id}
                className="flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/15" />
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {creator?.name || "Someone"} submitted on{" "}
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">${expense.amount.toFixed(2)}</div>
                    <Badge variant="outline" className="mt-1">
                      Pending approval
                    </Badge>
                  </div>

                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onReject(expense)}
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onApprove(expense)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
