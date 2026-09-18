import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
  `vite build --mode single` builds one self-contained index.html (JS, CSS,
  fonts and small images inlined) into single/ — see scripts/single-file.ts.
  Only the media/ folder stays beside it.
*/
export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    /* Relative URLs so the build works at a domain root or in any sub-folder. */
    base: "./",
    plugins: [react(), tailwindcss()],
    server: {
      host: "127.0.0.1",
      port: 5290,
      strictPort: false,
    },
    build: {
      target: "es2020",
      outDir: single ? "single" : "dist",
      cssCodeSplit: !single,
      sourcemap: false,
      // Inline small assets (< 4 kB) as base64 to save round trips — everything, in single-file mode.
      assetsInlineLimit: single ? 1e9 : 4096,
      chunkSizeWarningLimit: 1100,
      // esbuild handles minification faster than terser for this bundle size.
      minify: "esbuild",
      rollupOptions: {
        output: {
          // Stable hash-based filenames for long-term caching.
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          // One script for the single-file build (lazy chunks get folded in).
          inlineDynamicImports: single,
          /*
          Rolldown's native chunk groups (its manualChunks shim merges groups
          unpredictably). Higher priority wins when a module matches several.
        */
          advancedChunks: single
            ? undefined
            : {
                groups: [
                  /*
              glTF / Draco loaders only download when model.type === "gltf".
              Groups capture a matched module's whole dependency tree by
              default, which would drag core three in here — hence the flag.
            */
                  {
                    name: "gltf",
                    test: /node_modules[\/]three[\/]examples[\/]jsm[\/]loaders[\/]/,
                    priority: 30,
                    includeDependenciesRecursively: false,
                  },
                  // Keep the heavy WebGL stack out of the first paint (lazy-loaded).
                  {
                    name: "three",
                    test: /node_modules[\/](three|@react-three)[\/]/,
                    priority: 20,
                  },
                  // Brand SVG registry — only needed after entering.
                  {
                    name: "icons",
                    test: /node_modules[\/]simple-icons[\/]/,
                    priority: 20,
                  },
                  // Framer Motion — animation runtime, not needed at cold start.
                  {
                    name: "motion",
                    test: /node_modules[\/](motion|framer-motion)[\/]/,
                    priority: 20,
                  },
                ],
              },
        },
      },
    },
    // Improve HMR and cold-start in dev by pre-bundling heavy deps.
    optimizeDeps: {
      include: ["react", "react-dom", "motion/react", "lucide-react"],
      exclude: ["three"],
    },
  };
});
