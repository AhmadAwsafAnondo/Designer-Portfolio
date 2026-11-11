import { getStore } from "@netlify/blobs";

const KEY_RE = /^[a-z0-9]+-[a-z0-9]+(-t)?\.(jpg|png|webp|gif|avif)$/;

// GET /img/<key> — serves an uploaded design image. Keys are unique, so it can be cached forever.
export default async (req, context) => {
  const key = context.params.key;
  if (!KEY_RE.test(key || "")) return new Response("Not found", { status: 404 });
  const entry = await getStore("portfolio-images").getWithMetadata(key, { type: "arrayBuffer" });
  if (entry === null) return new Response("Not found", { status: 404 });
  return new Response(entry.data, {
    headers: {
      "content-type": entry.metadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "netlify-cdn-cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/img/:key", method: "GET" };
