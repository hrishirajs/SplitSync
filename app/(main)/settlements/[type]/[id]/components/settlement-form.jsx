"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Form schema validation
const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

export default function SettlementForm({ entityType, entityData, onSuccess }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createSettlement = useConvexMutation(api.settlements.createSettlement);
  const settleEverythingWithUser = useConvexMutation(
    api.settlements.settleEverythingWithUser
  );

  // Group settlement state
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);
  // "group" = settle only this group's debt | "all" = settle everything with this person
  const [settlementScope, setSettlementScope] = useState("group");

  // Fetch overall cross-group balance when a member is selected
  const { data: overallBalance } = useConvexQuery(
    api.settlements.getOverallBalanceWithUser,
    entityType === "group" && selectedGroupMemberId
      ? { otherUserId: selectedGroupMemberId }
      : "skip"
  );

  // Set up form with validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });

  const paymentType = watch("paymentType");

  // Auto-fill amount whenever scope or balances change
  useEffect(() => {
    if (entityType !== "group" || !selectedGroupMemberId) return;

    if (settlementScope === "group") {
      const member = entityData.balances.find(
        (m) => m.userId === selectedGroupMemberId
      );
      const net = member ? Math.abs(member.netBalance) : 0;
      setValue("amount", net > 0 ? net.toFixed(2) : "");
    } else {
      // "all" scope — use overall balance
      if (overallBalance) {
        const net = Math.abs(overallBalance.netBalance);
        setValue("amount", net > 0 ? net.toFixed(2) : "");
      }
    }
  }, [
    settlementScope,
    selectedGroupMemberId,
    overallBalance,
    entityData,
    entityType,
    setValue,
  ]);

  // Reset scope when member changes
  const handleMemberSelect = (userId) => {
    setSelectedGroupMemberId(userId);
    setSettlementScope("group");
    setValue("amount", "");
  };

  // ── Single user settlement ─────────────────────────────────────────────────
  const handleUserSettlement = async (data) => {
    const amount = parseFloat(data.amount);
    try {
      await settleEverythingWithUser.mutate({
        otherUserId: entityData.counterpart.userId,
        totalAmount: amount,
        note: data.note,
        iAmPaying: data.paymentType === "youPaid",
      });

      toast.success("Settlement recorded!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to record settlement: " + error.message);
    }
  };

  // ── Group settlement ───────────────────────────────────────────────────────
  const handleGroupSettlement = async (data, selectedUserId) => {
    if (!selectedUserId) {
      toast.error("Please select a group member to settle with");
      return;
    }

    const amount = parseFloat(data.amount);

    try {
      const selectedUser = entityData.balances.find(
        (b) => b.userId === selectedUserId
      );
      if (!selectedUser) {
        toast.error("Selected user not found in group");
        return;
      }

      const paidByUserId =
        data.paymentType === "youPaid" ? currentUser._id : selectedUser.userId;
      const receivedByUserId =
        data.paymentType === "youPaid" ? selectedUser.userId : currentUser._id;

      if (settlementScope === "all") {
        await settleEverythingWithUser.mutate({
          otherUserId: selectedUser.userId,
          totalAmount: amount,
          note: data.note,
          iAmPaying: data.paymentType === "youPaid",
        });
      } else {
        await createSettlement.mutate({
          amount,
          note: data.note,
          paidByUserId,
          receivedByUserId,
          groupId: entityData.group.id,
        });
      }

      toast.success("Settlement recorded!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to record settlement: " + error.message);
    }
  };

  const onSubmit = async (data) => {
    if (entityType === "user") {
      await handleUserSettlement(data);
    } else if (entityType === "group" && selectedGroupMemberId) {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  };

  if (!currentUser) return null;

  // ══════════════════════════════════════════════════════════════════════════
  //  USER SETTLEMENT
  // ══════════════════════════════════════════════════════════════════════════
  if (entityType === "user") {
    const otherUser = entityData.counterpart;
    const netBalance = entityData.netBalance;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Balance pill */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Current balance</h3>
          {netBalance === 0 ? (
            <p>You are all settled up with {otherUser.name}</p>
          ) : netBalance > 0 ? (
            <div className="flex justify-between items-center">
              <p>
                <span className="font-medium">{otherUser.name}</span> owes you
              </p>
              <span className="text-xl font-bold text-green-600">
                ₹{netBalance.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p>
                You owe <span className="font-medium">{otherUser.name}</span>
              </p>
              <span className="text-xl font-bold text-red-600">
                ₹{Math.abs(netBalance).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Payment direction */}
        <div className="space-y-2">
          <Label>Who paid?</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              register("paymentType").onChange({
                target: { name: "paymentType", value },
              });
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser.imageUrl} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>You paid {otherUser.name}</span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser.imageUrl} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{otherUser.name} paid you</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5">₹</span>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Dinner, rent, etc."
            {...register("note")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP SETTLEMENT
  // ══════════════════════════════════════════════════════════════════════════
  if (entityType === "group") {
    const groupMembers = entityData.balances;
    const selectedMember = groupMembers.find(
      (m) => m.userId === selectedGroupMemberId
    );

    // Derive balance figures for the active scope
    const groupNet = selectedMember?.netBalance ?? 0;
    const overallNet = overallBalance?.netBalance ?? null;

    // Label for the scope-aware balance line
    const activeScopeBalance =
      settlementScope === "group" ? groupNet : overallNet;

    const balanceLabel =
      activeScopeBalance === null
        ? null
        : activeScopeBalance === 0
          ? "You're all settled up ✓"
          : activeScopeBalance > 0
            ? `${selectedMember?.name} owes you ₹${Math.abs(activeScopeBalance).toFixed(2)}`
            : `You owe ₹${Math.abs(activeScopeBalance).toFixed(2)}`;

    const balanceColor =
      activeScopeBalance === null || activeScopeBalance === 0
        ? "text-muted-foreground"
        : activeScopeBalance > 0
          ? "text-green-600"
          : "text-red-600";

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Step 1: Who are you settling with? ── */}
        <div className="space-y-2">
          <Label>Who are you settling with?</Label>
          <div className="space-y-2">
            {groupMembers.map((member) => {
              const isSelected = selectedGroupMemberId === member.userId;
              const net = member.netBalance;
              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleMemberSelect(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        net > 0
                          ? "text-green-600"
                          : net < 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {net > 0
                        ? `owes you ₹${Math.abs(net).toFixed(2)}`
                        : net < 0
                          ? `you owe ₹${Math.abs(net).toFixed(2)}`
                          : "settled up"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">
              Please select a member to settle with
            </p>
          )}
        </div>

        {/* ── Steps 2–4: shown after a member is selected ── */}
        {selectedMember && (
          <>
            {/* ── Step 2: Scope toggle ── */}
            <div className="space-y-2">
              <Label>What are you settling?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementScope("group")}
                  className={`flex flex-col items-center gap-1 border rounded-lg p-3 text-sm transition-colors ${
                    settlementScope === "group"
                      ? "border-primary bg-primary/5 font-semibold"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-base">📍</span>
                  <span>This group only</span>
                  <span className={`text-xs font-normal ${groupNet !== 0 ? (groupNet > 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`}>
                    {groupNet === 0
                      ? "settled"
                      : `₹${Math.abs(groupNet).toFixed(2)}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementScope("all")}
                  className={`flex flex-col items-center gap-1 border rounded-lg p-3 text-sm transition-colors ${
                    settlementScope === "all"
                      ? "border-primary bg-primary/5 font-semibold"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-base">🌐</span>
                  <span>Everything with {selectedMember.name.split(" ")[0]}</span>
                  <span className={`text-xs font-normal ${overallNet !== null && overallNet !== 0 ? (overallNet > 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`}>
                    {overallNet === null
                      ? "loading…"
                      : overallNet === 0
                        ? "settled"
                        : `₹${Math.abs(overallNet).toFixed(2)}`}
                  </span>
                </button>
              </div>

              {/* One-line balance summary for selected scope */}
              {balanceLabel && (
                <p className={`text-sm font-medium ${balanceColor}`}>
                  {balanceLabel}
                </p>
              )}
            </div>

            {/* ── Step 3: Who paid? ── */}
            <div className="space-y-2">
              <Label>Who paid?</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="g-youPaid" />
                  <Label
                    htmlFor="g-youPaid"
                    className="flex-grow cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.imageUrl} />
                        <AvatarFallback>
                          {currentUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>You paid {selectedMember.name}</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="g-theyPaid" />
                  <Label
                    htmlFor="g-theyPaid"
                    className="flex-grow cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={selectedMember.imageUrl} />
                        <AvatarFallback>
                          {selectedMember.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedMember.name} paid you</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* ── Step 4: Amount ── */}
            <div className="space-y-2">
              <Label htmlFor="g-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">₹</span>
                <Input
                  id="g-amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* ── Note ── */}
            <div className="space-y-2">
              <Label htmlFor="g-note">Note (optional)</Label>
              <Textarea
                id="g-note"
                placeholder="Dinner, rent, etc."
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting
            ? "Recording..."
            : settlementScope === "group"
              ? `Settle in ${entityData.group.name}`
              : `Settle everything with ${selectedMember?.name?.split(" ")[0] ?? "them"}`}
        </Button>
      </form>
    );
  }

  return null;
}
