/* Shared by the portfolio (/) and the admin (/admin/).
   These are the starting categories. In the admin you can rename them, reorder them
   and add new ones; your edited list is saved with your designs and replaces this one. */
(function () {
  const PF = (window.PF = window.PF || {});

  PF.DEFAULT_CATEGORIES = [
    { id: "graphic",   label: "Graphic Design",       blurb: "Posters, key visuals and print pieces built around one strong idea." },
    { id: "social",    label: "Social Media Posters", blurb: "Feed posts and ads made to stop the scroll and sell the product." },
    { id: "uiux",      label: "UI/UX & Web Design",   blurb: "Websites, apps and interfaces, designed in Figma and built for real users." },
    { id: "thumbnail", label: "Thumbnail Design",     blurb: "Bold, readable thumbnails that earn the click." },
    { id: "video",     label: "Video Editing",        blurb: "Edits, reels and short-form video." },
    { id: "branding",  label: "Logo & Branding",      blurb: "Logos, palettes and identity systems." },
  ];

  // Suggested details for a new design in each category (used by the admin form)
  PF.CATEGORY_DEFAULTS = {
    social:    { format: "1080 × 1080 px, square feed post", channel: "Instagram & Facebook", type: "Concept ad" },
    graphic:   { format: "", channel: "", type: "Poster" },
    uiux:      { format: "Web & mobile", channel: "Figma", type: "UI/UX design" },
    thumbnail: { format: "1280 × 720 px, 16:9", channel: "YouTube", type: "Video thumbnail" },
    video:     { format: "1920 × 1080, 16:9", channel: "YouTube", type: "Video edit" },
    branding:  { format: "", channel: "", type: "Brand identity" },
  };

  PF.slug = (s) =>
    String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

  // Designs saved before categories existed get one from their title
  PF.sectionOf = (d) => {
    if (d && d.section) return d.section;
    const t = String((d && d.title) || "");
    if (d && d.video) return "video";
    if (/thumbnail/i.test(t)) return "thumbnail";
    if (/poster/i.test(t)) return "graphic";
    return "social";
  };

  // The category list to use: the saved one (or the defaults), plus any category a design points at
  PF.categories = (saved, designs) => {
    const src = Array.isArray(saved) && saved.length ? saved : PF.DEFAULT_CATEGORIES;
    const out = src.filter((c) => c && c.id && c.label).map((c) => ({ id: c.id, label: c.label, blurb: c.blurb || "" }));
    // the old default name for UI/UX became "UI/UX & Web Design"
    out.forEach((c) => { if (c.id === "uiux" && c.label === "UI/UX Design") { c.label = "UI/UX & Web Design"; if (/^Interfaces, user flows and landing pages/.test(c.blurb)) c.blurb = PF.DEFAULT_CATEGORIES[2].blurb; } });
    (designs || []).forEach((d) => {
      const id = PF.sectionOf(d);
      if (!out.some((c) => c.id === id)) {
        const def = PF.DEFAULT_CATEGORIES.find((c) => c.id === id);
        out.push(def ? { ...def } : { id, label: id.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), blurb: "" });
      }
    });
    return out;
  };

  // Understand a video link: YouTube, Vimeo, Google Drive or a direct video file
  PF.video = (url) => {
    if (!url) return null;
    let u;
    try { u = new URL(url); } catch { return null; }
    const h = u.hostname.replace(/^(www|m)\./, "");
    let id = null, vertical = false;
    if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (h === "youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com") {
      const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]+)/);
      id = u.searchParams.get("v") || (m && m[2]);
      vertical = !!m && m[1] === "shorts";
    }
    if (id && /^[\w-]{6,20}$/.test(id)) {
      return {
        kind: "youtube", id, vertical,
        embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
        cover: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      };
    }
    if (h === "vimeo.com" || h === "player.vimeo.com") {
      const m = u.pathname.match(/(?:^|\/)(\d{5,})/);
      if (m) return { kind: "vimeo", embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1` };
    }
    if (h === "drive.google.com") {
      const m = u.pathname.match(/\/file\/d\/([\w-]+)/) || [null, u.searchParams.get("id")];
      if (m && m[1]) return { kind: "drive", embed: `https://drive.google.com/file/d/${m[1]}/preview` };
    }
    if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return { kind: "file", src: u.href };
    return { kind: "link", href: u.href };
  };

  // Projects shipped in /data/bundled.json show up unless the saved list already has them
  // or you deleted them in the admin (their id is then in "retired")
  PF.mergeBundled = (designs, bundled, retired) => {
    const have = new Set((designs || []).map((d) => d.id));
    const gone = new Set(retired || []);
    const add = (bundled || []).filter((b) => b && b.id && !have.has(b.id) && !gone.has(b.id));
    if (!add.length) return designs || [];
    const list = (designs || []).slice();
    const at = list.length && list[0].featured ? 1 : 0;
    list.splice(at, 0, ...add);
    return list;
  };
  PF.screens = (d) => [{ img: d.img, w: d.w, h: d.h, caption: "" }, ...(Array.isArray(d.gallery) ? d.gallery : [])].filter((s) => s && s.img);

  PF.ratio = (d) => (d && d.w > 0 && d.h > 0 ? d.w / d.h : d && d.video ? 16 / 9 : 1);
})();
