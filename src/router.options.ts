import type { RouterConfig } from "@nuxt/schema";
import { routes } from "./routes";

// Menimpa rute otomatis Nuxt dengan rute kustom dari src/routes.ts
export default {
  routes: () => routes,
} satisfies RouterConfig;
