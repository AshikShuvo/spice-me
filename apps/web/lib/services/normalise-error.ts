import { ApiRequestError, AuthExpiredError } from "@/lib/api-client";

/**
 * Normalises unknown errors from the API client into a standard `Error`
 * so UI layers can show `err.message` consistently.
 */
export function normaliseError(err: unknown): Error {
  if (err instanceof ApiRequestError) {
    return new Error(err.message);
  }
  if (err instanceof AuthExpiredError) {
    return new Error(err.message);
  }
  if (err instanceof Error) {
    return err;
  }
  return new Error("Something went wrong");
}
