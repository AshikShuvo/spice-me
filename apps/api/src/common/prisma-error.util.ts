/**
 * Shared Prisma error helpers.
 *
 * Avoids `instanceof PrismaClientKnownRequestError` which breaks under ESM/Jest.
 * Check `code === 'P2002'` directly on the raw error object instead.
 */

export function isPrismaUniqueViolation(
  error: unknown,
): error is { meta?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

export function uniqueConstraintFieldsFromMeta(meta: unknown): string[] {
  if (!meta || typeof meta !== 'object') return [];
  const m = meta as Record<string, unknown>;

  const target = m.target;
  if (Array.isArray(target)) {
    return target.filter((x): x is string => typeof x === 'string');
  }
  if (typeof target === 'string') return [target];

  // pg-adapter shape: meta.driverAdapterError.cause.constraint.fields
  const adapter = m.driverAdapterError as
    | { cause?: { constraint?: { fields?: unknown } } }
    | undefined;
  const fields = adapter?.cause?.constraint?.fields;
  if (Array.isArray(fields)) {
    return fields.filter((x): x is string => typeof x === 'string');
  }

  return [];
}
