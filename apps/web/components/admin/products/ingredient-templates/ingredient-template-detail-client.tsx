"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useForm, useFieldArray } from "react-hook-form";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
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
import type {
  IngredientProfile,
  IngredientTemplateProfile,
} from "@/lib/types/admin-api";
import {
  updateIngredientTemplateSchema,
  type UpdateIngredientTemplateInput,
} from "@/lib/validations/ingredient";

function templateToFormValues(
  t: IngredientTemplateProfile,
): UpdateIngredientTemplateInput {
  return {
    name: t.name,
    description: t.description ?? "",
    sortOrder: t.sortOrder,
    items: t.items.map((it) => ({
      ingredientId: it.ingredientId,
      extraPrice: Number.parseFloat(it.extraPrice),
      sortOrder: it.sortOrder,
    })),
  };
}

export function IngredientTemplateDetailClient({
  template: initial,
  ingredients,
}: {
  template: IngredientTemplateProfile;
  ingredients: IngredientProfile[];
}) {
  const router = useRouter();
  const templateService = useIngredientTemplateService();

  const form = useForm<UpdateIngredientTemplateInput>({
    resolver: zodResolver(updateIngredientTemplateSchema),
    defaultValues: templateToFormValues(initial),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: UpdateIngredientTemplateInput) {
    const payload = {
      ...values,
      items: values.items?.map((it, i) => ({
        ...it,
        sortOrder: it.sortOrder ?? i,
      })),
    };
    try {
      await templateService.updateTemplate(initial.id, payload);
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not update template",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/products/ingredient-templates"
          className="text-caption text-neutral-30 hover:text-coal"
        >
          ← Back to templates
        </Link>
        <PageHeader title={initial.name} description="Edit template rows and prices." />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 rounded-md border border-coal-20 bg-white p-6"
        >
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
                    value={field.value ?? 0}
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
                      <Select value={f.value} onValueChange={f.onChange}>
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
