import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export const RECURRENCE_FREQUENCIES = [
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom days" },
];

export function getRecurrenceLabel(frequency, interval = 1) {
  if (!frequency) return "";
  if (frequency === "custom") {
    return `Every ${interval || 1} day${interval === 1 ? "" : "s"}`;
  }
  if (frequency === "weekly") {
    return interval === 1 ? "Weekly" : `Every ${interval} weeks`;
  }
  if (frequency === "biweekly") return "Every 2 weeks";
  if (frequency === "monthly") {
    return interval === 1 ? "Monthly" : `Every ${interval} months`;
  }
  if (frequency === "quarterly") return "Quarterly";
  if (frequency === "yearly") {
    return interval === 1 ? "Yearly" : `Every ${interval} years`;
  }
  return frequency;
}

export function getNextRecurrenceDate(baseDate, frequency, interval = 1) {
  const start = new Date(baseDate);

  switch (frequency) {
    case "weekly":
      return addWeeks(start, interval || 1).getTime();
    case "biweekly":
      return addWeeks(start, 2).getTime();
    case "monthly":
      return addMonths(start, interval || 1).getTime();
    case "quarterly":
      return addMonths(start, 3 * (interval || 1)).getTime();
    case "yearly":
      return addYears(start, interval || 1).getTime();
    case "custom":
      return addDays(start, interval || 1).getTime();
    default:
      return null;
  }
}

export function advanceNextRunUntilFuture(currentNextRunAt, frequency, interval) {
  if (!currentNextRunAt || !frequency) return null;

  let nextRunAt = currentNextRunAt;
  const now = Date.now();
  const safetyLimit = 24;
  let attempts = 0;

  while (nextRunAt && nextRunAt <= now && attempts < safetyLimit) {
    nextRunAt = getNextRecurrenceDate(nextRunAt, frequency, interval);
    attempts += 1;
  }

  return nextRunAt;
}
