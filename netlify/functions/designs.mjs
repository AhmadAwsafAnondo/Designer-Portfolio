import { getStore } from "@netlify/blobs";
import { requireAdmin, json } from "../lib/auth.mjs";

const KEY = "designs.json";
const store = () => getStore({ name: "portfolio", consistency: "strong" });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const imgPath = (v) => {
  const s = str(v, 300);
  if (/^\/(img|work)\/[A-Za-z0-9._-]+$/.test(s)) return s;
  // YouTube's own thumbnail can be used as the cover of a video
  if (/^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{6,20}\/(maxresdefault|sddefault|hqdefault|mqdefault)\.jpg$/.test(s)) return s;
  return "";
};
const url = (v) => {
  const s = str(v, 500);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};
const slug = (v) => str(v, 60).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const int = (v) => (Number.isInteger(v) && v > 0 && v <= 20000 ? v : 0);

// Categories shown as tabs on the site: [{ id, label, blurb }]
function cleanCategories(list) {
  if (!Array.isArray(list)) return null;
  const seen = new Set();
  const out = [];
  for (const c of list.slice(0, 30)) {
    const id = slug(c?.id);
    const label = str(c?.label, 40);
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, blurb: str(c?.blurb, 240) });
  }
  return out.length ? out : null;
}

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
      section: slug(d.section),
      video: url(d.video),
      link: url(d.link),
      w: int(d.w),
      h: int(d.h),
    };
  });
}

// GET /api/designs — public list (null until the admin saves for the first time)
// PUT /api/designs — admin only, replaces the whole list (and the category list, if sent)
export default async (req) => {
  if (req.method === "GET") {
    const data = await store().get(KEY, { type: "json" });
    return json({ designs: data?.designs ?? null, categories: data?.categories ?? null, updatedAt: data?.updatedAt ?? null });
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
    let categories = cleanCategories(body?.categories);
    if (!categories) categories = (await store().get(KEY, { type: "json" }))?.categories ?? null;
    if (categories) {
      // every design must point at a category that exists
      for (const d of designs) {
        if (d.section && !categories.some((c) => c.id === d.section)) {
          categories.push({ id: d.section, label: d.section.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), blurb: "" });
        }
      }
    }
    const updatedAt = new Date().toISOString();
    await store().setJSON(KEY, { designs, categories, updatedAt });
    return json({ designs, categories, updatedAt });
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/designs" };
