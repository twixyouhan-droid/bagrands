/**
 * `bun run build:single`.
 *
 * Runs the Vite build in single-file mode, then folds the stylesheet and the one
 * script into index.html, so the page is a single self-contained file.
 * Fonts and small images were already base64-inlined by Vite
 * (assetsInlineLimit). What stays beside index.html is only what has to:
 * the media/ folder (video, avatar, still) plus favicon and manifest.
 *
 * Also strips README.md files copied from public/ so the upload is clean.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const out = join(root, "single");
const htmlPath = join(out, "index.html");

/* 1. the Vite build in single-file mode (see vite.config.ts) */
rmSync(out, { recursive: true, force: true });
/* --mode single: vite.config.ts inlines everything, and the app drops the
   glTF path (its Draco decoder alone is 1.7 MB). */
const build = spawnSync("bun", ["x", "vite", "build", "--mode", "single"], { cwd: root, stdio: "inherit", shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

/* 2. fold the stylesheet and script into the page */
let html = readFileSync(htmlPath, "utf8");

/* <link rel="stylesheet" href="./assets/x.css"> → <style>…</style> */
html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="\.?\/?(assets\/[^"]+\.css)"[^>]*>/g, (_m, file) => {
  const css = readFileSync(join(out, file), "utf8");
  return `<style>${css}</style>`;
});

/* <script type="module" crossorigin src="./assets/x.js"></script> → inline */
html = html.replace(/<script[^>]+type="module"[^>]+src="\.?\/?(assets\/[^"]+\.js)"[^>]*><\/script>/g, (_m, file) => {
  const js = readFileSync(join(out, file), "utf8");
  /* A literal "</script>" inside the bundle would end the tag early. */
  return `<script type="module">${js.replace(/<\/script>/g, "<\\/script>")}</script>`;
});

/* modulepreload hints point at files that no longer exist */
html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>\s*/g, "");

writeFileSync(htmlPath, html);

/* Nothing in assets/ is referenced any more. */
rmSync(join(out, "assets"), { recursive: true, force: true });

/* READMEs from public/ are for the repo, not the site. */
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.md$/i.test(name)) rmSync(p);
  }
  /* drop folders left empty (models/, textures/) */
  if (readdirSync(dir).length === 0 && dir !== out) rmSync(dir, { recursive: true, force: true });
};
walk(out);

const size = (statSync(htmlPath).size / 1024).toFixed(0);
const files: string[] = [];
const list = (dir: string, prefix = "") => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) list(p, `${prefix}${name}/`);
    else files.push(`${prefix}${name} (${(statSync(p).size / 1024).toFixed(0)} kB)`);
  }
};
list(out);
console.log(`single/index.html: ${size} kB, everything inlined.`);
console.log(`single/ contains:\n  ${files.join("\n  ")}`);
if (!existsSync(join(out, "media"))) console.warn("warning: media/ missing — the video and avatar won't load");
