# Feature: Frontend authentication & admin shell

## Summary

Next.js App Router auth UX: NextAuth (JWT session) against the Nest `POST /auth/login`, **shadcn-style primitives in `apps/web/components/ui`**, intercepted `@modal` routes for auth dialogs, full-page `/auth/*` fallbacks, API fetch wrapper with refresh-on-401 queue, header user menu, and **admin route protection** via Next.js 16 **`proxy.ts`** (not `middleware.ts` — Next 16 only allows `proxy`).

## Status

status: complete

## Scope

- **App(s):** web
- **Entry points:**
  - `apps/web/app/api/auth/[...nextauth]/route.ts` — NextAuth handlers
  - `apps/web/proxy.ts` — i18n + admin/dashboard gate (`getToken` + role)
  - `apps/web/app/[locale]/(app)/layout.tsx` — app shell + `@modal` slot
  - `apps/web/app/[locale]/(admin)/layout.tsx` — admin layout
  - `apps/web/app/[locale]/(admin)/admin/dashboard/page.tsx` — admin dashboard (`/[locale]/admin/dashboard`)

## Key Files

| File | Role |
|------|------|
| `apps/web/auth.ts` | NextAuth init, Credentials provider → API login |
| `apps/web/auth.config.ts` | JWT/session callbacks (tokens in JWT; `Omit<NextAuthConfig,"providers">`) |
| `apps/web/types/next-auth.d.ts` | Extends `Session` / `JWT` with `id`, `role`, `accessToken`, `refreshToken` |
| `apps/web/proxy.ts` | `getToken` + admin shell: `ADMIN` or `RESTAURANT_ADMIN` for `/admin` and `/dashboard`; `RESTAURANT_ADMIN` redirected away from `/admin/restaurants` and `/admin/restaurant-admins`; then `next-intl` middleware |
| `apps/web/lib/types/roles.ts` | `canAccessAdminShell(role)` shared by `proxy.ts` |
| `apps/web/lib/api-client.ts` | `apiFetch` with 401 → refresh queue, retries with new access token |
| `apps/web/lib/use-api-client.ts` | Client hook: `useSession` + `update()` after refresh |
| `apps/web/lib/server-api.ts` | RSC helper using `auth()` (no client refresh loop) |
| `apps/web/lib/validations/auth.ts` | Zod schemas for all auth forms |
| `apps/web/components/providers.tsx` | `SessionProvider` |
| `apps/web/components/auth/*` | `AuthModal`, `auth-modal-dismiss-context`, forms, switcher |
| `apps/web/lib/auth-return-path.ts` | `captureAuthReturnPath` / `consumeAuthReturnPath`; fallback after auth is **`/menu`** if no path was stored |
| `apps/web/components/auth/auth-modal-actions-context.tsx` | `completeSuccessfulAuth()` — refresh + single `replace` (avoids double navigation with dialog `onOpenChange`) |
| `apps/web/components/header/*` | `Header`, `NavLinks`, `UserMenuButton` |
| `apps/web/app/[locale]/(app)/@modal/(.)auth/*/page.tsx` | Intercepted auth modal pages |
| `apps/web/app/[locale]/(app)/@modal/(.)menu/product/[productId]/page.tsx` | Intercepted `/menu/product/:id` modal (see [frontend-menu.md](features/frontend-menu.md)) |
| `apps/web/app/[locale]/(app)/@modal/(.)product/[productId]/page.tsx` | Intercepted `/product/:id` modal |
| `apps/web/app/[locale]/(app)/auth/*/page.tsx` | Full-page auth URLs use `AuthModal` + forms (`dismissNavigate="replace-home"`) |
| `apps/web/components.json` | shadcn/ui CLI (`new-york`, Tailwind v4); `tailwind.css` → `app/globals.css`; aliases `@/components`, `@/lib/utils`, `@/components/ui` |
| `apps/web/app/globals.css` | Tailwind entry + `@source` for `components/`, `lib/`, `app/`; imports `@repo/tailwind-config`, `./shadcn-theme.css`, `tw-animate-css` |
| `apps/web/app/shadcn-theme.css` | `@theme` tokens (`background`, `primary`, `ring`, …) mapped to Peppes palette |
| `apps/web/lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `apps/web/components/ui/*` | shadcn CLI (`bunx shadcn@latest add …`): Button, Input, Label, Dialog, DropdownMenu, Avatar, Form, … |
| `apps/web/app/globals.css` `:root` | `--ui-button-*`, `--ui-modal-*` brand overrides |

## Session shape (client / server)

```ts
// Conceptual — see types/next-auth.d.ts
session.user: { id, name, email, role: "ADMIN" | "USER" | "RESTAURANT_ADMIN" }
session.accessToken: string
session.refreshToken: string  // exposed for client api-client refresh; still also in JWT cookie
```

**Proxy / JWT:** `getToken` reads the encrypted JWT; `token.role` must be set in the `jwt` callback (from `user.role` on sign-in) for `/admin` and `/dashboard` checks. `UserMenuButton` shows **Dashboard** for `ADMIN` and `RESTAURANT_ADMIN`.

## API client usage

- **Client:** `useApiClient()` → `api.get/post/...` — injects Bearer access token; on 401 runs refresh via API + `useSession().update()` with new tokens.
- **Server (RSC):** `serverApiFetch` — uses `auth()` for access token; refresh queue is client-oriented.

## Auth routes & modal interception

- Soft navigation to `/auth/login` (from `(app)` layout) is intercepted by `@modal/(.)auth/login` and renders `AuthModal` + form.
- Direct load / refresh on `/auth/login` uses `(app)/auth/login/page.tsx` (full page).
- Same pattern for `register`, `forgot-password`, `reset-password`.

## Forms

- `react-hook-form` + `@hookform/resolvers/zod` + `@/components/ui/form` primitives.
- API errors → `setError("root", { message })` where applicable.
- Login/register success → `signIn("credentials", ...)` or redirect as implemented per form.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXTAUTH_SECRET` | `.env.local` | JWT encryption / `getToken` |
| `NEXTAUTH_URL` | `.env.local` | Canonical app URL |
| `NEXT_PUBLIC_API_URL` | `.env` / `.env.local` | Nest API base |

Also declared in `turbo.json` `env` for `dev` / `build`.

## Dependencies on other features

- **Auth & user management (API):** `POST /auth/login`, `POST /auth/register`, refresh/logout endpoints must match client expectations. See [auth-user-management.md](auth-user-management.md).

## Key decisions & gotchas

- **Next.js 16:** Do not add `middleware.ts` if `proxy.ts` exists — merge auth checks into `proxy.ts` and export `proxy` + `config.matcher`.
- **TypeScript:** `auth.config.ts` uses `Omit<NextAuthConfig, "providers">` so providers live only in `auth.ts`. `auth.ts` exports `handlers`, `auth`, `signIn`, `signOut` with explicit `NextAuthResult[...]` annotations to satisfy declaration emit portability checks.
- **Imports:** Prefer `@/components/ui/*` and `@/lib/utils` (path alias).
- **Locale:** Redirects in `proxy.ts` preserve `en` / `no` prefix (`/${locale}/auth/login`, `/${locale}`).
- **After sign-in / register:** Use `completeSuccessfulAuth()` from `AuthModalActionsContext` (refresh + `replace`). Closing the modal (X / overlay) also uses `router.replace(consumeAuthReturnPath())`, never `router.back()`. Stored path comes from `captureAuthReturnPath` on the sign-in entry `Link`; if missing, **`/menu`**. Full-page auth: `dismissNavigate="replace-home"` → `replace("/")` and `clearAuthReturnPath()`.
- **Tailwind:** Only `app/globals.css` imports `tailwindcss`. **`@repo/tailwind-config` (`shared-style.css`) must not `@import "tailwindcss"`** — a second import breaks Tailwind v4.
- **Global reset:** Use `:where(*)` for margin/padding reset so utilities like `p-6` win over the reset.

## Frontend ↔ backend checklist

- [x] Login returns user + `accessToken` + `refreshToken` matching `authorize()` in `auth.ts`
- [x] Refresh endpoint returns new access (and refresh if rotated) consistent with `api-client.ts`
- [x] Logout accepts Bearer access token (`UserMenuButton`)
- [x] User role enum matches `ADMIN` | `USER` | `RESTAURANT_ADMIN` for menu + proxy
