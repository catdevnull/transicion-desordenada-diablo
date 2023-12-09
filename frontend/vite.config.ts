import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import svg from "@poppanator/sveltekit-svg";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [svelte(), svg()],
});
