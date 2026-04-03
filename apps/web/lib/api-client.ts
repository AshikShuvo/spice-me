export class AuthExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "AuthExpiredError";
  }
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string | null | undefined>;
  getRefreshToken: () => Promise<string | null | undefined>;
  onTokenRefreshed: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  onAuthExpired: () => Promise<void>;
}

export function createApiClient(options: ApiClientOptions) {
  let refreshing: Promise<{ accessToken: string; refreshToken: string }> | null =
    null;

  async function ensureRefreshed(): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (refreshing) {
      return refreshing;
    }
    refreshing = (async () => {
      const refreshToken = await options.getRefreshToken();
      if (!refreshToken) {
        await options.onAuthExpired();
        throw new AuthExpiredError();
      }
      const res = await fetch(`${options.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await options.onAuthExpired();
        throw new AuthExpiredError();
      }
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      await options.onTokenRefreshed(data);
      return data;
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
    didRetry = false,
    overrideAccess?: string | null,
  ): Promise<T> {
    const access =
      overrideAccess !== undefined
        ? overrideAccess
        : await options.getAccessToken();
    const headers = new Headers(init.headers);
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
    const res = await fetch(`${options.baseUrl}${path}`, { ...init, headers });
    if (res.status === 401 && !didRetry && access) {
      const { accessToken } = await ensureRefreshed();
      return request<T>(path, init, true, accessToken);
    }
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (typeof body.message === "string") message = body.message;
        else if (Array.isArray(body.message))
          message = body.message.join(", ");
      } catch {
        /* ignore */
      }
      throw new ApiRequestError(res.status, message);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    const text = await res.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  return {
    request,
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  };
}
