"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useFieldArray, useForm } from "react-hook-form";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIngredientTemplateService } from "@/lib/services/use-ingredient-template-service";
import type { IngredientProfile } from "@/lib/types/admin-api";
import {
  createIngredientTemplateSchema,
  type CreateIngredientTemplateInput,
} from "@/lib/validations/ingredient";

export function CreateIngredientTemplateDialog({
  open,
  onOpenChange,
  ingredients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: IngredientProfile[];
}) {
  const router = useRouter();
  const templateService = useIngredientTemplateService();

  const form = useForm<CreateIngredientTemplateInput>({
    resolver: zodResolver(createIngredientTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
      items: [{ ingredientId: "", extraPrice: 0, sortOrder: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: CreateIngredientTemplateInput) {
    const cleaned = {
      ...values,
      items: values.items.map((it, i) => ({
        ...it,
        ingredientId: it.ingredientId.trim(),
        sortOrder: it.sortOrder ?? i,
      })),
    };
    try {
      await templateService.createTemplate(cleaned);
      form.reset({
        name: "",
        description: "",
        sortOrder: 0,
        items: [{ ingredientId: "", extraPrice: 0, sortOrder: 0 }],
      });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not create template",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New ingredient template</DialogTitle>
          <DialogDescription>
            Define a reusable set of extras and default prices. Applying a
            template merges rows onto a product without removing existing extras.
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
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-coal">Template items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      ingredientId: "",
                      extraPrice: 0,
                      sortOrder: fields.length,
                    })
                  }
                >
                  <Plus className="mr-1 size-4" />
                  Add row
                </Button>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-2 rounded-md border border-coal-20 p-3 sm:flex-row sm:items-end"
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.ingredientId`}
                    render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-caption">Ingredient</FormLabel>
                        <Select
                          value={f.value}
                          onValueChange={f.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.extraPrice`}
                    render={({ field: f }) => (
                      <FormItem className="w-full sm:w-28">
                        <FormLabel className="text-caption">Extra price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...f}
                            onChange={(e) =>
                              f.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label="Remove row"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
