/**
 * Generates client/public/sitemap.xml (and dist/public/sitemap.xml if built)
 * from the shared route SEO config plus blog post slugs.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://chalkpicks.live";

async function loadTsModule(entry) {
  const outdir = path.join(ROOT, "dist");
  fs.mkdirSync(outdir, { recursive: true });
  const outfile = path.join(outdir, `.sitemap-tmp-${path.basename(entry).replace(/\W/g, "_")}.mjs`);
  await build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const mod = await import(`file://${outfile}?t=${Date.now()}`);
  fs.unlinkSync(outfile);
  return mod;
}

const { routeSEO } = await loadTsModule("shared/seo-routes.ts");
const { blogPosts } = await loadTsModule("client/src/data/blog-posts.ts");

const today = new Date().toISOString().split("T")[0];

const urls = [];

for (const r of routeSEO) {
  if (!r.sitemap) continue;
  const loc = r.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${r.path}`;
  urls.push(
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq ?? "weekly"}</changefreq>\n    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>\n  </url>`
  );
}

for (const p of blogPosts) {
  urls.push(
    `  <url>\n    <loc>${SITE_URL}/blog/${p.slug}</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
  );
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

const targets = [
  path.join(ROOT, "client", "public", "sitemap.xml"),
  path.join(ROOT, "dist", "public", "sitemap.xml"),
];

for (const t of targets) {
  if (fs.existsSync(path.dirname(t))) {
    fs.writeFileSync(t, xml);
    console.log(`Wrote ${t} (${urls.length} URLs)`);
  }
}
