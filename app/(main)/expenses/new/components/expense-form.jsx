"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  CalendarIcon,
  Paperclip,
  Repeat,
  Trash2,
} from "lucide-react";
import { getAllCategories } from "@/lib/expense-categories";
import { getAutoCategorySuggestion } from "@/lib/auto-categorize";
import {
  RECURRENCE_FREQUENCIES,
  getNextRecurrenceDate,
  getRecurrenceLabel,
} from "@/lib/recurrence";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
});

export function ExpenseForm({ type = "individual", onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splits, setSplits] = useState([]);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { data: expenseTemplates } = useConvexQuery(api.expenses.getExpenseTemplates);

  const createExpense = useConvexMutation(api.expenses.createExpense);
  const saveExpenseTemplate = useConvexMutation(api.expenses.saveExpenseTemplate);
  const deleteExpenseTemplate = useConvexMutation(api.expenses.deleteExpenseTemplate);
  const categories = getAllCategories();
  const defaultCategoryId = categories[0]?.id || "other";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: defaultCategoryId,
      date: new Date(),
      paidByUserId: currentUser?._id || "",
      splitType: "equal",
      groupId: undefined,
    },
  });

  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");
  const groupIdValue = watch("groupId");
  const descriptionValue = watch("description");
  const categoryValue = watch("category");
  const categorySuggestion = getAutoCategorySuggestion(descriptionValue);

  const selectedTemplateCount = expenseTemplates?.length || 0;

  const applyTemplate = (template) => {
    if (!template) return;

    setValue("description", template.description || "", { shouldDirty: true });
    setValue("amount", template.amount?.toString() || "", { shouldDirty: true });
    setValue("category", template.category || defaultCategoryId, { shouldDirty: true });
    setValue("paidByUserId", template.paidByUserId, { shouldDirty: true });
    setValue("splitType", template.splitType || "equal", { shouldDirty: true });
    setValue("groupId", template.groupId || undefined, { shouldDirty: true });
    setParticipants(
      Array.isArray(template.splits)
        ? template.splits.map((split) => ({
          id: split.userId,
          name: split.name || split.email || "Unknown",
          email: split.email || "",
          imageUrl: split.imageUrl,
        }))
        : []
    );
    setSplits(Array.isArray(template.splits) ? template.splits : []);
    setSelectedGroup(null);
    setCategoryTouched(true);
    const nextDate = new Date();
    setSelectedDate(nextDate);
    setValue("date", nextDate, { shouldDirty: true });
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearReceipt();
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, or PDF receipt.");
      event.target.value = "";
      clearReceipt();
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Receipts must be 1.5 MB or smaller.");
      event.target.value = "";
      clearReceipt();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFile(file);
      setReceiptPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const normalizedDescription = descriptionValue?.trim() || "";

    if (!normalizedDescription) {
      if (!categoryTouched && categoryValue !== defaultCategoryId) {
        setValue("category", defaultCategoryId, { shouldDirty: true });
      }
      return;
    }

    if (categoryTouched || !categorySuggestion?.categoryId) return;

    if (categoryValue !== categorySuggestion.categoryId) {
      setValue("category", categorySuggestion.categoryId, { shouldDirty: true });
    }
  }, [
    categorySuggestion?.categoryId,
    categoryTouched,
    categoryValue,
    defaultCategoryId,
    descriptionValue,
    setValue,
  ]);

  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      setParticipants([
        {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          imageUrl: currentUser.imageUrl,
        },
      ]);
    }
  }, [currentUser, participants]);

  const onSubmit = async (data) => {
    try {
      const amount = parseFloat(data.amount);
      const receiptSnapshot = receiptFile
        ? {
          receiptName: receiptFile.name,
          receiptType: receiptFile.type,
          receiptDataUrl: receiptPreview,
        }
        : {};

      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId,
      }));

      const totalSplitAmount = formattedSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );
      const tolerance = 0.01;

      if (Math.abs(totalSplitAmount - amount) > tolerance) {
        toast.error("Split amounts don't add up to the total. Please adjust your splits.");
        return;
      }

      const groupId = type === "individual" ? undefined : data.groupId;

      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
        ...receiptSnapshot,
      });

      if (saveAsFavorite || recurringEnabled) {
        try {
          // Strip any extra fields (e.g. percentage) not allowed by the Convex validator
          const cleanedSplits = splits.map(({ userId, amount, paid, name, email, imageUrl }) => ({
            userId,
            amount,
            paid: paid ?? userId === data.paidByUserId,
            ...(name && { name }),
            ...(email && { email }),
            ...(imageUrl && { imageUrl }),
          }));

          await saveExpenseTemplate.mutate({
            description: data.description,
            amount,
            category: data.category || "Other",
            paidByUserId: data.paidByUserId,
            splitType: data.splitType,
            splits: cleanedSplits,
            groupId,
            isFavorite: saveAsFavorite,
            isRecurring: recurringEnabled,
            recurrenceFrequency: recurringEnabled ? recurrenceFrequency : undefined,
            recurrenceInterval: recurringEnabled ? recurrenceInterval : undefined,
            nextRunAt: recurringEnabled
              ? getNextRecurrenceDate(
                data.date.getTime(),
                recurrenceFrequency,
                recurrenceInterval
              )
              : undefined,
          });
        } catch (templateError) {
          toast.error(
            `Expense saved, but favorite/recurring template could not be stored: ${templateError.message}`
          );
        }
      }

      toast.success("Expense created successfully!");
      reset();
      {
        const nextDate = new Date();
        setSelectedDate(nextDate);
        setValue("date", nextDate, { shouldDirty: true });
      }
      setCategoryTouched(false);
      setSaveAsFavorite(false);
      setRecurringEnabled(false);
      setRecurrenceFrequency("monthly");
      setRecurrenceInterval(1);
      clearReceipt();
      setSelectedGroup(null);
      setSplits([]);

      const otherParticipant = participants.find((p) => p.id !== currentUser._id);
      const otherUserId = otherParticipant?.id || null;

      if (onSuccess) {
        onSuccess(type === "individual" ? otherUserId : groupId);
      }
    } catch (error) {
      toast.error("Failed to create expense: " + error.message);
    }
  };

  if (!currentUser) return null;

  const isGroupExpense = type === "group";
  const needsAtLeastTwoParticipants = isGroupExpense;
  const submitDisabled =
    isSubmitting || (needsAtLeastTwoParticipants && participants.length <= 1);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {selectedTemplateCount > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-medium">Quick add templates</h3>
              <p className="text-xs text-muted-foreground">
                Reuse a favorite or recurring expense with one click.
              </p>
            </div>
            <Badge variant="secondary">{selectedTemplateCount}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(expenseTemplates || []).map((template) => (
              <div
                key={template._id}
                className="rounded-lg border bg-background p-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{template.description}</span>
                      {template.isFavorite && (
                        <Badge variant="secondary" className="gap-1">
                          <Bookmark className="h-3 w-3" />
                          Favorite
                        </Badge>
                      )}
                      {template.isRecurring && (
                        <Badge variant="outline" className="gap-1">
                          <Repeat className="h-3 w-3" />
                          {getRecurrenceLabel(
                            template.recurrenceFrequency,
                            template.recurrenceInterval
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${template.amount.toFixed(2)}{" "}
                      {template.category ? `• ${template.category}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      try {
                        await deleteExpenseTemplate.mutate({ templateId: template._id });
                        toast.success("Template removed");
                      } catch (error) {
                        toast.error("Failed to delete template: " + error.message);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => applyTemplate(template)}
                  >
                    Use template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Lunch, movie tickets, etc."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={categoryValue || ""}
              onChange={(event) => {
                setCategoryTouched(true);
                setValue("category", event.target.value, { shouldDirty: true });
              }}
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categorySuggestion?.categoryId && !categoryTouched && (
              <p className="text-xs text-emerald-600">
                Auto-selected {categorySuggestion.categoryName.toLowerCase()} from the description.
              </p>
            )}
            {categorySuggestion?.categoryId && categoryTouched && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Suggested {categorySuggestion.categoryName.toLowerCase()} based on the description.
                </span>
                {categoryValue !== categorySuggestion.categoryId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 text-xs text-emerald-600 hover:text-emerald-700"
                    onClick={() => {
                      setCategoryTouched(false);
                      setValue("category", categorySuggestion.categoryId, { shouldDirty: true });
                    }}
                  >
                    Use suggestion
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isGroupExpense && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              defaultGroupId={groupIdValue || ""}
              onChange={(group) => {
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);
                  if (group.members && Array.isArray(group.members)) {
                    setParticipants(group.members);
                  }
                }
              }}
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">Please select a group to continue</p>
            )}
            {selectedGroup?.approvalRequired && (
              <p className="text-xs text-amber-600">
                This group requires approval, so new expenses will stay pending until an admin approves them.
              </p>
            )}
          </div>
        )}

        {!isGroupExpense && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Paid by</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value="">Select who paid</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser._id ? "You" : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">{errors.paidByUserId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Split type</Label>
          <Tabs defaultValue="equal" onValueChange={(value) => setValue("splitType", value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amounts</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-4">
              <p className="text-sm text-muted-foreground">Split equally among all participants</p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <p className="text-sm text-muted-foreground">Split by percentage</p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="exact" className="pt-4">
              <p className="text-sm text-muted-foreground">Enter exact amounts</p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-xl border border-border/60 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base">Receipt and saved templates</Label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="receipt">Receipt upload</Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*,.pdf"
              onChange={handleReceiptChange}
            />
            {receiptFile ? (
              <div className="rounded-md bg-muted/40 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{receiptFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={clearReceipt}>
                    Clear
                  </Button>
                </div>
                {receiptPreview?.startsWith("data:image") ? (
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="max-h-48 rounded-md object-contain"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">PDF receipt attached.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or PDF up to 1.5 MB.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveAsFavorite}
                onChange={(event) => setSaveAsFavorite(event.target.checked)}
              />
              Save as favorite
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(event) => setRecurringEnabled(event.target.checked)}
              />
              Make recurring
            </label>

            {recurringEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceFrequency">Repeat every</Label>
                  <select
                    id="recurrenceFrequency"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={recurrenceFrequency}
                    onChange={(event) => setRecurrenceFrequency(event.target.value)}
                  >
                    {RECURRENCE_FREQUENCIES.map((frequency) => (
                      <option key={frequency.id} value={frequency.id}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceInterval">Interval</Label>
                  <Input
                    id="recurrenceInterval"
                    type="number"
                    min="1"
                    step="1"
                    value={recurrenceInterval}
                    onChange={(event) =>
                      setRecurrenceInterval(Math.max(1, parseInt(event.target.value, 10) || 1))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitDisabled}>
          {isSubmitting ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}