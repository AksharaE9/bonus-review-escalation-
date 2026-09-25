import type { SessionUser, Role } from "@/types";

export interface RawClientOptions {
  baseUrl?: string;
  cookieHeader?: string;
  sessionUser?: SessionUser;
}

/**
 * Raw Client helper that calls server actions and route handlers directly, bypassing the UI.
 * Required for M6 authorization, IDOR, enumeration, vertical/horizontal privilege escalation checks.
 */
export class RawClient {
  private baseUrl: string;
  private cookieHeader: string;
  private sessionUser?: SessionUser;

  constructor(options: RawClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    this.cookieHeader = options.cookieHeader || "";
    this.sessionUser = options.sessionUser;
  }

  setCookie(cookie: string) {
    this.cookieHeader = cookie;
  }

  /**
   * Directly sends an HTTP request bypassing frontend React components.
   */
  async request(path: string, init: RequestInit = {}) {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers || {});
    if (this.cookieHeader) {
      headers.set("cookie", this.cookieHeader);
    }
    return fetch(url, {
      ...init,
      headers,
      redirect: init.redirect || "manual",
    });
  }

  /**
   * Invokes an export route directly.
   */
  async getExport(module: "bonuses" | "escalations" | "audit", format: "csv" = "csv") {
    return this.request(`/api/export/${module}?format=${format}`);
  }

  /**
   * Directly calls a Next.js Server Action with raw action payloads.
   */
  async callServerAction<TArgs extends unknown[], TResult>(
    actionFn: (...args: TArgs) => Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    return actionFn(...args);
  }
}
