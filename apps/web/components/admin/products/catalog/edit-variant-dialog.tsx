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
import { useProductService } from "@/lib/services/use-product-service";
import type { ProductProfile, ProductVariantProfile } from "@/lib/types/admin-api";
import {
  updateVariantSchema,
  type UpdateVariantInput,
} from "@/lib/validations/product";

export function EditVariantDialog({
  open,
  onOpenChange,
  productId,
  variant,
  onVariantUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant: ProductVariantProfile | null;
  onVariantUpdated: (updated: ProductProfile) => void;
}) {
  const productService = useProductService();

  const form = useForm<UpdateVariantInput>({
    resolver: zodResolver(updateVariantSchema),
    defaultValues: {
      name: "",
      sortOrder: 0,
      basePrice: undefined,
      salePrice: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (variant) {
      form.reset({
        name: variant.name,
        sortOrder: variant.sortOrder,
        basePrice: Number.parseFloat(variant.basePrice),
        salePrice: variant.salePrice
          ? Number.parseFloat(variant.salePrice)
          : undefined,
        isActive: variant.isActive,
      });
    }
  }, [variant, form]);

  async function onSubmit(values: UpdateVariantInput) {
    if (!variant) return;
    try {
      const updated = await productService.updateVariant(
        productId,
        variant.id,
        values,
      );
      onOpenChange(false);
      onVariantUpdated(updated);
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not update variant",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit variant</DialogTitle>
          <DialogDescription>
            Update the variant name, pricing, and active status.
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
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value),
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
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
