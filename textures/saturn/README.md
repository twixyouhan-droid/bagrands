# Saturn textures

The site ships with **procedural** Saturn textures (generated at runtime in
`src/lib/saturn-textures.ts`), so nothing is required here. Drop real textures
in this folder to upgrade the look, then point `model.textures` at them in
`src/config/profile.ts`:

```ts
textures: {
  planet: "/textures/saturn/saturn.jpg",       // colour map
  ring:   "/textures/saturn/saturn_ring.png",  // RGBA ring strip
},
```

## What the files need to be

| File | Format | Notes |
| --- | --- | --- |
| `saturn.jpg` | 2:1 equirectangular, 2K–8K, JPEG | Longitude on x, latitude on y. Saturn is pale gold — avoid over-saturated maps. |
| `saturn_ring.png` | horizontal strip with alpha, ≥1024 px wide, PNG | **x = radius, from the inner edge (1.11 R) to the outer edge (2.35 R).** Alpha = ring opacity, so gaps are transparent. Height can be anything (8–64 px). |

If your ring strip runs outer → inner, set `model.ringFlip: true` instead of
flipping the file.

## Where to get them

- **Solar System Scope** — free 2K/8K planet maps under CC BY 4.0, including a
  Saturn colour map and a ring alpha strip. Credit them in your footer if you use
  them.
- **NASA / JPL** Cassini imagery is public domain (you'll need to assemble the
  ring strip yourself from a radial profile).

Keep the planet map under ~2 MB (a 4K JPEG at quality 80 is plenty for a
background object) and the ring strip under ~200 KB.

## How it's applied

- Both textures get `SRGBColorSpace` and 8× anisotropy so the rings stay sharp
  at grazing angles.
- The ring geometry's UVs are rewritten so `u` runs radially, which is why a
  1-D strip works.
- The ring texture is used as `map`, `alphaMap` **and** `emissiveMap`: the
  emissive term (`model.ringGlow`) fakes the backscatter of ice, so the rings
  stay bright even when the sun is low relative to the ring plane.
- `alphaTest` on the ring material means the ring's *shadow* on the planet also
  has the gaps in it.
