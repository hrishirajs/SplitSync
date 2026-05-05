import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle, Users } from "lucide-react";

export function BalanceSummary({ balances, groups }) {
  if (!balances) return null;

  const { oweDetails } = balances;
  const groupList = groups?.map((g) => ({ id: g.id, name: g.name })) ?? [];

  const hasPeopleOwed = oweDetails.youAreOwedBy.length > 0;
  const hasPeopleOwing = oweDetails.youOwe.length > 0;
  const hasGroups = groupList.length > 0;

  return (
    <div className="space-y-4">
      {!hasPeopleOwed && !hasPeopleOwing && !hasGroups && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">You're all settled up!</p>
        </div>
      )}

      {hasPeopleOwed && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
            Owed to you (People)
          </h3>
          <div className="space-y-3">
            {oweDetails.youAreOwedBy.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="font-medium text-green-600">
                  ${item.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasPeopleOwing && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
            You owe (People)
          </h3>
          <div className="space-y-3">
            {oweDetails.youOwe.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="font-medium text-red-600">
                  ${item.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasGroups && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <Users className="h-4 w-4 text-primary mr-2" />
            Groups
          </h3>
          <div className="space-y-3">
            {groupList.map((g) => (
              <Link
                href={`/groups/${g.id}`}
                key={`group-${g.id}`}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{g.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
