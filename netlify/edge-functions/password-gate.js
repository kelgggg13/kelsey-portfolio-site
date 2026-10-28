const PASSWORD = "empathy";
const COOKIE_NAME = "kg_access";
const AUTH_PATH = "/__auth";

const STATIC_EXTENSIONS = /\.(css|js|png|jpe?g|svg|otf|woff2?|ico|webmanifest|gif|mp4)$/i;

const escapeAttr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Only same-site paths are allowed as a post-login destination.
const safePath = (p) => (typeof p === "string" && /^\/(?!\/)/.test(p) ? p : "/");

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
    const redirectTo = safePath(form.get("redirect"));
    const wantsJson = request.headers.get("x-gate") === "1";
    const cookie = `${COOKIE_NAME}=${PASSWORD}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;

    if (attempt === PASSWORD) {
      if (wantsJson) {
        const headers = new Headers({ "content-type": "application/json" });
        headers.append("Set-Cookie", cookie);
        return new Response(JSON.stringify({ ok: true, redirect: redirectTo }), { status: 200, headers });
      }
      const headers = new Headers({ Location: redirectTo });
      headers.append("Set-Cookie", cookie);
      return new Response(null, { status: 302, headers });
    }

    if (wantsJson) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
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

  return new Response(gatePage({ redirectTo: safePath(url.pathname + url.search), error: false }), {
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
  html { scrollbar-gutter: stable; }
  html, body { height: 100%; margin: 0; overflow: hidden; background: var(--bg); cursor: auto; }

  /* Everything on the gate lives in one overlay so it can dissolve away on success. */
  .gate-overlay {
    position: fixed;
    inset: 0;
    z-index: 5;
    overflow: hidden;
    background: var(--bg);
    transition: background-color 0.9s ease;
  }
  .gate-overlay.out { background-color: transparent; pointer-events: none; }

  .gate-glow {
    --hue: 285;
    position: absolute;
    width: 380px;
    height: 380px;
    max-width: 64vw;
    max-height: 64vw;
    left: 81.3%;
    bottom: 70px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      hsl(var(--hue) 100% 68% / 0.46) 0%,
      hsl(calc(var(--hue) - 18) 100% 65% / 0.36) 14%,
      hsl(calc(var(--hue) - 35) 100% 62% / 0.24) 30%,
      hsl(calc(var(--hue) - 35) 100% 60% / 0.12) 50%,
      hsl(calc(var(--hue) - 35) 100% 60% / 0.04) 72%,
      hsl(calc(var(--hue) - 35) 100% 60% / 0) 100%
    );
    filter: blur(22px);
    pointer-events: none;
    z-index: 0;
  }

  .gate-main {
    position: relative;
    z-index: 3;
    padding-top: calc(88px + clamp(40px, 6vw, 80px));
  }
  .gate-main h1 {
    margin: 0;
    font-family: var(--sans);
    font-weight: 400;
    font-size: clamp(40px, 5.4vw, 72px);
    line-height: 1.3;
    transition: opacity 0.35s ease;
  }
  .gate-main .sub, .gate-main form, .gate-main .gate-error {
    transition: opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease;
  }
  @media (max-width: 640px) {
    .gate-main h1 { font-size: clamp(34px, 10vw, 48px); }
  }
  .gate-main .sub {
    margin: 10px 0 32px;
    font-family: var(--sans);
    font-weight: 300;
    font-size: clamp(18px, 1.9vw, 28px);
    line-height: 1.5;
    color: var(--ink-soft);
  }

  .gate-input-wrap { position: relative; width: min(320px, 100%); }
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
    outline: none;
    box-shadow: 0 0 28px 6px rgba(248, 195, 185, 0.55);
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
    margin: 20px 0 0;
    color: var(--accent-warm);
    font-size: 14px;
    min-height: 1.4em;
  }
  .gate-error[hidden] { display: block; visibility: hidden; }
  .gate-shake { animation: gate-shake 0.4s ease; }
  @keyframes gate-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }

  /* Locked teaser of the project stack */
  .gate-teaser {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -40px;
    display: flex;
    justify-content: center;
    pointer-events: none;
    filter: blur(1.5px) brightness(0.85) saturate(1.05);
    z-index: 1;
    transition: filter 1s ease, transform 1s ease;
  }
  .gate-teaser .stack-card { flex: 0 0 min(390px, 36vw); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); }
  .gate-teaser .stack-card + .stack-card { margin-left: -42px; }
  .gate-fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 30%;
    background: linear-gradient(to top, var(--bg) 2%, transparent);
    z-index: 2;
    pointer-events: none;
  }

  /* Success: the site loads behind the gate, blurred, then comes into focus. */
  body.entering .gate-main .sub,
  body.entering .gate-main form,
  body.entering .gate-main .gate-error { opacity: 0; transform: translateY(-10px); filter: blur(6px); }
  body.entering .gate-teaser { opacity: 0; filter: blur(0) brightness(1.05); transform: translateY(36px) scale(1.04); transition: opacity 0.8s ease, filter 0.8s ease, transform 0.8s ease; }
  body.entering .gate-fade { opacity: 0; transition: opacity 0.6s ease; }
  body.entering .gate-glow { opacity: 0; transition: opacity 0.6s ease; }
  body.entering .gate-main h1.handoff { opacity: 0; }
  .entry-frame {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    z-index: 1;
    background: var(--bg);
    opacity: 0;
    filter: blur(34px) saturate(1.3);
    transition: opacity 0.5s ease, filter 1.3s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .entry-frame.show { opacity: 1; filter: none; }
  @media (prefers-reduced-motion: reduce) {
    .gate-overlay, .gate-main h1, .gate-main .sub, .gate-main form, .gate-teaser, .entry-frame { transition: none; }
    .gate-shake { animation: none; }
  }
</style>
</head>
<body>
  <div class="gate-overlay" id="gateOverlay">
    <div class="gate-glow" aria-hidden="true"></div>

    <main class="gate-main wrap">
      <h1>Hi, I&rsquo;m Kelsey.</h1>
      <p class="sub">psst, got the password?</p>
      <form id="gateForm" method="POST" action="${AUTH_PATH}">
        <input type="hidden" name="redirect" value="${escapeAttr(redirectTo)}">
        <div class="gate-input-wrap">
          <input type="password" name="password" placeholder="passcode" autocomplete="current-password" autofocus required>
          <button type="submit" aria-label="Submit">&rarr;</button>
        </div>
      </form>
      <p class="gate-error" id="gateError"${error ? "" : " hidden"}>hmm, that’s not it. try again, or say hi if you’re stuck :)</p>
    </main>

    <div class="gate-teaser" aria-hidden="true">
      <div class="stack-card" style="--r:-4deg; --y:6px; --z:3;"><div class="stack-media stack-media--pink"><img src="/images/home/qm.png" alt=""></div><div class="stack-body"><h3>Queue Management</h3><p>How I led the design of a workforce management tool</p></div></div>
      <div class="stack-card" style="--r:3deg; --y:-8px; --z:2;"><div class="stack-media stack-media--yellow"><img src="/images/home/scanwell.png" alt=""></div><div class="stack-body"><h3>At-Home COVID-19 Test</h3><p>How our team shipped the first digitally read test</p></div></div>
      <div class="stack-card" style="--r:-3.5deg; --y:8px; --z:1;"><div class="stack-media stack-media--blue"><img src="/images/home/fax.png" alt=""></div><div class="stack-body"><h3>ML-enabled Fax Intake</h3><p>How I redesigned fax intake with AI</p></div></div>
    </div>
    <div class="gate-fade"></div>
  </div>

  <script>
    (function () {
      var overlay = document.getElementById('gateOverlay');
      var form = document.getElementById('gateForm');
      var input = form.querySelector('input[type="password"]');
      var errorEl = document.getElementById('gateError');
      var busy = false;
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Enter key submits (the arrow button is the secondary trigger).
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          if (typeof form.requestSubmit === 'function') form.requestSubmit();
          else form.submit();
        }
      });

      function fail() {
        busy = false;
        input.disabled = false;
        errorEl.hidden = false;
        input.classList.remove('gate-shake');
        void input.offsetWidth;
        input.classList.add('gate-shake');
        input.select();
      }

      function enter(target) {
        if (reduced) { location.replace(target); return; }
        document.body.classList.add('entering');
        var frame = document.createElement('iframe');
        frame.className = 'entry-frame';
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        frame.src = target;
        document.body.insertBefore(frame, overlay);
        var revealed = false;
        function reveal() {
          if (revealed) return;
          revealed = true;
          frame.classList.add('show');
          overlay.classList.add('out');
          // the site is in focus behind the heading; now let the heading hand off
          setTimeout(function () { document.querySelector('.gate-main h1').classList.add('handoff'); }, 1100);
          setTimeout(function () { location.replace(target); }, 1500);
        }
        frame.addEventListener('load', function () { setTimeout(reveal, 250); });
        setTimeout(reveal, 2500);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        busy = true;
        input.disabled = true;
        errorEl.hidden = true;
        fetch('${AUTH_PATH}', {
          method: 'POST',
          body: new FormData(form),
          headers: { 'X-Gate': '1' },
          credentials: 'same-origin'
        })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d && d.ok) enter(d.redirect || '/');
            else fail();
          })
          .catch(fail);
      });
    })();

    (function () {
      var glow = document.querySelector('.gate-glow');
      if (!glow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var HUE_PER_PX = 0.22;
      var targetX = null, targetY = null, currentX = 0, currentY = 0;
      var lastX = null, lastY = null, hue = 285, targetHue = 285, raf = null;

      function tick() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        hue += (targetHue - hue) * 0.05;
        glow.style.left = currentX + 'px';
        glow.style.top = currentY + 'px';
        glow.style.bottom = 'auto';
        glow.style.transform = 'translate(-50%, -50%)';
        glow.style.setProperty('--hue', hue.toFixed(1));
        var moving = Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5;
        var shifting = Math.abs(targetHue - hue) > 0.2;
        raf = (moving || shifting) ? requestAnimationFrame(tick) : null;
      }

      document.addEventListener('mousemove', function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (lastX !== null) {
          targetHue += Math.hypot(e.clientX - lastX, e.clientY - lastY) * HUE_PER_PX;
        }
        lastX = e.clientX;
        lastY = e.clientY;
        if (currentX === 0 && currentY === 0) {
          currentX = targetX;
          currentY = targetY;
        }
        if (!raf) raf = requestAnimationFrame(tick);
      });
    })();
  </script>
</body>
</html>`;
}
