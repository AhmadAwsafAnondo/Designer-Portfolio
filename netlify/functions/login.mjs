import { requireAdmin, json } from "../lib/auth.mjs";

// POST /api/login — checks the admin password. Rate limited to slow down guessing.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const denied = requireAdmin(req);
  if (denied) return denied;
  return json({ ok: true });
};

export const config = {
  path: "/api/login",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
