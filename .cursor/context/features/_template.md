# Feature: [Feature Name]

<!-- Copy this file to .cursor/context/features/<feature-name>.md and fill it in. -->

## Summary
<!-- 2-3 sentences: what this feature does and why it exists. -->

## Status
<!-- one of: planned | in-progress | complete | deprecated -->
status: planned

## Scope
- **App(s):** <!-- web | api | both -->
- **Entry points:**
  - `apps/web/app/<route>/page.tsx` — <!-- brief description -->
  - `apps/api/src/<module>/<module>.controller.ts` — <!-- brief description -->

## Key Files
<!-- List every file that is central to this feature. Be specific. -->
| File | Role |
|------|------|
| `apps/api/src/<module>/<module>.module.ts` | NestJS module registration |
| `apps/api/src/<module>/<module>.service.ts` | Business logic |
| `apps/api/src/<module>/dto/` | Input validation DTOs |
| `apps/web/app/<route>/page.tsx` | Page entry point |
| `apps/web/app/<route>/_components/` | Route-local UI components |

## API Contract
<!-- Document each endpoint / server action this feature exposes. -->

### REST (NestJS)
```
POST /api/<resource>
  Body: { field: string }
  Returns: { id: string, field: string, createdAt: string }

GET /api/<resource>/:id
  Returns: { id: string, field: string }
```

### Server Actions (Next.js)
```ts
// apps/web/app/<route>/actions.ts
createResource(data: CreateResourceInput): Promise<Resource>
```

## Data Model
<!-- Paste the relevant Prisma model(s) or describe the DB schema. -->
```prisma
model Resource {
  id        String   @id @default(cuid())
  field     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## State & Data Flow
<!-- How does data move through the feature? -->
```
User → page.tsx (Server Component)
     → fetch from NestJS API (or Prisma direct)
     → service.ts (business logic)
     → Prisma → PostgreSQL
```

## Environment Variables
<!-- List every env var this feature requires. -->
| Variable | Where set | Purpose |
|----------|-----------|---------|
| `EXAMPLE_API_KEY` | `.env.local` | ... |

## Dependencies on Other Features
<!-- What must exist / be complete before this feature works? -->
- [ ] Feature: auth — user must be authenticated
- [ ] Feature: ...

## Key Decisions & Gotchas
<!-- Architectural choices, non-obvious constraints, things that tripped you up. -->
- **Decision:** Used Server Actions instead of a REST endpoint because mutations are only triggered from the web app.
- **Gotcha:** NestJS validation pipe is global — DTOs must use `class-validator` decorators or requests will be rejected.

## TODOs / Open Questions
- [ ] ...
