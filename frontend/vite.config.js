import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "/vildora/",

  server: {
    allowedHosts: ["epidermal-unloader-viscous.ngrok-free.dev"],
  },
});
