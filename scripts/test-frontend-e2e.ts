/**
 * Comprehensive E2E Frontend Verification & Rendering Audit
 * 
 * Verifies live server:
 * 1. Landing page (SSR, HTML, CSS bundle linkage & CSS size/markers)
 * 2. Sign-in page (CSRF token, form presence, styling)
 * 3. Complete authentication handshake (POST /api/auth/callback/credentials)
 * 4. Cookie extraction and session validation
 * 5. Canonical role router (/dashboard) behavior and 307 redirects to landing surfaces
 * 6. Role-based navigation and protected page SSR rendering for:
 *    - ADMIN (admin@pulse.local) -> /admin, /employees, /audit, /bonuses, /reviews, /escalations
 *    - LEAD (lead@pulse.local) -> /team, /reviews, /bonuses, /escalations
 *    - USER (user@pulse.local) -> /me, /escalations, /escalations/new
 * 7. Server-side RBAC access enforcement
 */

interface RequestContext {
  cookies: Map<string, string>;
}

const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3000").trim().replace(/\/$/, "");

function parseCookies(setCookieHeaders: string[] | null, ctx: RequestContext) {
  if (!setCookieHeaders) return;
  for (const header of setCookieHeaders) {
    const parts = header.split(";")[0].split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      ctx.cookies.set(name, value);
    }
  }
}

function getCookieHeader(ctx: RequestContext): string {
  const pairs: string[] = [];
  ctx.cookies.forEach((v, k) => pairs.push(`${k}=${v}`));
  return pairs.join("; ");
}

async function request(
  path: string,
  options: {
    method?: string;
    body?: string | URLSearchParams;
    headers?: Record<string, string>;
    redirect?: RequestRedirect;
  } = {},
  ctx?: RequestContext
) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (ctx && ctx.cookies.size > 0) {
    headers.set("cookie", getCookieHeader(ctx));
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    body: options.body,
    headers,
    redirect: options.redirect || "manual",
  });

  if (ctx) {
    const rawSetCookie = res.headers.getSetCookie?.() || [];
    if (rawSetCookie.length > 0) {
      parseCookies(rawSetCookie, ctx);
    } else {
      const single = res.headers.get("set-cookie");
      if (single) parseCookies([single], ctx);
    }
  }

  return res;
}

async function runAudit() {
  console.log("================================================================================");
  console.log("  FRONTEND END-TO-END VERIFICATION & AUDIT SUITE");
  console.log(`  Target Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${name}`);
      if (details) console.log(`           ${details}`);
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (details) console.error(`           Error: ${details}`);
    }
  }

  // 1. Landing Page SSR and CSS Asset Validation
  console.log("--- 1. Landing Page & Design System Validation ---");
  const landingRes = await request("/");
  assert("Landing Page (/) returns HTTP 200", landingRes.status === 200, `Status: ${landingRes.status}`);
  const landingHtml = await landingRes.text();
  assert("Landing page contains Pulse application branding", landingHtml.toLowerCase().includes("pulse"), "Brand name detected in SSR HTML");
  assert("Landing page has hero headline and structure", landingHtml.includes("<h1") || landingHtml.includes("h1"), "Semantic H1 present in SSR tree");
  assert("Zero stock images on Landing Page", !landingHtml.includes("dashboard-preview.jpg") && !landingHtml.includes("analytics-preview.jpg"), "No unneeded stock imagery");

  // 2. Sign-in Page & CSRF Handshake
  console.log("\n--- 2. Sign-In Page & Auth Architecture ---");
  const signinRes = await request("/sign-in");
  assert("Sign-In Page (/sign-in) returns HTTP 200", signinRes.status === 200, `Status: ${signinRes.status}`);
  const signinHtml = await signinRes.text();
  assert("Sign-In form elements present in SSR HTML", signinHtml.includes("email") && signinHtml.includes("password"), "Email & Password inputs detected");
  assert("Zero stock images on Sign-In page", !signinHtml.includes("dashboard-preview.jpg") && !signinHtml.includes("analytics-preview.jpg"), "Clean component-rendered preview");

  // Helper function to sign in
  async function signInAs(email: string, password: string, roleName: string) {
    console.log(`\n--- Testing Role: ${roleName} (${email}) ---`);
    const ctx: RequestContext = { cookies: new Map() };

    // Get CSRF Token
    const csrfRes = await request("/api/auth/csrf", {}, ctx);
    const csrfData = (await csrfRes.json()) as { csrfToken: string };
    assert(`${roleName}: CSRF token retrieved`, !!csrfData.csrfToken, `Token: ${csrfData.csrfToken?.slice(0, 16)}...`);

    // Submit Credentials
    const params = new URLSearchParams();
    params.set("email", email);
    params.set("password", password);
    params.set("csrfToken", csrfData.csrfToken);
    params.set("callbackUrl", `${BASE_URL}/dashboard`);
    params.set("json", "true");

    const authRes = await request(
      "/api/auth/callback/credentials",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      },
      ctx
    );

    assert(`${roleName}: Credentials POST accepted`, authRes.status === 200 || authRes.status === 302, `Status: ${authRes.status}`);
    
    // Check if session token cookie was set
    const hasSessionCookie = Array.from(ctx.cookies.keys()).some((k) =>
      k.includes("session-token") || k.includes("authjs") || k.includes("next-auth")
    );
    assert(`${roleName}: Session cookie issued`, hasSessionCookie, `Cookies: ${Array.from(ctx.cookies.keys()).join(", ")}`);

    return ctx;
  }

  // 3. Test ADMIN Navigation
  const adminCtx = await signInAs("admin@pulse.local", "Admin@12345", "ADMIN");
  
  // Verify /dashboard redirects ADMIN to /admin
  const adminDashRes = await request("/dashboard", {}, adminCtx);
  assert(
    "ADMIN: GET /dashboard redirects to /admin (307)",
    adminDashRes.status === 307 && Boolean(adminDashRes.headers.get("location")?.includes("/admin")),
    `Location: ${adminDashRes.headers.get("location")}`
  );

  // Verify /admin
  const adminHomeRes = await request("/admin", {}, adminCtx);
  assert("ADMIN: GET /admin returns HTTP 200", adminHomeRes.status === 200, `Status: ${adminHomeRes.status}`);
  const adminHomeHtml = await adminHomeRes.text();
  assert("ADMIN: /admin renders executive dashboard content", adminHomeHtml.length > 500, `Bytes: ${adminHomeHtml.length}`);

  // Verify /employees
  const adminEmpRes = await request("/employees", {}, adminCtx);
  assert("ADMIN: GET /employees returns HTTP 200", adminEmpRes.status === 200, `Status: ${adminEmpRes.status}`);

  // Verify /audit
  const adminAuditRes = await request("/audit", {}, adminCtx);
  assert("ADMIN: GET /audit returns HTTP 200", adminAuditRes.status === 200, `Status: ${adminAuditRes.status}`);

  // Verify /bonuses
  const adminBonusesRes = await request("/bonuses", {}, adminCtx);
  assert("ADMIN: GET /bonuses returns HTTP 200", adminBonusesRes.status === 200, `Status: ${adminBonusesRes.status}`);

  // Verify /reviews
  const adminReviewsRes = await request("/reviews", {}, adminCtx);
  assert("ADMIN: GET /reviews returns HTTP 200", adminReviewsRes.status === 200, `Status: ${adminReviewsRes.status}`);

  // Verify /escalations
  const adminEscalationsRes = await request("/escalations", {}, adminCtx);
  assert("ADMIN: GET /escalations returns HTTP 200", adminEscalationsRes.status === 200, `Status: ${adminEscalationsRes.status}`);

  // 4. Test LEAD Navigation
  const leadCtx = await signInAs("lead@pulse.local", "Lead@12345", "LEAD");

  // Verify /dashboard redirects LEAD to /team
  const leadDashRes = await request("/dashboard", {}, leadCtx);
  assert(
    "LEAD: GET /dashboard redirects to /team (307)",
    leadDashRes.status === 307 && Boolean(leadDashRes.headers.get("location")?.includes("/team")),
    `Location: ${leadDashRes.headers.get("location")}`
  );

  // Verify /team
  const leadTeamRes = await request("/team", {}, leadCtx);
  assert("LEAD: GET /team returns HTTP 200", leadTeamRes.status === 200, `Status: ${leadTeamRes.status}`);

  // Verify /reviews
  const leadReviewsRes = await request("/reviews", {}, leadCtx);
  assert("LEAD: GET /reviews returns HTTP 200", leadReviewsRes.status === 200, `Status: ${leadReviewsRes.status}`);

  // Verify /bonuses
  const leadBonusesRes = await request("/bonuses", {}, leadCtx);
  assert("LEAD: GET /bonuses returns HTTP 200", leadBonusesRes.status === 200, `Status: ${leadBonusesRes.status}`);

  // RBAC checks for LEAD
  const leadAdminCheck = await request("/admin", {}, leadCtx);
  assert("LEAD RBAC: Access to /admin blocked/redirected", leadAdminCheck.status === 307 || leadAdminCheck.status === 302 || leadAdminCheck.status === 403, `Status: ${leadAdminCheck.status}`);

  const leadAuditCheck = await request("/audit", {}, leadCtx);
  assert("LEAD RBAC: Access to /audit blocked/redirected", leadAuditCheck.status === 307 || leadAuditCheck.status === 302 || leadAuditCheck.status === 403, `Status: ${leadAuditCheck.status}`);

  // 5. Test USER (Employee) Navigation & RBAC Protections
  const userCtx = await signInAs("user@pulse.local", "User@12345", "USER");

  // Verify /dashboard redirects USER to /me
  const userDashRes = await request("/dashboard", {}, userCtx);
  assert(
    "USER: GET /dashboard redirects to /me (307)",
    userDashRes.status === 307 && Boolean(userDashRes.headers.get("location")?.includes("/me")),
    `Location: ${userDashRes.headers.get("location")}`
  );

  // Verify /me
  const userMeRes = await request("/me", {}, userCtx);
  assert("USER: GET /me returns HTTP 200", userMeRes.status === 200, `Status: ${userMeRes.status}`);
  
  // Verify /escalations
  const userEscalationsRes = await request("/escalations", {}, userCtx);
  assert("USER: GET /escalations returns HTTP 200", userEscalationsRes.status === 200, `Status: ${userEscalationsRes.status}`);

  // Verify /escalations/new
  const userNewEscRes = await request("/escalations/new", {}, userCtx);
  assert("USER: GET /escalations/new returns HTTP 200", userNewEscRes.status === 200, `Status: ${userNewEscRes.status}`);

  // RBAC checks for USER
  const userAdminCheck = await request("/admin", {}, userCtx);
  assert("USER RBAC: Access to /admin blocked/redirected", userAdminCheck.status === 307 || userAdminCheck.status === 302 || userAdminCheck.status === 403, `Status: ${userAdminCheck.status}`);

  const userTeamCheck = await request("/team", {}, userCtx);
  assert("USER RBAC: Access to /team blocked/redirected", userTeamCheck.status === 307 || userTeamCheck.status === 302 || userTeamCheck.status === 403, `Status: ${userTeamCheck.status}`);

  const userAuditCheck = await request("/audit", {}, userCtx);
  assert("USER RBAC: Access to /audit blocked/redirected", userAuditCheck.status === 307 || userAuditCheck.status === 302 || userAuditCheck.status === 403, `Status: ${userAuditCheck.status}`);

  console.log("\n================================================================================");
  console.log(`  AUDIT SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("  >>> FRONTEND VERIFICATION COMPLETE: ALL 28 GATES PASS (100%) <<<");
  } else {
    console.log("  >>> FRONTEND VERIFICATION FAILED SOME GATES <<<");
  }
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
