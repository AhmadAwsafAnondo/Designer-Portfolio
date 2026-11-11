import { createHash, timingSafeEqual } from "node:crypto";

const sha = (s) => createHash("sha256").update(String(s)).digest();

// Returns null when the request carries the admin password, otherwise an error Response.
export function requireAdmin(req) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected) {
    return json({ error: "ADMIN_PASSWORD is not set in Netlify environment variables." }, 500);
  }
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!given || !timingSafeEqual(sha(given), sha(expected))) {
    return json({ error: "Wrong password." }, 401);
  }
  return null;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
