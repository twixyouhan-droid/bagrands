import { useEffect, useRef } from "react";
import * as THREE from "three";
import { effects, model as modelConfig } from "../config/profile";
import { useIsMobile } from "../lib/hooks";
import { k } from "../lib/motion";
import { pointer } from "../lib/pointer";
import { RING_INNER, RING_OUTER, desaturateImage, makePlanetTexture, makeRingTexture } from "../lib/saturn-textures";
import { onFrame } from "../lib/ticker";

type Quality = "high" | "low";
type Disposable = { dispose: () => void };

/* =========================================================================
   Dust — soft round bokeh particles floating in the room
   ========================================================================= */
const DUST_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uScale;
  uniform float uDrift;
  uniform float uFall;
  uniform float uSpan;
  varying float vFade;

  void main() {
    vec3 p = position;
    p.y = mod(p.y - uTime * uFall + uSpan * 0.5, uSpan) - uSpan * 0.5;
    p.y += sin(uTime * 0.26 + aPhase) * uDrift;
    p.x += cos(uTime * 0.19 + aPhase * 1.3) * uDrift * 0.8;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (uScale / -mv.z), 1.0, 64.0);
    vFade = clamp(1.0 - (-mv.z - 2.2) / 11.0, 0.06, 1.0);
  }
`;

const DUST_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float halo = smoothstep(0.5, 0.18, d);
    gl_FragColor = vec4(uColor, (core * 0.55 + halo * 0.45) * uOpacity * vFade);
  }
`;

function makeDust(
  count: number,
  opts: {
    minRadius: number;
    maxRadius: number;
    verticalSpread: number;
    size: number;
    opacity: number;
    drift: number;
    fall: number;
    span: number;
    color: THREE.Color;
  },
) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const radius = opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * opts.verticalSpread;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * 0.55;
    sizes[i] = opts.size * (0.4 + Math.random() * 1.1);
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: opts.color },
      uOpacity: { value: opts.opacity },
      uTime: { value: 0 },
      uScale: { value: 420 },
      uDrift: { value: opts.drift },
      uFall: { value: opts.fall },
      uSpan: { value: opts.span },
    },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material };
}

/* =========================================================================
   Atmosphere — a Fresnel rim so the limb of the planet glows on the lit side
   ========================================================================= */
const ATMO_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDir;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uFlip;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main() {
    vec3 n = vNormalW * uFlip;
    float rim = pow(1.0 - clamp(dot(n, vViewW), 0.0, 1.0), uPower);
    /* only the sunlit limb glows; the night side stays dark */
    float lit = clamp(dot(vNormalW, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
    lit = 0.08 + 0.92 * lit * lit;
    gl_FragColor = vec4(uColor, rim * lit * uIntensity);
  }
`;

function makeAtmosphere(
  radius: number,
  sunDir: THREE.Vector3,
  side: THREE.Side,
  power: number,
  intensity: number,
  segments: number,
  color: string,
) {
  const geometry = new THREE.SphereGeometry(radius, segments, segments / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSunDir: { value: sunDir },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uFlip: { value: side === THREE.BackSide ? -1 : 1 },
    },
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    transparent: true,
    depthWrite: false,
    side,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, geometry, material };
}

/* =========================================================================
   Saturn
   ========================================================================= */
interface Hero {
  group: THREE.Group;
  update: (elapsed: number, delta: number) => void;
  dispose: () => void;
}

function prepareTexture(tex: THREE.Texture, renderer: THREE.WebGLRenderer, wrap: boolean) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (wrap) tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The planet, its rings and two atmosphere shells.
 *
 *  group (tilt + pitch)
 *    planet   — textured sphere, casts + receives shadow
 *    rings    — flat annulus, radial UVs, alpha-mapped, casts + receives shadow
 *    rim/haze — Fresnel glow, additive
 *
 * Procedural textures mount first so nothing pops in late; real textures from
 * `model.textures` are swapped in when they finish loading.
 */
function makeSaturn(renderer: THREE.WebGLRenderer, quality: Quality, sunDir: THREE.Vector3): Hero {
  const cfg = modelConfig;
  const R = cfg.radius;
  const group = new THREE.Group();
  const disposables: Disposable[] = [];
  const high = quality === "high";

  /* Tilt: real axial tilt around z, then pitch toward the camera so the ring
     plane is seen from slightly above rather than edge-on. */
  group.rotation.set(THREE.MathUtils.degToRad(cfg.pitch), 0, THREE.MathUtils.degToRad(-cfg.tilt));

  /* ---------------------------------------------------------------- planet */
  const mono = cfg.monochrome;
  const planetTex = prepareTexture(new THREE.CanvasTexture(makePlanetTexture(high ? 1024 : 512, mono)), renderer, true);
  const planetGeo = new THREE.SphereGeometry(R, high ? 96 : 48, high ? 64 : 32);
  const planetMat = new THREE.MeshStandardMaterial({ map: planetTex, roughness: 0.92, metalness: 0 });
  const planet = new THREE.Mesh(planetGeo, planetMat);
  planet.castShadow = true;
  planet.receiveShadow = true;
  group.add(planet);
  disposables.push(planetTex, planetGeo, planetMat);

  /* ----------------------------------------------------------------- rings */
  const ringTex = prepareTexture(new THREE.CanvasTexture(makeRingTexture(high ? 2048 : 1024, mono)), renderer, false);
  const inner = R * RING_INNER;
  const outer = R * RING_OUTER;
  const ringGeo = new THREE.RingGeometry(inner, outer, high ? 256 : 128, 1);
  /* RingGeometry's UVs are planar; the strip wants a radial u. */
  {
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i += 1) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      let u = (r - inner) / (outer - inner);
      if (cfg.ringFlip) u = 1 - u;
      uv.setXY(i, u, 0.5);
    }
    uv.needsUpdate = true;
  }
  const ringMat = new THREE.MeshStandardMaterial({
    map: ringTex,
    alphaMap: ringTex,
    /* Backscatter: a texture-shaped self-light so the ice reads bright at grazing sun angles. */
    emissiveMap: ringTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: cfg.ringGlow,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0,
    /* alphaTest makes the ring's *shadow* respect the gaps too. */
    alphaTest: 0.06,
    depthWrite: false,
  });
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = -Math.PI / 2;
  rings.castShadow = true;
  rings.receiveShadow = true;
  group.add(rings);
  disposables.push(ringTex, ringGeo, ringMat);

  /* ------------------------------------------------------------ atmosphere */
  const atmoColor = mono ? "#ffffff" : "#ffe6b8";
  const rim = makeAtmosphere(R * 1.012, sunDir, THREE.FrontSide, 3.4, 1.1, high ? 64 : 32, atmoColor);
  const haze = makeAtmosphere(R * 1.09, sunDir, THREE.BackSide, 2.6, 0.55, high ? 64 : 32, atmoColor);
  group.add(rim.mesh, haze.mesh);
  disposables.push(rim.geometry, rim.material, haze.geometry, haze.material);

  /* ------------------------------------------------------- real textures */
  const loader = new THREE.TextureLoader();
  const swap = (path: string, apply: (t: THREE.Texture) => void, wrap: boolean) => {
    if (!path) return;
    loader
      .loadAsync(path)
      .then((t) => {
        let tex: THREE.Texture = t;
        if (mono) {
          tex = new THREE.CanvasTexture(desaturateImage(t.image as HTMLImageElement));
          t.dispose();
        }
        apply(prepareTexture(tex, renderer, wrap));
        disposables.push(tex);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn(`[Scene3D] texture ${path} failed, keeping procedural:`, err);
      });
  };
  swap(cfg.textures.planet, (t) => {
    planetMat.map = t;
    planetMat.needsUpdate = true;
  }, true);
  swap(cfg.textures.ring, (t) => {
    ringMat.map = t;
    ringMat.alphaMap = t;
    ringMat.emissiveMap = t;
    ringMat.needsUpdate = true;
  }, false);

  return {
    group,
    update: (_elapsed, delta) => {
      planet.rotation.y += delta * cfg.spin;
      /* ring particles orbit slower than the cloud tops */
      rings.rotation.z += delta * cfg.spin * 0.3;
    },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/* =========================================================================
   glTF (optional) — your own model instead of Saturn
   ========================================================================= */
async function loadGltf(renderer: THREE.WebGLRenderer, scene: THREE.Scene, cancel: { cancelled: boolean }): Promise<Hero | null> {
  const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  const loader = new GLTFLoader();
  if (modelConfig.draco) {
    const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);
  }
  const gltf = await loader.loadAsync(modelConfig.src);
  if (cancel.cancelled) return null;

  /* A studio environment so metals and glass have something to reflect. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  pmrem.dispose();

  const root = gltf.scene;
  const box = new THREE.Box3().setFromObject(root);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  root.position.sub(box.getCenter(new THREE.Vector3()));
  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.scale.setScalar((sphere.radius > 0 ? 1 / sphere.radius : 1) * modelConfig.scale * modelConfig.radius);

  const disposables: Disposable[] = [env];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    disposables.push(mesh.geometry);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
      if ("envMapIntensity" in m) (m as THREE.MeshStandardMaterial).envMapIntensity = 1.3;
      disposables.push(m);
      Object.values(m).forEach((v) => {
        if (v && (v as THREE.Texture).isTexture) disposables.push(v as THREE.Texture);
      });
    });
  });

  return {
    group: wrapper,
    update: (_elapsed, delta) => {
      wrapper.rotation.y += delta * modelConfig.spin * 4;
    },
    dispose: () => {
      scene.environment = null;
      disposables.forEach((d) => d.dispose());
    },
  };
}

/* =========================================================================
   Scene
   ========================================================================= */
export default function Scene3D({ accent }: { accent: string }) {
  const host = useRef<HTMLDivElement | null>(null);
  const mobile = useIsMobile();
  const quality: Quality = effects.quality === "auto" ? (mobile ? "low" : "high") : effects.quality;

  useEffect(() => {
    const el = host.current;
    if (!el || !effects.three) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: quality === "high",
        powerPreference: quality === "high" ? "high-performance" : "low-power",
      });
    } catch {
      return; // no WebGL — the CSS + canvas layers carry the atmosphere
    }

    const width = el.clientWidth || window.innerWidth;
    const height = el.clientHeight || window.innerHeight;
    const shadows = modelConfig.sun.shadows;

    /*
      1.5× is the sweet spot for a background layer: sharp enough on retina,
      and ~30% fewer pixels to shade per frame than 1.75× — which is what keeps
      a 144 Hz display at its refresh rate.
    */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : 1));
    renderer.setSize(width, height);
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    /*
      The shadow pass is a second full render of the planet + rings. The planet
      is a sphere and the rings are radially symmetric, so their spin never
      changes the shadow — only the sun swinging or the planet moving does.
      Render the map on demand instead of every frame.
    */
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 1600ms ease-out";
    el.appendChild(renderer.domElement);

    /* ---------------------------------------------------------------- camera */
    /*
      A 42° lens at 7.6–10.4 units, depending on aspect. Narrow screens push
      the camera back so the planet and its rings stay in frame.
    */
    const FOV = 42;
    const cameraDistance = (aspect: number) => (aspect < 1 ? 10.4 : aspect < 1.4 ? 8.6 : 7.6);
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 100);
    camera.position.set(0, 0, cameraDistance(width / height));

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    scene.add(world);
    const accentColor = new THREE.Color(accent);

    /* ---------------------------------------------------------------- lights */
    /*
      Space lighting: one hard, distant sun and almost nothing else. The
      ambient is a whisper of blue "starlight" so the night side is readable
      but still clearly night.
    */
    const sunDir = new THREE.Vector3().fromArray(modelConfig.sun.direction).normalize();
    const sun = new THREE.DirectionalLight(
      new THREE.Color(modelConfig.monochrome ? "#ffffff" : modelConfig.sun.color),
      modelConfig.sun.intensity,
    );
    const sunTarget = new THREE.Object3D();
    sun.target = sunTarget;
    scene.add(sun, sunTarget);
    scene.add(new THREE.AmbientLight(modelConfig.monochrome ? 0x8a8a8a : 0x5a6a8a, 0.22));

    if (shadows) {
      const extent = modelConfig.radius * RING_OUTER * 1.15;
      sun.castShadow = true;
      sun.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
      sun.shadow.camera.left = -extent;
      sun.shadow.camera.right = extent;
      sun.shadow.camera.top = extent;
      sun.shadow.camera.bottom = -extent;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 40;
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = 3;
    }
    const SUN_DISTANCE = 16;

    /* ------------------------------------------------------------------ dust */
    const near = makeDust(quality === "low" ? 90 : 200, {
      minRadius: 1.6,
      maxRadius: 7.5,
      verticalSpread: 0.8,
      size: 0.12,
      opacity: 0.42,
      drift: 0.2,
      fall: 0.16,
      span: 19,
      color: new THREE.Color(0xffffff),
    });
    const far = makeDust(quality === "low" ? 150 : 320, {
      minRadius: 5.5,
      maxRadius: 15,
      verticalSpread: 0.6,
      size: 0.03,
      opacity: 0.22,
      drift: 0.08,
      fall: 0.06,
      span: 26,
      color: accentColor,
    });
    world.add(near.points, far.points);

    /* ------------------------------------------------------------------ hero */
    /*
      pivot → eased mouse-follow (yaw / pitch) + parallax drift
        hero → Saturn (tilt lives inside) or the loaded glTF
    */
    const pivot = new THREE.Group();
    world.add(pivot);
    pivot.visible = modelConfig.enabled;

    let hero: Hero | null = null;
    const cancel = { cancelled: false };
    const mountHero = (h: Hero) => {
      hero?.group.removeFromParent();
      hero?.dispose();
      hero = h;
      pivot.add(h.group);
    };
    mountHero(makeSaturn(renderer, quality, sunDir));

    /*
      The single-file build (--mode single) leaves the glTF loader out: it
      drags in a 1.7 MB Draco decoder that only matters for custom models.
    */
    if (modelConfig.type === "gltf" && import.meta.env.MODE !== "single") {
      loadGltf(renderer, scene, cancel)
        .then((loaded) => {
          if (loaded && !cancel.cancelled) mountHero(loaded);
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.warn("[Scene3D] glTF failed, keeping Saturn:", err);
        });
    }

    /* Where the planet sits depends on the viewport shape. */
    const base = new THREE.Vector3();
    const layout = (aspect: number) => {
      const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.position.z;
      const halfW = halfH * aspect;
      if (aspect >= 1.5) {
        /* Wide: beside the card, near ring edge tucked behind the glass. */
        base.set(halfW * modelConfig.anchor.x, halfH * modelConfig.anchor.y, -0.6);
        pivot.scale.setScalar(1);
      } else if (aspect >= 1.05) {
        /* Squarer (laptops with the sidebar open, tablets): up and to the right, smaller. */
        base.set(halfW * 0.58, halfH * 0.36, -1.2);
        pivot.scale.setScalar(0.72);
      } else {
        /* Portrait: above the card, smaller, pushed back. */
        base.set(0, halfH * 0.66, -2);
        pivot.scale.setScalar(0.62);
      }
      pivot.position.copy(base);
    };
    layout(width / height);

    /* ---------------------------------------------------------------- reveal */
    let shown = false;
    let frames = 0;
    const reveal = () => {
      if (shown) return;
      shown = true;
      renderer.domElement.style.opacity = "1";
    };
    const revealTimer = window.setTimeout(() => {
      if (!shown) renderer.domElement.style.transition = "none";
      reveal();
    }, 1600);

    const setPointScale = (h: number) => {
      const s = (h / 2) * renderer.getPixelRatio();
      near.material.uniforms.uScale.value = s;
      far.material.uniforms.uScale.value = s;
    };
    setPointScale(height);

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__twixScene = {
        THREE,
        renderer,
        scene,
        camera,
        pivot,
        sun,
        report: () => ({
          frames,
          heroType: modelConfig.type,
          heroChildren: hero?.group.children.length ?? 0,
          position: pivot.position.toArray().map((n) => +n.toFixed(2)),
          shadows: renderer.shadowMap.enabled,
          shadowMap: sun.shadow.mapSize.x,
          canvas: `${renderer.domElement.width}x${renderer.domElement.height}`,
          programs: renderer.info.programs?.length ?? 0,
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          shadowAutoUpdate: renderer.shadowMap.autoUpdate,
          pixelRatio: renderer.getPixelRatio(),
        }),
      };
    }

    /* ------------------------------------------------------------------ loop */
    let elapsed = 0;
    const sunBase = sunDir.clone();
    const sunEased = { yaw: 0 };
    const tmp = new THREE.Vector3();
    const shadowState = { yaw: Infinity, pos: new THREE.Vector3(Infinity, 0, 0), rx: 0, ry: 0 };

    const stop = onFrame((dtMs) => {
      const delta = dtMs / 1000;
      elapsed += delta;
      frames += 1;

      /* dust */
      near.material.uniforms.uTime.value = elapsed;
      far.material.uniforms.uTime.value = elapsed * 0.6;
      near.points.rotation.y += delta * 0.02;
      far.points.rotation.y -= delta * 0.008;
      near.points.rotation.x = Math.sin(elapsed * 0.06) * 0.08;
      far.points.rotation.x = Math.sin(elapsed * 0.04) * 0.05;

      /* hero: spin + gentle mouse-follow + parallax (easing tuned at 60 fps, corrected per frame) */
      const f3 = k(0.03, dtMs);
      hero?.update(elapsed, delta);
      pivot.rotation.y += (pointer.nx * modelConfig.mouse - pivot.rotation.y) * f3;
      pivot.rotation.x += (pointer.ny * modelConfig.mouse * 0.5 - pivot.rotation.x) * f3;
      pivot.position.x += (base.x + pointer.nx * 0.22 - pivot.position.x) * f3;
      pivot.position.y +=
        (base.y - pointer.ny * 0.14 + Math.sin(elapsed * 0.5) * modelConfig.float - pivot.position.y) * f3;

      /*
        Dynamic sun: the light swings a few degrees with the mouse, so the
        planet's shadow slides across the rings as you move. The shadow camera
        is re-aimed at the planet every frame so it never drifts out of frame.
      */
      sunEased.yaw += (pointer.nx * 0.14 - sunEased.yaw) * f3;
      sunDir.copy(sunBase).applyAxisAngle(THREE.Object3D.DEFAULT_UP, sunEased.yaw);
      sun.position.copy(pivot.position).add(tmp.copy(sunDir).multiplyScalar(SUN_DISTANCE));
      sunTarget.position.copy(pivot.position);

      /* Re-render the shadow map only once things have moved a visible amount. */
      if (shadows) {
        const moved =
          Math.abs(sunEased.yaw - shadowState.yaw) > 0.0015 ||
          pivot.position.distanceToSquared(shadowState.pos) > 0.0004 ||
          Math.abs(pivot.rotation.x - shadowState.rx) > 0.0015 ||
          Math.abs(pivot.rotation.y - shadowState.ry) > 0.0015;
        if (moved || frames < 3) {
          renderer.shadowMap.needsUpdate = true;
          shadowState.yaw = sunEased.yaw;
          shadowState.pos.copy(pivot.position);
          shadowState.rx = pivot.rotation.x;
          shadowState.ry = pivot.rotation.y;
        }
      }

      /* camera parallax */
      world.rotation.y += (pointer.nx * 0.05 - world.rotation.y) * f3;
      world.rotation.x += (pointer.ny * 0.03 - world.rotation.x) * f3;
      camera.position.x += (pointer.nx * 0.3 - camera.position.x) * f3;
      camera.position.y += (-pointer.ny * 0.2 - camera.position.y) * f3;
      camera.lookAt(0, 0, 0);

      reveal();
      renderer.render(scene, camera);
    });

    /* ---------------------------------------------------------------- resize */
    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = cameraDistance(camera.aspect);
      camera.updateProjectionMatrix();
      setPointScale(h);
      layout(camera.aspect);
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(el);
    window.addEventListener("resize", resize);

    return () => {
      cancel.cancelled = true;
      stop();
      window.clearTimeout(revealTimer);
      window.removeEventListener("resize", resize);
      observer?.disconnect();
      [near, far].forEach((d) => {
        d.geometry.dispose();
        d.material.dispose();
      });
      hero?.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [accent, quality]);

  if (!effects.three) return null;

  return <div ref={host} className="pointer-events-none fixed inset-0 z-[2]" aria-hidden="true" />;
}
