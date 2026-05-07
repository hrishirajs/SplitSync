"use client";

import { useState } from "react";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { getExpenseApprovalLabel } from "@/lib/expense-approval";
import {
  Paperclip,
  Repeat,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function ReceiptViewer({ receiptDataUrl, receiptName, receiptType }) {
  const [open, setOpen] = useState(false);

  if (!receiptDataUrl && !receiptName) return null;

  const isPdf = receiptType === "application/pdf";

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Paperclip className="h-3 w-3" />
        <span>{receiptName || "Receipt"}</span>

        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {open && receiptDataUrl && (
        <div className="mt-2">
          {isPdf ? (
            <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3 text-sm">
              <FileText className="h-5 w-5 text-muted-foreground" />

              <span className="text-muted-foreground">
                PDF receipt
              </span>

              <a
                href={receiptDataUrl}
                download={receiptName || "receipt.pdf"}
                className="ml-auto text-xs text-primary underline underline-offset-2"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="relative">
              <img
                src={receiptDataUrl}
                alt={receiptName || "Receipt"}
                className="max-h-64 rounded-md object-contain border"
              />

              <a
                href={receiptDataUrl}
                download={receiptName || "receipt"}
                className="absolute top-2 right-2 text-xs bg-background/80 backdrop-blur px-2 py-1 rounded border text-primary"
              >
                Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExpenseList({
  expenses,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId = null,
  userLookupMap = {},
}) {
  const { data: currentUser } = useConvexQuery(
    api.users.getCurrentUser
  );

  const deleteExpense = useConvexMutation(
    api.expenses.deleteExpense
  );

  if (!expenses || !expenses.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses found
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId) => ({
    name:
      userId === currentUser?._id
        ? "You"
        : userLookupMap[userId]?.name || "Other User",

    imageUrl: userLookupMap[userId]?.imageUrl || null,
    id: userId,
  });

  const canDeleteExpense = (expense) => {
    if (!currentUser) return false;

    return (
      expense.createdBy === currentUser._id ||
      expense.paidByUserId === currentUser._id
    );
  };

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteExpense.mutate({
        expenseId: expense._id,
      });

      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error(
        "Failed to delete expense: " + error.message
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense) => {
        const payer = getUserDetails(
          expense.paidByUserId
        );

        const isCurrentUserPayer =
          expense.paidByUserId === currentUser?._id;

        const category = getCategoryById(
          expense.category
        );

        const CategoryIcon = getCategoryIcon(
          category.id
        );

        const showDeleteOption =
          canDeleteExpense(expense);

        const hasReceipt = !!(
          expense.receiptName ||
          expense.receiptDataUrl
        );

        return (
          <Card
            className="hover:bg-muted/30 transition-colors"
            key={expense._id}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-medium">
                      {expense.description}
                    </h3>

                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(
                          new Date(expense.date),
                          "MMM d, yyyy"
                        )}
                      </span>

                      {showOtherPerson && (
                        <>
                          <span>•</span>

                          <span>
                            {isCurrentUserPayer
                              ? "You"
                              : payer.name}{" "}
                            paid
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">
                      ${expense.amount.toFixed(2)}
                    </div>

                    {isGroupExpense ? (
                      <Badge
                        variant={
                          expense.approvalStatus ===
                            "pending"
                            ? "secondary"
                            : "outline"
                        }
                        className="mt-1"
                      >
                        {expense.approvalStatus ===
                          "pending"
                          ? getExpenseApprovalLabel(
                            expense
                          )
                          : "Group expense"}
                      </Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {isCurrentUserPayer ? (
                          <span className="text-green-600">
                            You paid
                          </span>
                        ) : (
                          <span className="text-red-600">
                            {payer.name} paid
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap justify-end gap-2">
                      {hasReceipt && (
                        <Badge
                          variant="outline"
                          className="gap-1"
                        >
                          <Paperclip className="h-3 w-3" />
                          Receipt
                        </Badge>
                      )}

                      {expense.sourceTemplateId && (
                        <Badge
                          variant="outline"
                          className="gap-1"
                        >
                          <Repeat className="h-3 w-3" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>

                  {showDeleteOption && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() =>
                        handleDeleteExpense(expense)
                      }
                    >
                      <Trash2 className="h-4 w-4" />

                      <span className="sr-only">
                        Delete expense
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="flex gap-2 flex-wrap">
                  {expense.splits.map((split, idx) => {
                    const splitUser =
                      getUserDetails(split.userId);

                    const isCurrentUser =
                      split.userId ===
                      currentUser?._id;

                    const shouldShow =
                      showOtherPerson ||
                      (!showOtherPerson &&
                        (split.userId ===
                          currentUser?._id ||
                          split.userId ===
                          otherPersonId));

                    if (!shouldShow) return null;

                    return (
                      <Badge
                        key={idx}
                        variant={
                          split.paid
                            ? "outline"
                            : "secondary"
                        }
                        className="flex items-center gap-1"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage
                            src={splitUser.imageUrl}
                          />

                          <AvatarFallback>
                            {splitUser.name?.charAt(
                              0
                            ) || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <span>
                          {isCurrentUser
                            ? "You"
                            : splitUser.name}
                          : $
                          {split.amount.toFixed(2)}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {hasReceipt && (
                <ReceiptViewer
                  receiptDataUrl={
                    expense.receiptDataUrl
                  }
                  receiptName={
                    expense.receiptName
                  }
                  receiptType={
                    expense.receiptType
                  }
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


