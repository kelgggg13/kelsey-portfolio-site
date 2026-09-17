const PASSWORD = "empathy";
const COOKIE_NAME = "kg_access";
const AUTH_PATH = "/__auth";

const STATIC_EXTENSIONS = /\.(css|js|png|jpe?g|svg|otf|woff2?|ico|webmanifest|gif|mp4)$/i;

export default async (request, context) => {
  const url = new URL(request.url);

  // Let assets through unauthenticated so the gate page itself can render
  // with the site's real fonts/styles instead of an unstyled fallback.
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    return context.next();
  }

  if (url.pathname === AUTH_PATH && request.method === "POST") {
    const form = await request.formData();
    const attempt = form.get("password") || "";
    const redirectTo = form.get("redirect") || "/";

    if (attempt === PASSWORD) {
      const headers = new Headers({ Location: redirectTo });
      headers.append(
        "Set-Cookie",
        `${COOKIE_NAME}=${PASSWORD}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
      );
      return new Response(null, { status: 302, headers });
    }

    return new Response(gatePage({ redirectTo, error: true }), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
  );

  if (cookies[COOKIE_NAME] === PASSWORD) {
    return context.next();
  }

  return new Response(gatePage({ redirectTo: url.pathname + url.search, error: false }), {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

function gatePage({ redirectTo, error }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kelsey Guo</title>
<link rel="stylesheet" href="/style.css">
<style>
  body { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 100vh; cursor: auto; }
  .gate-glow { position: fixed; width: 620px; height: 620px; right: -140px; bottom: -140px; pointer-events: none; z-index: 0; }
  .gate-glow img { position: absolute; inset: -94.12%; width: auto; height: auto; max-width: none; display: block; }
  .gate { position: relative; z-index: 1; max-width: 420px; width: 100%; padding: 0 32px; text-align: center; }
  .gate-icon { font-size: 40px; margin-bottom: 20px; line-height: 1; }
  .gate h1 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.15;
    margin: 0 0 36px;
  }
  .gate-input-wrap { position: relative; max-width: 320px; margin: 0 auto; }
  .gate-input-wrap input[type="password"] {
    width: 100%;
    background: var(--ink);
    border: none;
    border-radius: 999px;
    padding: 16px 56px 16px 24px;
    font-size: 16px;
    font-family: var(--sans);
    color: var(--bg);
  }
  .gate-input-wrap input[type="password"]::placeholder { color: var(--ink-faint); }
  .gate-input-wrap input[type="password"]:focus {
    outline: 2px solid var(--accent-warm);
    outline-offset: 2px;
  }
  .gate-input-wrap button {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg);
    color: var(--ink);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
  }
  .gate-input-wrap button:hover {
    background: var(--accent-warm);
    color: var(--accent);
    transform: translateY(-50%) scale(1.06);
  }
  .gate-error {
    color: var(--accent-warm);
    font-size: 14px;
    margin: 20px 0 0;
  }
</style>
</head>
<body>
  <div class="gate-glow" aria-hidden="true"><img src="/images/hero/glow.svg" alt=""></div>
  <div class="gate">
    <div class="gate-icon" aria-hidden="true">🪄</div>
    <h1>Enter password to continue</h1>
    <form method="POST" action="${AUTH_PATH}">
      <input type="hidden" name="redirect" value="${redirectTo}">
      <div class="gate-input-wrap">
        <input type="password" name="password" placeholder="Password" autofocus required>
        <button type="submit" aria-label="Submit">&rarr;</button>
      </div>
    </form>
    ${error ? '<p class="gate-error">Please try again, or contact me with questions 🙂</p>' : ""}
  </div>
</body>
</html>`;
}
