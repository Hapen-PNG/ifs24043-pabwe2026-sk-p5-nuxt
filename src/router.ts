import { createRouter, createWebHistory, type RouterHistory } from "vue-router";
import { routes } from "./routes";

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({ history, routes });
}

export default createAppRouter();