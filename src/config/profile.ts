/**
 * ============================================================================
 *  TWIX — CENTRAL CONFIG
 * ============================================================================
 *  This is the ONLY file you need to touch for everyday edits.
 *  Change the name, bio, links, music, projects… everything below.
 *
 *  Anything wrapped in  <<<  >>>  is a placeholder you should replace.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * 1. IDENTITY
 * ------------------------------------------------------------------------ */
export const profile = {
  /** Big display name shown under the avatar. */
  name: "Twix",
  /** Lowercase handle, shown as @handle in a few places. */
  username: "Twix",

  /** Short one-line bio under the typewriter text. */
  bio: "just a guy building his own world.",

  /** Small location line. Set to "" to hide it. */
  location: "Mystic Falls",

  /** Avatar (square works best). Drop your own file in public/media/. */
  avatar: "media/avatar.jpg",
  /** Focus point of the avatar crop — tuned for the anime portrait. */
  avatarFocus: "50% 18%",

  /** Rotating typewriter lines. Add / remove as many as you like. */
  typewriterTexts: [
    "Life is Pay To Win",
    "stay mysterious.",
    "offline but watching.",
    "welcome to my world.",
    "no rules.",
  ],
  /** Speed of the typewriter in ms per character. */
  typewriterSpeed: 55,

  /** Small pill badges next to the name (leave [] for none). */
  badges: [],

  /** Shown at the very bottom of the page. */
  footerNote: "© 2026 Twix — Life is Pay To Win",
} as const;

/* ---------------------------------------------------------------------------
 * 2. SOCIAL LINKS
 * ------------------------------------------------------------------------ */
/** Available icon families (see src/icons/brands.tsx). "custom" = generic link icon. */
export type Brand =
  | "discord"
  | "spotify"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "x"
  | "telegram"
  | "github"
  | "snapchat"
  | "twitch"
  | "steam"
  | "roblox"
  | "riot"
  | "soundcloud"
  | "tidal"
  | "custom";

export interface SocialLink {
  /** Tooltip label. */
  name: string;
  /** Which brand icon to draw. */
  brand: Brand;
  /** Where the icon points. Replace every <<< placeholder >>> with your URL. */
  url: string;
  /** Your handle — shown in the tooltip. Optional. */
  handle?: string;
  /** Glow color on hover. Optional, falls back to the brand color. */
  color?: string;
  /**
   * Copy this text to the clipboard instead of opening `url` — for platforms
   * with no profile link, like a Discord username. `url` is ignored when set.
   */
  copy?: string;
}

export const socials: SocialLink[] = [
  /* Discord and Riot have no profile URL — clicking copies the username instead. */
  { name: "Discord", brand: "discord", url: "", copy: "dev.top.", handle: "dev.top.", color: "#5865F2" },
  {
    name: "Spotify",
    brand: "spotify",
    url: "https://open.spotify.com/playlist/5nGbtwRSIfidFfp8DWzA6B",
    handle: "playlist",
    color: "#1DB954",
  },
  {
    name: "Instagram",
    brand: "instagram",
    url: "https://www.instagram.com/taher.top1?stkn=OTJ6M3lqZXBoejNw&utm_source=qr",
    handle: "@taher.top1",
    color: "#E1306C",
  },
  { name: "YouTube", brand: "youtube", url: "<<< YOUR YOUTUBE URL >>>", handle: "@twix", color: "#FF0033" },
  { name: "Steam", brand: "steam", url: "https://steamcommunity.com/profiles/76561198779543168/", handle: "twix", color: "#66C0F4" },
  /* Roblox resolves a username to the profile page itself. */
  {
    name: "Roblox",
    brand: "roblox",
    url: "https://www.roblox.com/users/profile?username=Master23451",
    handle: "Master23451",
    color: "#ffffff",
  },
  { name: "Riot Games", brand: "riot", url: "", copy: "Twix#300HZ", handle: "Twix#300HZ", color: "#D13639" },
  /*
    Removed on request — add back any time:
    { name: "Snapchat", brand: "snapchat", url: "<<< YOUR SNAPCHAT URL >>>", handle: "twix", color: "#FFFC00" },
    { name: "Twitch", brand: "twitch", url: "<<< YOUR TWITCH URL >>>", handle: "twix", color: "#9146FF" },
    { name: "TikTok", brand: "tiktok", url: "<<< YOUR TIKTOK URL >>>", handle: "@twix", color: "#25F4EE" },
    { name: "X", brand: "x", url: "<<< YOUR X / TWITTER URL >>>", handle: "@twix", color: "#ffffff" },
    { name: "Telegram", brand: "telegram", url: "<<< YOUR TELEGRAM URL >>>", handle: "@twix", color: "#26A5E4" },
    { name: "GitHub", brand: "github", url: "<<< YOUR GITHUB URL >>>", handle: "twix", color: "#ffffff" },
  */
];

/* ---------------------------------------------------------------------------
 * 3. LIVE DISCORD PRESENCE  (Lanyard — no tokens, ever)
 * ------------------------------------------------------------------------ */
/**
 * Lanyard is a free public API (https://github.com/Phineas/lanyard) that exposes
 * a Discord presence without any bot token in the browser.
 *
 * TO GO LIVE:
 *   1. Join https://discord.gg/lanyard  (one-time, so your ID is tracked)
 *   2. Paste your numeric Discord user ID below.
 *   The card then shows your real avatar, status, custom status and activity.
 *   Until then, the static values below are shown instead — nothing breaks.
 */
export const discord = {
  enabled: false,
  /** <<< paste your 17-18 digit Discord user id here, or leave "" for static >>> */
  userId: "",

  /* ---- static fallback (also used while the API is loading) ---- */
  displayName: "Twix",
  tag: "dev.top.", // handles are lowercase in the modern Discord username system
  pronouns: "he/him",
  customStatus: "Life is Pay To Win",
  /** online | idle | dnd | offline */
  status: "online" as "online" | "idle" | "dnd" | "offline",
  /** Current activity line, e.g. "Playing VALORANT". */
  activity: "Building bagrands",
  /** Extra rows shown in the expanded card. */
  memberSince: "31 Jan 2017",
  connections: 4,
  /** Small emoji-ish badges under the name. */
  badgeIcons: ["👑", "🎮"],
};

/* ---------------------------------------------------------------------------
 * 4. MUSIC
 * ------------------------------------------------------------------------ */
export interface Track {
  title: string;
  artist: string;
  /** Path to your audio file — MP3 / OGG / WAV (put it in public/media/). */
  src: string;
  /** Cover art (square). Leave "" to show the animated vinyl. */
  artwork: string;
}

export const audio = {
  /**
   * Local audio files for the built-in player. Empty = no local track; the
   * Spotify embed below is shown instead. (background.mp4 still plays muted as
   * the video layer — the two are independent.)
   *
   * To play a local file instead (full song, autoplay on enter, no Spotify needed):
   *   { title: "Dark Paradise", artist: "Lana Del Rey", src: "media/dark-paradise.mp3", artwork: "media/dark-paradise.jpg" }
   */
  tracks: [] as Track[],
  /** Start local playback right after the visitor clicks "enter". */
  playOnEnter: true,
  /** 0 – 1 */
  volume: 0.45,
  /** Show the floating player dock in the top-left corner (local tracks only). */
  showDock: true,
  /** Title of the in-card player header. */
  playerLabel: "now playing",

  /**
   * The song. Any open.spotify.com link works here — a track, playlist, album
   * or artist. It becomes the official Spotify embed inside the card: visitors
   * get Spotify's 30-second preview, or the full track when signed in.
   *
   * Want the full song for everyone, no Spotify account needed? Put an mp3 in
   * public/media/ and list it in `tracks` above — the local player then takes
   * over and this embed is not shown.
   */
  /* Lana Del Rey — Dark Paradise (Born To Die – The Paradise Edition). Use the
     official release: fan "edit" uploads carry fake cover art in the embed. */
  spotifyEmbed: "https://open.spotify.com/track/6cWWI6IKaMnOItDuwm6z9w",
  /** Start the embed as soon as the visitor clicks "enter" (that click is what allows autoplay). */
  spotifyAutoplay: true,
  /** Spotify link shown in the widget footer. */
  spotifyUrl: "https://open.spotify.com/playlist/5nGbtwRSIfidFfp8DWzA6B",
};

/* ---------------------------------------------------------------------------
 * 5. BACKGROUND & ATMOSPHERE
 * ------------------------------------------------------------------------ */
export const background = {
  /**
   * The presence.jpg is a dark anime portrait — perfect as atmosphere.
   * A still plate behind the video; kept faint so it never competes with it.
   */
  image: "media/presence.jpg",
  imageOpacity: 0.08,
  imageBlur: 7,
  /** Push the atmosphere to the right so it doesn't fight the centred card. */
  imageAnchor: "right" as "center" | "left" | "right",

  /**
   * Looping video layer — the moving background.
   * Plays muted from the same MP4 the audio engine uses. Kept desaturated to
   * stay in the black-and-white world, but shown clearly: no blur, no screen
   * blend, and a light graded scrim so the glass card still reads on top.
   *
   * public/media/background.mp4 is a 720p / 30fps / 2.8 MB export of your edit
   * (master: "Madison Beer - Edit 13.mp4" in the project root). The original was
   * 1080p60 at 5.7 Mbps — 14 MB — and halving the frame rate costs nothing on a
   * layer shown at 62% opacity behind frosted glass. Measured against the master:
   * SSIM 0.98, PSNR 42.7 dB. To re-export, see the README.
   */
  video: {
    enabled: true,
    src: "media/background.mp4",
    /** Still frame while the video buffers. */
    poster: "media/presence.jpg",
    /** How strongly the clip shows through. 1 = unfiltered. */
    opacity: 1,
    /** Overall exposure of the clip. Higher = brighter, less moody. */
    brightness: 1.05,
    /**
     * Dark gradient laid over the clip so the glass card stays legible.
     * 1 = the original moody grade, 0 = none. 0.18 keeps the footage clear.
     */
    scrim: 0.18,
    /** Soften compression artefacts. 0 keeps the clip sharp. */
    blur: 0,
    /**
     * Phones get the still frame instead of the clip. It used to be on because
     * the file was 14 MB; it is 2.8 MB now, so phones play it too. Flip to true
     * if you'd rather save the data — the file also carries the music, so a
     * phone downloads it either way.
     */
    desktopOnly: false,
  },

  /** Moonlight / fog intensity, 0 – 1. Low so the footage reads clearly. */
  glow: 0.5,
  fog: 0.3,
  /** Edge darkening, 0 – 1. */
  vignette: 0.3,
  /** Snow / dust particles. Desktop count, halved on mobile automatically. */
  particles: 46,
  /** Mouse parallax strength in px. */
  parallax: 16,
  /** Canvas starfield behind everything (glow, drift, mouse parallax). */
  stars: {
    enabled: true,
    /** Desktop star count, halved on mobile automatically. */
    count: 260,
    /** How far the nearest layer shifts with the mouse, in px. */
    parallax: 28,
    opacity: 0.9,
  },
};

/* ---------------------------------------------------------------------------
 * 5b. 3D MODEL  (Saturn — the centrepiece behind the profile card)
 * ------------------------------------------------------------------------ */
export const model = {
  enabled: true,
  /**
   * "saturn" — the built-in planet (procedural textures, no files needed).
   * "gltf"   — load your own model from `src` instead (see public/models/).
   */
  type: "saturn" as "saturn" | "gltf",

  /**
   * Real textures. Leave "" to use the generated ones. To upgrade, drop files
   * in public/textures/saturn/ (see the README there) and set e.g.
   *   planet: "textures/saturn/saturn.jpg"       — equirectangular colour map
   *   ring:   "textures/saturn/saturn_ring.png"  — RGBA strip, x = inner → outer
   */
  textures: {
    planet: "",
    ring: "",
  },
  /** Set to true if your ring strip runs outer → inner instead. */
  ringFlip: false,
  /**
   * Render the planet in black & white to match the rest of the page.
   * Applies to the procedural textures and to any real textures you load.
   */
  monochrome: true,

  /** Planet radius in world units (rings extend to ~2.35× this). */
  radius: 1.3,
  /** Axial tilt in degrees. Saturn's real tilt is 26.7°. */
  tilt: 26.7,
  /** How far the ring plane is tipped toward the camera, in degrees. */
  pitch: 21,
  /** Planet spin in radians/second (slow and majestic). */
  spin: 0.05,
  /** How strongly the planet turns/shifts with the mouse (0 = ignore it). */
  mouse: 0.16,
  /** Vertical bob amplitude in world units. Tiny — it's a planet. */
  float: 0.05,
  /**
   * Position on wide screens, as a fraction of the visible half-width /
   * half-height from the centre. 0.42 tucks the near ring edge behind the card.
   * On portrait screens it moves above the card automatically.
   */
  anchor: { x: 0.38, y: 0.12 },

  /**
   * Ice in the rings backscatters sunlight, so they read brighter than a flat
   * lit surface would. 0 = pure lighting, 1 = fully self-lit (no shadow).
   */
  ringGlow: 0.42,
  /** The distant sun: direction from the planet, and brightness. */
  sun: {
    direction: [-5, 4.4, 3] as [number, number, number],
    intensity: 3.4,
    color: "#fff4e0",
    /** Shadow of the planet on the rings and of the rings on the planet. */
    shadows: true,
  },

  /* --- only used when type === "gltf" ------------------------------------ */
  src: "models/logo.glb",
  draco: false,
  scale: 1,
};

/* ---------------------------------------------------------------------------
 * 6. EFFECTS / TOGGLES
 * ------------------------------------------------------------------------ */
export const effects = {
  /** Three.js depth scene (floating dust + rings + mouse light). */
  three: true,
  /** Quality: "auto" adapts to the device, or force "high" / "low". */
  quality: "auto" as "auto" | "high" | "low",
  /** Custom desktop cursor. */
  cursor: true,
  /** 3D tilt of the profile card + avatar. */
  tilt: true,
  /** Magnetic pull of social icons toward the cursor. */
  magnetic: true,
  /** Film grain, scanlines, chromatic text edge — all very subtle. */
  grain: true,
  /* Off by default: the CRT lines dull the footage and the planet. */
  scanlines: false,
  chromatic: true,
  /** Mouse-following spotlight on the glass card. */
  spotlight: true,
  /** Frame-rate readout in the corner. Also available any time with ?fps in the URL. */
  fpsMeter: false,
  /** Show the animated view counter (stored locally, like guns.lol). */
  viewCounter: true,
  /** Number the counter starts from. */
  viewBase: 153,
};

/* ---------------------------------------------------------------------------
 * 7. THEMES  (press T on the page to cycle, or change `defaultTheme`)
 * ------------------------------------------------------------------------ */
export const themes = {
  mono: { name: "Monochrome", accent: "#ffffff", accentSoft: "rgba(255,255,255,0.55)", glow: "rgba(255,255,255,0.30)" },
  ice: { name: "Ice", accent: "#bfe4ff", accentSoft: "rgba(191,228,255,0.6)", glow: "rgba(140,200,255,0.35)" },
  violet: { name: "Violet", accent: "#c9b6ff", accentSoft: "rgba(201,182,255,0.6)", glow: "rgba(150,110,255,0.38)" },
  ember: { name: "Ember", accent: "#ffb27a", accentSoft: "rgba(255,178,122,0.6)", glow: "rgba(255,120,40,0.35)" },
  jade: { name: "Jade", accent: "#9ff0d0", accentSoft: "rgba(159,240,208,0.6)", glow: "rgba(60,220,160,0.32)" },
  blood: { name: "Blood", accent: "#ff8f9c", accentSoft: "rgba(255,143,156,0.6)", glow: "rgba(255,40,70,0.34)" },
} as const;

export type ThemeKey = keyof typeof themes;
export const defaultTheme: ThemeKey = "mono";

/* ---------------------------------------------------------------------------
 * 8. STATS  (animated counters in the second section)
 * ------------------------------------------------------------------------ */
export const stats = [
  { label: "Profile views", value: 153, suffix: "+" },
  { label: "Projects", value: 12, suffix: "" },
  { label: "Connections", value: 340, suffix: "+" },
  { label: "Years online", value: 9, suffix: "" },
];

/* ---------------------------------------------------------------------------
 * 9. ABOUT
 * ------------------------------------------------------------------------ */
export const about = {
  title: "quiet on the outside, loud in the code",
  paragraphs: [
    "I build things for the internet — small tools, weird interfaces and projects that probably shouldn't exist. Most of my time goes into learning something new and turning it into something you can click.",
    "When I'm not coding I'm usually deep in a game, editing something, or listening to music loud enough that nobody asks questions.",
  ],
  /** Small tag clouds — edit freely. */
  interests: ["anime", "late nights", "design", "grinding rank", "lofi", "web experiments"],
  games: ["VALORANT", "Roblox", "Minecraft", "GTA V"],
  music: ["phonk", "hyperpop", "drill", "lofi"],
  skills: [
    { name: "TypeScript / React", level: 88 },
    { name: "UI & Motion design", level: 82 },
    { name: "Node / APIs", level: 74 },
    { name: "3D / Three.js", level: 61 },
  ],
  /** "Currently" card. */
  currentProjects: [
    { name: "bagrands", note: "branding & visual identity" },
    { name: "twix.lol", note: "this profile" },
    { name: "discord bots", note: "+ systems" },
  ],
};

/* ---------------------------------------------------------------------------
 * 10. PROJECTS
 * ------------------------------------------------------------------------ */
export interface Project {
  title: string;
  description: string;
  tags: string[];
  /** Link — leave "" to render the card without a link. */
  url: string;
  /** Optional thumbnail in public/media/. */
  image?: string;
  /** Small corner label. */
  status?: string;
}

export const projects: Project[] = [
  {
    title: "bagrands",
    description: "A personal brand system — visuals, typography and the identity everything else hangs on.",
    tags: ["design", "branding"],
    url: "<<< YOUR PROJECT URL >>>",
    status: "ongoing",
  },
  {
    title: "Portfolio",
    description: "Experiments in layout, motion and 3D for the web. Built to feel alive, not templated.",
    tags: ["react", "three.js"],
    url: "<<< YOUR PROJECT URL >>>",
  },
  {
    title: "Discord Projects",
    description: "Bots, dashboards and small utilities for Discord communities.",
    tags: ["node", "discord.js"],
    url: "<<< YOUR PROJECT URL >>>",
  },
  {
    title: "Web Experiments",
    description: "Shaders, particles and interaction studies — the playground where the good ideas come from.",
    tags: ["webgl", "motion"],
    url: "",
    status: "lab",
  },
];

/* ---------------------------------------------------------------------------
 * 11. SECTION LABELS (change the copy without touching components)
 * ------------------------------------------------------------------------ */
export const sections = {
  /*
    Everything below the profile card. All off = a single-screen profile that
    doesn't scroll. Flip any back on and the page grows again.
  */
  aboutEnabled: false,
  projectsEnabled: false,
  statsEnabled: false,
  footerEnabled: false,
  projectsTitle: "things I made",
  statsTitle: "small proof of life",
  scrollHint: "scroll",
  aboutCardTitles: {
    interests: "Interests",
    games: "Favourite games",
    music: "On repeat",
    skills: "Skills",
    now: "Currently",
  },
};

/* ---------------------------------------------------------------------------
 * 12. SEO / META  (also mirrored in index.html so crawlers see it immediately)
 * ------------------------------------------------------------------------ */
export const seo = {
  title: "Twix — Life is Pay To Win",
  description: "Twix — personal profile, socials, projects and more.",
  url: "https://twixweb.github.io/bagrands/",
  themeColor: "#050505",
  keywords: ["twix", "profile", "link in bio", "socials", "portfolio"],
  twitterHandle: "@twix",
};

/* ---------------------------------------------------------------------------
 * 13. EASTER EGGS
 * ------------------------------------------------------------------------ */
export const easterEggs = {
  enabled: true,
  /** Press T to cycle themes. */
  themeKey: "t",
  /** Konami code reveals a hidden message. */
  konami: true,
  konamiMessage: "you found the quiet place. — twix",
  /** Click the avatar this many times to trigger the burst. */
  avatarClicks: 5,
  avatarBurstMessage: "you did it. now go outside.",
};

export type Profile = typeof profile;
