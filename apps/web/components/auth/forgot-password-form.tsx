"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type Values = z.infer<typeof forgotPasswordSchema>;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    await fetch(`${apiUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-body text-coal">
          If an account exists for that email, you will receive reset instructions.
        </p>
        <Link href="/auth/login" scroll={false} className="text-peppes-red hover:text-glowing-red">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href="/auth/login"
            scroll={false}
            className="text-caption text-peppes-red hover:text-glowing-red"
          >
            Back to sign in
          </Link>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </div>
      </form>
    </Form>
  );
}
