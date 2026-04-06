"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCategoryService } from "@/lib/services/use-category-service";
import type { SubCategoryProfile } from "@/lib/types/admin-api";
import {
  updateSubcategorySchema,
  type UpdateSubcategoryInput,
} from "@/lib/validations/category";

export function EditSubcategoryDialog({
  open,
  onOpenChange,
  categoryId,
  subcategory,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  subcategory: SubCategoryProfile | null;
  onUpdated: () => void;
}) {
  const categoryService = useCategoryService();

  const form = useForm<UpdateSubcategoryInput>({
    resolver: zodResolver(updateSubcategorySchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (subcategory) {
      form.reset({
        name: subcategory.name,
        description: subcategory.description ?? "",
        sortOrder: subcategory.sortOrder,
        isActive: subcategory.isActive,
      });
    }
  }, [subcategory, form]);

  async function onSubmit(values: UpdateSubcategoryInput) {
    if (!subcategory) return;
    try {
      await categoryService.updateSubcategory(categoryId, subcategory.id, values);
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not update subcategory",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit sub category</DialogTitle>
          <DialogDescription>
            Update the subcategory details below.
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
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : Number.parseInt(e.target.value, 10),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
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
