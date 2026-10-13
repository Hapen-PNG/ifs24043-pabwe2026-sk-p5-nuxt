import { describe, expect, it } from "vitest";
import { createMemoryHistory, type RouteRecordRaw } from "vue-router";
import { createAppRouter } from "./router";
import { routes } from "./routes";

async function loadAllComponents(list: RouteRecordRaw[]) {
  for (const route of list) {
    if (typeof route.component === "function") {
      await (route.component as () => Promise<unknown>)();
    }
    if (route.children) {
      await loadAllComponents(route.children);
    }
  }
}

describe("routes", () => {
  it("memuat seluruh komponen halaman secara lazy", async () => {
    await expect(loadAllComponents(routes)).resolves.toBeUndefined();
  });

  it("mendefinisikan rute auth, dashboard, dan wildcard 404", () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toEqual(["/auth", "/", "/:pathMatch(.*)*"]);

    const authChildren = routes[0].children!.map((child) => child.path);
    expect(authChildren).toEqual(["", "login", "register"]);

    const dashboardChildren = routes[1].children!.map((child) => child.path);
    expect(dashboardChildren).toEqual([
      "",
      "cash-flows/:cashFlowId",
      "users",
      "profile",
    ]);
  });
});

describe("createAppRouter", () => {
  it("mengarahkan /auth ke /auth/login", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/auth");

    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("menandai rute dashboard sebagai terproteksi", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/cash-flows/7");

    expect(router.currentRoute.value.name).toBe("cash-flow-detail");
    expect(router.currentRoute.value.params.cashFlowId).toBe("7");
    expect(router.currentRoute.value.meta.requiresAuth).toBe(true);
  });

  it("menggunakan rute 404 untuk path tidak dikenal", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/tidak-ada");

    expect(router.currentRoute.value.name).toBe("not-found");
  });

  it("memakai web history bila history tidak diberikan", () => {
    const router = createAppRouter();

    expect(router.options.history).toBeDefined();
    expect(router.getRoutes().length).toBeGreaterThan(0);
  });
});
