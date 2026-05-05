export function getSmartSettleRecommendation(balances) {
  const youOwe = balances?.oweDetails?.youOwe ?? [];
  const youAreOwedBy = balances?.oweDetails?.youAreOwedBy ?? [];
  const totalBalance = balances?.totalBalance ?? 0;

  if (youOwe.length === 0 && youAreOwedBy.length === 0) {
    return null;
  }

  let candidates = [];
  let direction = null;

  if (totalBalance < 0 && youOwe.length > 0) {
    candidates = youOwe;
    direction = "owe";
  } else if (totalBalance > 0 && youAreOwedBy.length > 0) {
    candidates = youAreOwedBy;
    direction = "owed";
  } else {
    const topOwe = youOwe[0];
    const topOwed = youAreOwedBy[0];

    if (!topOwe) {
      candidates = youAreOwedBy;
      direction = "owed";
    } else if (!topOwed) {
      candidates = youOwe;
      direction = "owe";
    } else if (topOwe.amount >= topOwed.amount) {
      candidates = youOwe;
      direction = "owe";
    } else {
      candidates = youAreOwedBy;
      direction = "owed";
    }
  }

  const bestMatch = [...candidates].sort((a, b) => b.amount - a.amount)[0];

  if (!bestMatch) return null;

  return {
    direction,
    userId: bestMatch.userId,
    name: bestMatch.name,
    amount: bestMatch.amount,
    actionLabel: direction === "owe" ? "Settle now" : "Request payment",
    description:
      direction === "owe"
        ? "This is the largest balance you owe."
        : "This is the largest balance owed to you.",
  };
}
