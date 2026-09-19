# 3D models

Drop your `.glb` (preferred) or `.gltf` here, then in `src/config/profile.ts`:

```ts
export const model = {
  enabled: true,
  type: "gltf",          // switch from "shape"
  src: "/models/logo.glb",
  draco: false,          // true only if you exported with Draco compression
  scale: 1,              // 1 ≈ the same size as the built-in crystal
  ...
};
```

Any size of export works — the loader centres the model and normalises it to a
1-unit bounding sphere before `scale` is applied. If the file fails to load the
built-in crystal stays on screen, and the reason is logged in dev.

Keep files small (< 2 MB). Blender → File → Export → glTF 2.0 → format "glb",
"Apply Modifiers", and enable "Compression" (Draco) for large meshes.
