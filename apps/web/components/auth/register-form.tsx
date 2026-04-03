"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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
import {
  clearAuthReturnPath,
  consumeAuthReturnPath,
} from "@/lib/auth-return-path";
import { registerSchema } from "@/lib/validations/auth";
import { useRouter } from "@/i18n/navigation";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AuthModalDismissContext } from "./auth-modal-dismiss-context";
import { AuthFormSwitcher } from "./auth-form-switcher";

type RegisterValues = z.infer<typeof registerSchema>;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function RegisterForm() {
  const router = useRouter();
  const dismissMode = useContext(AuthModalDismissContext);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.status === 409) {
      form.setError("root", { message: "This email is already registered" });
      return;
    }
    if (!res.ok) {
      let msg = "Registration failed";
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (typeof body.message === "string") msg = body.message;
      } catch {
        /* ignore */
      }
      form.setError("root", { message: msg });
      return;
    }
    const sign = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (sign?.error) {
      form.setError("root", {
        message: "Account created but sign-in failed. Try logging in.",
      });
      return;
    }
    await router.refresh();
    if (dismissMode === "replace-home") {
      clearAuthReturnPath();
      router.replace("/");
      return;
    }
    router.replace(consumeAuthReturnPath());
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root ? (
          <p className="text-body text-danger" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-4 pt-2">
          <AuthFormSwitcher mode="register" />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Create account
          </Button>
        </div>
      </form>
    </Form>
  );
}
