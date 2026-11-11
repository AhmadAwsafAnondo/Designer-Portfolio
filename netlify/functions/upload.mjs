import { getStore } from "@netlify/blobs";
import { requireAdmin, json } from "../lib/auth.mjs";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX = 4 * 1024 * 1024; // function payloads are capped around 4.5 MB of binary
const images = () => getStore("portfolio-images");
const KEY_RE = /^[a-z0-9]+-[a-z0-9]+(-t)?\.(jpg|png|webp|gif|avif)$/;

// POST /api/upload   (multipart: file, optional thumb) -> { img, thumb }
// DELETE /api/upload?key=<key>[&key=<key>]           -> { deleted }
export default async (req) => {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (req.method === "POST") {
    let form;
    try {
      form = await req.formData();
    } catch {
      return json({ error: "Send the image as multipart form data" }, 400);
    }
    const file = form.get("file");
    const thumb = form.get("thumb");
    if (!file || typeof file === "string") return json({ error: "No image received" }, 400);
    const ext = TYPES[file.type];
    if (!ext) return json({ error: "Use a JPG, PNG, WebP, GIF or AVIF image" }, 415);
    if (file.size + (thumb?.size || 0) > MAX) return json({ error: "Image is too large (max 4 MB)" }, 413);

    const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `${base}.${ext}`;
    await images().set(key, await file.arrayBuffer(), { metadata: { contentType: file.type, name: String(file.name || "").slice(0, 200) } });
    let thumbPath = "";
    if (thumb && typeof thumb !== "string" && TYPES[thumb.type]) {
      const tkey = `${base}-t.${TYPES[thumb.type]}`;
      await images().set(tkey, await thumb.arrayBuffer(), { metadata: { contentType: thumb.type } });
      thumbPath = `/img/${tkey}`;
    }
    return json({ img: `/img/${key}`, thumb: thumbPath || `/img/${key}` }, 201);
  }

  if (req.method === "DELETE") {
    const keys = new URL(req.url).searchParams.getAll("key").filter((k) => KEY_RE.test(k));
    await Promise.all(keys.map((k) => images().delete(k)));
    return json({ deleted: keys });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/upload" };
