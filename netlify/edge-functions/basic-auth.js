export default async (request, context) => {
  const username = Deno.env.get("SITE_USERNAME");
  const password = Deno.env.get("SITE_PASSWORD");

  // Not configured yet — let traffic through rather than locking everyone out silently.
  if (!username || !password) {
    return context.next();
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === username && pass === password) {
      return context.next();
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Kelsey Guo Portfolio"',
    },
  });
};
