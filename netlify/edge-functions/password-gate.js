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
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; cursor: auto; }
  .gate { max-width: 380px; width: 100%; padding: 0 32px; text-align: center; }
  .gate .wordmark { font-family: var(--serif); font-size: 22px; font-weight: 500; display: block; margin-bottom: 28px; }
  .gate h1 { font-family: var(--serif); font-weight: 500; font-size: 28px; margin: 0 0 12px; }
  .gate p.hint { color: var(--ink-soft); font-size: 15px; margin: 0 0 28px; }
  .gate form { display: flex; flex-direction: column; gap: 14px; }
  .gate input[type="password"] {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 16px;
    color: var(--ink);
    font-family: var(--sans);
    text-align: center;
  }
  .gate input[type="password"]:focus {
    outline: 2px solid var(--accent-warm);
    outline-offset: 2px;
    border-color: var(--accent-warm);
  }
  .gate button {
    background: var(--accent-warm);
    color: var(--accent);
    border: none;
    border-radius: 6px;
    padding: 12px 16px;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .gate button:hover { transform: translateY(-2px); }
  .gate .error {
    color: var(--accent-warm);
    font-size: 14px;
    margin: -4px 0 4px;
  }
</style>
</head>
<body>
  <div class="gate">
    <span class="wordmark">Kelsey Guo</span>
    <h1>This site is password protected</h1>
    <p class="hint">Enter the password to continue.</p>
    <form method="POST" action="${AUTH_PATH}">
      <input type="hidden" name="redirect" value="${redirectTo}">
      ${error ? '<p class="error">Wrong password &mdash; try again.</p>' : ""}
      <input type="password" name="password" placeholder="Password" autofocus required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}
