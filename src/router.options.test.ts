import { describe, expect, it } from "vitest";
import routerOptions from "./router.options";
import { routes } from "./routes";

describe("router.options", () => {
  it("mengembalikan rute kustom dari routes.ts", () => {
    expect((routerOptions.routes as () => unknown)()).toBe(routes);
  });
});
