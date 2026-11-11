import { getStore } from "@netlify/blobs";
import { requireAdmin, json } from "../lib/auth.mjs";

const KEY = "designs.json";
const store = () => getStore({ name: "portfolio", consistency: "strong" });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const imgPath = (v) => {
  const s = str(v, 300);
  return /^\/(img|work)\/[A-Za-z0-9._-]+$/.test(s) ? s : "";
};

function clean(list) {
  if (!Array.isArray(list)) throw new Error("designs must be a list");
  if (list.length > 500) throw new Error("Too many designs (max 500)");
  const seen = new Set();
  let featured = false;
  return list.map((d, i) => {
    if (!d || typeof d !== "object") throw new Error(`Design ${i + 1} is not valid`);
    const title = str(d.title, 120);
    const img = imgPath(d.img);
    if (!title) throw new Error(`Design ${i + 1} needs a title`);
    if (!img) throw new Error(`"${title}" needs an image`);
    let id = str(d.id, 80).replace(/[^A-Za-z0-9_-]/g, "") || `d-${Date.now().toString(36)}-${i}`;
    while (seen.has(id)) id += "-x";
    seen.add(id);
    const isFeat = !!d.featured && !featured;
    if (isFeat) featured = true;
    return {
      id,
      title,
      short: str(d.short, 40),
      group: str(d.group, 40) || "Other",
      cat: str(d.cat, 60),
      desc: str(d.desc, 1200),
      alt: str(d.alt, 300),
      img,
      thumb: imgPath(d.thumb),
      sw: (Array.isArray(d.sw) ? d.sw : [])
        .map((c) => str(c, 9).toUpperCase())
        .filter((c) => /^#[0-9A-F]{3}([0-9A-F]{3})?$/.test(c))
        .slice(0, 6),
      format: str(d.format, 120),
      channel: str(d.channel, 120),
      type: str(d.type, 120),
      featured: isFeat,
    };
  });
}

// GET /api/designs — public list (null until the admin saves for the first time)
// PUT /api/designs — admin only, replaces the whole list
export default async (req) => {
  if (req.method === "GET") {
    const data = await store().get(KEY, { type: "json" });
    return json({ designs: data?.designs ?? null, updatedAt: data?.updatedAt ?? null });
  }
  if (req.method === "PUT") {
    const denied = requireAdmin(req);
    if (denied) return denied;
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body must be JSON" }, 400);
    }
    let designs;
    try {
      designs = clean(body?.designs);
    } catch (e) {
      return json({ error: e.message }, 400);
    }
    const updatedAt = new Date().toISOString();
    await store().setJSON(KEY, { designs, updatedAt });
    return json({ designs, updatedAt });
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/designs" };
