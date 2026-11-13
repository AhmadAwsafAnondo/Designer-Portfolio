# Portfolio admin

Manage the designs in the Work section at **/admin** (e.g. https://ahmadawsafanondo.netlify.app/admin/).

## One-time setup
1. Netlify → your site → **Project configuration → Environment variables → Add a variable**
   - Key: `ADMIN_PASSWORD`
   - Value: a long password only you know
   - Scopes: include **Functions**
2. Push these files to the GitHub repo. Netlify redeploys automatically.
   (If you add or change the password later, trigger a new deploy so it takes effect.)

## Categories
- Every design belongs to one category (Graphic Design, Social Media Posters, UI/UX Design,
  Thumbnail Design, Video Editing, Logo & Branding). Pick it in step 1 of the "Add design" form.
- Each category is a tab on the site. The **All** tab shows every category as its own slideshow.
  Categories with no designs are hidden from visitors until you upload to them.
- **Manage categories** (in the admin, next to the category filters) lets you rename, reorder,
  describe, add or delete categories. You can also add one straight from the "Add design" form.
- Video Editing: paste a YouTube, Vimeo, Google Drive or .mp4 link. With a YouTube link the image
  is optional, because the video's own thumbnail is used. Videos play inside the site's viewer.
- The starting list lives in `assets/categories.js`. Once you save categories in the admin, the
  saved list is used instead.

## How it works
- `admin/index.html` — the admin page (login, category picker, add / edit / delete, reorder, featured star, categories).
- `assets/categories.js` — default categories and helpers shared by the site and the admin.
- `netlify/functions/` — small API: `/api/login`, `/api/designs`, `/api/upload`, `/img/<file>`.
- Uploaded images and the design list are stored in **Netlify Blobs** (Netlify → Data & Storage → Blobs).
- `data/designs.json` + `work/` are the starting 7 designs. After your first save in the admin,
  the site shows the list stored in Blobs instead.
- Images are resized in your browser to max 2160 px if they are bigger than 3.6 MB, and a 640 px
  thumbnail (same shape as the image) is made for the hero strip. The palette is picked from the image automatically.

Note: deploy previews share the same storage as the live site, so changes made in the admin on a
preview URL also change the live site.
