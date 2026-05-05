export function isExpenseApproved(expense) {
  return expense?.approvalStatus !== "pending";
}

export function getExpenseApprovalLabel(expense) {
  if (expense?.approvalStatus === "pending") return "Pending approval";
  return "Approved";
}
