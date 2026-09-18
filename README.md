# Twix — Life is Pay To Win

A cinematic, black-and-white personal profile / link-in-bio site: immersive intro, layered
parallax background, custom cursor, tasteful WebGL depth, glass profile card, Discord
presence, music player, and an about / projects / stats second scroll.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + three.js + Motion (Framer) + Lucide**.

---

## Run it

```bash
bun install      # or npm install / pnpm install
bun run dev      # http://127.0.0.1:5290
bun run build    # production build → dist/
bun run preview  # serve the production build
```

Node isn't required if you use [Bun](https://bun.sh); npm/pnpm/yarn work too.

## 🚀 Deploy (free hosting)

```bash
bun run package
```

That builds everything and leaves two ready-to-upload bundles in `deploy/`:

| Bundle | What's inside | Upload it to |
| --- | --- | --- |
| `deploy/bagrands-site.zip` | `index.html` + `assets/` (lazy chunks, cache-friendly) + `media/` | **Netlify Drop**, **Vercel**, **Cloudflare Pages**, **GitHub Pages**, **Surge** — anything that hosts a folder |
| `deploy/bagrands-single.zip` | **one `index.html`** with all JS, CSS and fonts inlined, + `media/` | hosts that want a single HTML file (tiiny.host, Neocities, cPanel `public_html`, a free sub-domain) |

Both use **relative URLs**, so they work at a domain root *or* inside a sub-folder.
Only `media/` (the video, avatar and still) stays as separate files — inlining a 3 MB
video into HTML would push most free hosts' size limits.

- **Netlify Drop / Vercel / Cloudflare**: drag the *unzipped* `deploy/site` folder (or
  the zip, where accepted) onto the uploader. No build settings needed — it's static.
- **GitHub Pages**: push the contents of `deploy/site` to a `gh-pages` branch, or to
  `/docs` on `main` and pick it in *Settings → Pages*.
- **Single-file hosts**: upload `index.html` **and** the `media/` folder together.

`bun run build` alone gives you `dist/` (the multi-file build); `bun run build:single`
gives you `single/`. The single build leaves the glTF model loader out (its decoder is
1.7 MB and only matters if you set `model.type = "gltf"`).

After deploying, put your real domain in `seo.url` in `src/config/profile.ts` and in the
`og:` / `canonical` tags in `index.html`, then rebuild.

---

## ✏️ Everything you edit lives in one file

> **`src/config/profile.ts`**

| What | Where |
| --- | --- |
| Name, handle, bio, location, avatar, badges | `profile` |
| Rotating typewriter lines | `profile.typewriterTexts` |
| Discord / Spotify / TikTok / Instagram / YouTube / X / Telegram / GitHub / Snapchat / Twitch / Steam / Roblox links | `socials` |
| Discord live presence + static fallback | `discord` |
| Spotify embed (any playlist / album / track link), local tracks, volume, "play on enter" | `audio` |
| Background image/video, fog, glow, particle count, parallax, starfield | `background` |
| Saturn — size, tilt, sun, shadows, textures — or your own `.glb` | `model` |
| 3D, cursor, tilt, grain, scanlines, spotlight, view counter | `effects` |
| Colour themes + default theme | `themes`, `defaultTheme` |
| Stats counters | `stats` |
| About copy, interests, games, music, skills, current projects | `about` |
| Project cards | `projects` |
| Section titles / on-off switches | `sections` |
| Page title, description, canonical URL | `seo` |
| Easter eggs | `easterEggs` |

### The song

`audio.spotifyEmbed` takes any Spotify link (track, playlist, album, artist). It renders the
official Spotify embed inside the card, driven by Spotify's iFrame API so it **starts on
its own** right after the visitor clicks "enter" (`audio.spotifyAutoplay`). Signed-out
visitors hear Spotify's 30-second preview; anyone signed in to Spotify gets the full track
— that limit is Spotify's, not the site's. If the API script is blocked, the plain embed is
shown instead (works, just no autoplay).

For the full song for everyone with no Spotify account, drop an mp3 in `public/media/` and
list it in `audio.tracks` — the local player then takes over (autoplay on enter, volume
dock, seek bar) and the embed is not shown.

### Copy-to-clipboard links

A social entry with `copy: "your.username"` copies that text on click instead of opening
a URL — for platforms with no profile link, like Discord.

### Replace the placeholders

Every link is a placeholder like `"<<< YOUR DISCORD URL >>>"`. Until you replace one, that
icon is rendered in a "not configured" state — clicking it tells you exactly which line to
edit instead of opening a dead link. Nothing breaks in the meantime.

### Add your media

Drop files into `public/media/` and reference them with a leading slash:

```
public/media/avatar.jpg        →  profile.avatar: "/media/avatar.jpg"
public/media/track.mp3         →  audio.tracks[0].src: "/media/track.mp3"
public/media/background.mp4    →  background.video.src: "/media/background.mp4"
```

`profile.avatarFocus` (e.g. `"47% 6%"`) nudges the crop of the avatar inside the circle.
MP3, OGG and WAV all work. Audio never autoplays before the visitor clicks — it starts on
the "click to enter" gesture.

The video layer is **on** and clearly visible: `background.video.src` points at
`public/media/background.mp4` (the clip that shipped with this project). It is desaturated to
stay in the black-and-white world, shown at full exposure, and finished with a graded scrim
rather than a blur — so the movement reads, but the glass card still sits on top of it.
Three knobs control how strongly it shows: `opacity` (how much of it you see),
`brightness` (its exposure), and `blur` (0 keeps it sharp). `background.video.poster` paints
a still frame instantly while the file buffers, and `prefers-reduced-motion` visitors never
get the video. Set `enabled: false` to switch back to the still atmosphere plate only.

`desktopOnly` is `false`, so phones play the clip too — the export is 2.8 MB, and the file
also carries the music, so a phone downloads it whether or not the video layer runs. Set it
to `true` if you'd rather phones show the still frame only.

### Real Discord presence (optional, no tokens)

The Discord card is powered by [Lanyard](https://github.com/Phineas/lanyard), a public API:

1. Join `discord.gg/lanyard` once so your account is tracked.
2. Put your numeric Discord user id in `discord.userId`.

The card then shows your real avatar, status, custom status and current activity, and if you
are listening to Spotify the music widget switches to a live view automatically. If the id is
empty or the API is unreachable, the config values are shown instead — no tokens, no keys.

---

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Enter` / `Space` | Enter the site from the intro |
| `T` | Cycle the colour theme |
| `Space` | Play / pause music (when nothing is focused) |
| `M` | Mute / unmute |
| `Konami code` | …something hidden |

There are also two click-based secrets. Try the avatar a few times.

---

## 🪐 Saturn

The centrepiece behind the card is a real three.js Saturn: a textured sphere, a flat
alpha-mapped ring system with the actual ring proportions (C, B, Cassini division, A,
Encke and Keeler gaps, F ring), a distant sun that casts the planet's shadow across the
rings — and the rings' shadow, gaps included, back onto the planet — plus a Fresnel
atmosphere on the sunlit limb. It spins slowly, drifts a little with the mouse, and the
sun swings a few degrees as you move so the shadow slides over the rings.

Everything about it lives in `model` in `src/config/profile.ts`: size, tilt, pitch,
spin speed, mouse strength, position, sun direction/colour/intensity, shadows, and
`ringGlow`.

### Textures

The site ships with **procedural textures** generated at startup
(`src/lib/saturn-textures.ts`), so it looks right with zero assets. To go photo-real:

1. Get a Saturn colour map (2:1 equirectangular JPEG, 2K–8K) and a ring strip (PNG with
   alpha, x = inner → outer radius). Solar System Scope's CC BY 4.0 set works out of the
   box.
2. Drop them in **`public/textures/saturn/`** (there's a README there with the exact
   specs).
3. Point the config at them:

   ```ts
   textures: {
     planet: "/textures/saturn/saturn.jpg",
     ring:   "/textures/saturn/saturn_ring.png",
   },
   ```

The procedural textures mount first, and the real ones are swapped in when they load —
if a file 404s, the procedural one simply stays. Both get `SRGBColorSpace` and 8×
anisotropy; the ring strip is applied as `map` + `alphaMap` + `emissiveMap` over a
`RingGeometry` whose UVs are rewritten to run radially.

### Camera

`PerspectiveCamera(42°)` looking at the origin from `z = 7.6` (16:9), `8.6` (squarer),
`10.4` (portrait) — narrower screens push the camera back so the ring system stays in
frame. The planet is positioned as a fraction of the *visible* half-width/height
(`model.anchor`), so it lands in the same place relative to the card at any resolution.
The camera itself eases ±0.3 units with the mouse for parallax; on portrait screens the
planet moves above the card and shrinks to 62 %.

### Lighting

Space lighting is one hard light and almost nothing else:

| Light | Role |
| --- | --- |
| `DirectionalLight` (`model.sun`) | The sun. Warm white, intensity 3.4, 16 units from the planet along `sun.direction`. Casts shadows with a 2048² PCF-soft map (1024² on low quality); the orthographic shadow camera is sized to the ring diameter and re-aimed at the planet every frame. |
| `AmbientLight` `#5a6a8a` × 0.22 | A whisper of blue starlight so the night side reads as *night*, not as a hole. |
| Ring emissive (`model.ringGlow`) | Not a light — a texture-shaped self-illumination that fakes the backscatter of ice, which is why real rings look brighter than a flat lit surface. The planet's shadow still darkens them. |
| Fresnel atmosphere shells | Two additive spheres (a tight rim and a wider haze) whose glow is masked by `dot(normal, sunDir)` so only the sunlit limb glows. |

Rendering uses ACES filmic tone mapping at exposure 1.0, `alphaTest` on the rings so
their shadow keeps the gaps, and `normalBias` 0.03 to avoid acne on the ring plane.

### Your own model instead

Set `model.type = "gltf"` and `model.src = "/models/yourfile.glb"` (see
`public/models/README.md`). `GLTFLoader` is its own lazy chunk, the model is centred and
normalised to a 1-unit bounding sphere, a studio `RoomEnvironment` is applied for
reflections, and Saturn stays on screen as the fallback if the load fails.

## Accessibility & performance notes

- `prefers-reduced-motion` disables the WebGL scene, the snow, parallax, tilt and the intro animation.
- Custom cursor, magnetic icons and tilt only run on real pointer devices.
- Phones get a dedicated layout: fewer particles, lower WebGL quality, no cursor, bigger tap targets, and the same 2.8 MB background export as desktop.
- The three.js scene is a **lazy chunk** (~132 kB gzip) and only loads after you enter, on capable devices.
- **One `requestAnimationFrame` for the whole site** (`lib/ticker.ts`): backdrop parallax, cursor, card spotlight, starfield and the WebGL scene all subscribe to a single frame. It pauses when the tab is hidden, and everything animates on GPU-friendly transforms.
- 3D tilt / glare / shadows are CSS-variable driven (`lib/tilt.ts`) — the hook writes five vars, the compositor does the rest, and the per-element loop only runs while hovered.
- The starfield pre-renders each glow to an offscreen sprite once, so a frame is ~260 `drawImage` calls and no gradients.
- Below-the-fold sections use `content-visibility: auto`, so they cost nothing until scrolled near.
- The WebGL shadow map is rendered **on demand** (only when the sun or planet moves a visible amount), the canvas is capped at 1.5× DPR, and the scene is ~7 draw calls / ~21k triangles per frame.
- **Frame rate**: add `?fps` to the URL for a live readout (fps, worst frame time, active loops). A browser can only paint once per display refresh, so the ceiling is your monitor — 60, 120, 144 or 240 Hz. The goal is holding that ceiling, and the readout tells you whether it does.
- Semantic landmarks, focus-visible rings, aria labels, tooltips on hover *and* focus.

## Media weight

`public/media/background.mp4` is the web export: **720p, 30 fps, 1.18 Mbps, 2.8 MB** for the
20 s loop. It used to be 14.75 MB — 1080p at 60 fps and 5.7 Mbps. Halving the frame rate costs
nothing on a layer that is desaturated, shown at 62% opacity behind frosted glass and finished
with a scrim. Measured against the master: **SSIM 0.98, PSNR 42.7 dB**, which is past the point
where a difference is visible in that treatment.

To re-export after a fresh cut:

```bash
ffmpeg -i "Madison Beer - Edit 13.mp4" \
  -vf "scale=1280:-2,fps=30" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 112k -ac 2 \
  -movflags +faststart public/media/background.mp4
```

Do **not** add `-an`. The video layer is muted, but the music player uses this same file as its
audio source (`audio.tracks[0].src`), so dropping the audio track silences the whole site.

Check an export against the master before shipping it:

```bash
ffmpeg -i public/media/background.mp4 -i "Madison Beer - Edit 13.mp4" \
  -lavfi "[0:v]scale=1920:1080,format=yuv420p[a];[1:v]fps=30,format=yuv420p[b];[a][b]ssim" \
  -f null -
```

Convention: keep the **master clip** you edit in the project root and the **web export** in
`public/media/`. Nothing is lost if you re-cut it later.

## Structure

```
src/
  config/profile.ts        ← the file you edit
  lib/                     hooks, pointer store, ticker (shared rAF), tilt, audio, Lanyard, toasts
  icons/brands.tsx         brand glyph registry (simple-icons)
  components/              Intro, Backdrop, StarField, Scene3D, Cursor, ProfileCard, …
  lib/saturn-textures.ts   procedural planet + ring textures (fallback)
public/textures/saturn/    optional real Saturn textures (see README there)
public/models/             optional .glb if you swap Saturn for your own model
  index.css                design tokens + effects + keyframes
```

Deployed anywhere static (Vercel, Netlify, Cloudflare Pages, GitHub Pages): build command
`bun run build`, output directory `dist`.
