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
import { loginSchema } from "@/lib/validations/auth";
import { Link, useRouter } from "@/i18n/navigation";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AuthModalDismissContext } from "./auth-modal-dismiss-context";
import { AuthFormSwitcher } from "./auth-form-switcher";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const dismissMode = useContext(AuthModalDismissContext);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      form.setError("root", { message: "Invalid email or password" });
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
                <Input type="password" autoComplete="current-password" {...field} />
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
          <Link
            href="/auth/forgot-password"
            scroll={false}
            className="text-caption text-peppes-red hover:text-glowing-red"
          >
            Forgot password?
          </Link>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Sign in
          </Button>
        </div>
        <AuthFormSwitcher mode="login" />
      </form>
    </Form>
  );
}
