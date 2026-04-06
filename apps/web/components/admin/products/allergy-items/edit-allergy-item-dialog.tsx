"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAllergyItemService } from "@/lib/services/use-allergy-item-service";
import type { AllergyItemProfile } from "@/lib/types/admin-api";
import {
  updateAllergyItemSchema,
  type UpdateAllergyItemInput,
} from "@/lib/validations/allergy-item";

export function EditAllergyItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AllergyItemProfile | null;
}) {
  const router = useRouter();
  const allergyItemService = useAllergyItemService();

  const form = useForm<UpdateAllergyItemInput>({
    resolver: zodResolver(updateAllergyItemSchema),
    defaultValues: { name: "", description: "", iconUrl: "" },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description ?? "",
        iconUrl: item.iconUrl ?? "",
      });
    }
  }, [item, form]);

  async function onSubmit(values: UpdateAllergyItemInput) {
    if (!item) return;
    try {
      await allergyItemService.updateAllergyItem(item.id, values);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not update allergy item",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit allergy item</DialogTitle>
          <DialogDescription>
            Update the allergy item details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://…"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-body text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
