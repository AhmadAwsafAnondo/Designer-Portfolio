# Portfolio admin

Manage the designs in the Work section at **/admin** (e.g. https://ahmadawsafanondo.netlify.app/admin/).

## One-time setup
1. Netlify → your site → **Project configuration → Environment variables → Add a variable**
   - Key: `ADMIN_PASSWORD`
   - Value: a long password only you know
   - Scopes: include **Functions**
2. Push these files to the GitHub repo. Netlify redeploys automatically.
   (If you add or change the password later, trigger a new deploy so it takes effect.)

## How it works
- `admin/index.html` — the admin page (login, add / edit / delete, reorder, featured star).
- `netlify/functions/` — small API: `/api/login`, `/api/designs`, `/api/upload`, `/img/<file>`.
- Uploaded images and the design list are stored in **Netlify Blobs** (Netlify → Data & Storage → Blobs).
- `data/designs.json` + `work/` are the starting 7 designs. After your first save in the admin,
  the site shows the list stored in Blobs instead.
- Images are resized in your browser to max 2160 px if they are bigger than 3.6 MB, and a 480 px
  thumbnail is made for the hero strip. The palette is picked from the image automatically.

Note: deploy previews share the same storage as the live site, so changes made in the admin on a
preview URL also change the live site.
