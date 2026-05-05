import { getCategoryById } from "@/lib/expense-categories";

const AUTO_CATEGORY_RULES = [
  {
    categoryId: "travel",
    patterns: [
      /\b(flight|airfare|airport|boarding|hotel|hostel|airbnb|trip|vacation|holiday|booking)\b/i,
      /\b(train ticket|bus ticket|travel insurance|resort)\b/i,
    ],
    reason: "Travel and lodging keywords found",
  },
  {
    categoryId: "transportation",
    patterns: [
      /\b(uber|lyft|ola|taxi|cab|ride|rideshare|metro|subway|bus|parking|toll|fuel|petrol|diesel|gas station)\b/i,
    ],
    reason: "Ride and transport keywords found",
  },
  {
    categoryId: "coffee",
    patterns: [/\b(coffee|cafe|café|starbucks|latte|espresso|cappuccino)\b/i],
    reason: "Coffee shop keywords found",
  },
  {
    categoryId: "groceries",
    patterns: [
      /\b(grocery|groceries|supermarket|mart|market|vegetables?|fruits?|milk|bread|produce)\b/i,
    ],
    reason: "Grocery keywords found",
  },
  {
    categoryId: "foodDrink",
    patterns: [
      /\b(restaurant|dinner|lunch|breakfast|brunch|meal|snack|pizza|burger|biryani|sushi|noodles|takeout|takeaway|delivery|food)\b/i,
      /\b(swiggy|zomato|ubereats|doordash|grubhub)\b/i,
    ],
    reason: "Food and dining keywords found",
  },
  {
    categoryId: "housing",
    patterns: [
      /\b(rent|lease|apartment|mortgage|landlord|maintenance|house repair|home repair)\b/i,
    ],
    reason: "Housing keywords found",
  },
  {
    categoryId: "utilities",
    patterns: [
      /\b(electricity|internet|wifi|broadband|water bill|utility|utilities|phone bill|gas bill)\b/i,
    ],
    reason: "Utility keywords found",
  },
  {
    categoryId: "bills",
    patterns: [/\b(subscription|membership|service fee|processing fee|late fee|bank fee|charge)\b/i],
    reason: "Bill or fee keywords found",
  },
  {
    categoryId: "entertainment",
    patterns: [/\b(movie|cinema|film|game|gaming|concert|bowling|party|show)\b/i],
    reason: "Entertainment keywords found",
  },
  {
    categoryId: "tickets",
    patterns: [/\b(ticket|tickets|admission|entry pass|pass)\b/i],
    reason: "Ticketing keywords found",
  },
  {
    categoryId: "health",
    patterns: [/\b(medicine|pharmacy|doctor|hospital|clinic|dental|therapy|health|gym)\b/i],
    reason: "Health keywords found",
  },
  {
    categoryId: "education",
    patterns: [/\b(course|tuition|school|college|class|training|fees?|exam)\b/i],
    reason: "Education keywords found",
  },
  {
    categoryId: "gifts",
    patterns: [/\b(gift|present|birthday gift|wedding gift|flowers?)\b/i],
    reason: "Gift keywords found",
  },
  {
    categoryId: "technology",
    patterns: [/\b(laptop|phone|charger|headphone|earbud|software|gadget|electronics|computer)\b/i],
    reason: "Technology keywords found",
  },
  {
    categoryId: "baby",
    patterns: [/\b(baby|diaper|diapers|stroller|formula|kids?|child)\b/i],
    reason: "Baby and kids keywords found",
  },
  {
    categoryId: "music",
    patterns: [/\b(music|spotify|album|band|concert ticket)\b/i],
    reason: "Music keywords found",
  },
  {
    categoryId: "books",
    patterns: [/\b(book|books|ebook|kindle|novel|magazine)\b/i],
    reason: "Book keywords found",
  },
  {
    categoryId: "personal",
    patterns: [/\b(salon|spa|grooming|cosmetics|skincare|beauty|laundry|dry clean)\b/i],
    reason: "Personal care keywords found",
  },
];

const normalizeDescription = (description) =>
  String(description || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

export function getAutoCategorySuggestion(description) {
  const normalized = normalizeDescription(description);
  if (!normalized) return null;

  for (const rule of AUTO_CATEGORY_RULES) {
    const matchedPattern = rule.patterns.find((pattern) => pattern.test(normalized));
    if (matchedPattern) {
      const category = getCategoryById(rule.categoryId);

      return {
        categoryId: category.id,
        categoryName: category.name,
        reason: rule.reason,
        confidence: 0.88,
        matchedPattern: matchedPattern.toString(),
      };
    }
  }

  return null;
}
