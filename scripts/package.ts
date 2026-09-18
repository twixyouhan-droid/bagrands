/**
 * `bun run package` — builds both flavours and zips them for upload:
 *
 *   deploy/site/        multi-file build (dist/) — best for Netlify, Vercel,
 *                       Cloudflare Pages, GitHub Pages: lazy chunks, caching
 *   deploy/single/      one index.html + media/ — for hosts that take a
 *                       single HTML file or a plain folder upload
 *   deploy/bagrands-site.zip
 *   deploy/bagrands-single.zip
 *
 * README.md files copied from public/ are stripped from both.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const deploy = join(root, "deploy");

const run = (cmd: string[], env: Record<string, string> = {}) => {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: root, stdio: "inherit", env: { ...process.env, ...env }, shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const stripReadmes = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      stripReadmes(p);
      if (readdirSync(p).length === 0) rmSync(p, { recursive: true, force: true });
    } else if (/\.md$/i.test(name)) rmSync(p);
  }
};

rmSync(deploy, { recursive: true, force: true });
mkdirSync(deploy, { recursive: true });

run(["bun", "run", "build"]);
cpSync(join(root, "dist"), join(deploy, "site"), { recursive: true });
stripReadmes(join(deploy, "site"));

run(["bun", "scripts/single-file.ts"]);
cpSync(join(root, "single"), join(deploy, "single"), { recursive: true });

/* zip with python's stdlib — no extra dependency */
const zip = (folder: string, file: string) =>
  run([
    "python",
    "-c",
    `"import shutil,sys; shutil.make_archive(sys.argv[1], 'zip', sys.argv[2])"`,
    join(deploy, file.replace(/\.zip$/, "")),
    join(deploy, folder),
  ]);
zip("site", "bagrands-site.zip");
zip("single", "bagrands-single.zip");

const kb = (p: string) => `${(statSync(p).size / 1024).toFixed(0)} kB`;
console.log("\nready to upload:");
console.log(`  deploy/bagrands-site.zip    ${kb(join(deploy, "bagrands-site.zip"))}  (multi-file: Netlify / Vercel / Cloudflare / GitHub Pages)`);
console.log(`  deploy/bagrands-single.zip  ${kb(join(deploy, "bagrands-single.zip"))}  (one index.html + media/)`);
