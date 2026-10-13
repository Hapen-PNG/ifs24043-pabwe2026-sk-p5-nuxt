import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { h } from "vue";
import { putAccessToken } from "../../../helpers/apiHelper";
import { createMockPinia, renderWithProviders, StubPage } from "../../../test-utils";
import { useUsersStore } from "../../users/states/usersStore";
import NavbarComponent from "../components/NavbarComponent.vue";
import SidebarComponent from "../components/SidebarComponent.vue";
import CashFlowLayout from "./CashFlowLayout.vue";

const ChildPage = { render: () => h("div", { "data-testid": "child" }, "Konten halaman") };

const routes = [
  { path: "/", component: ChildPage },
  { path: "/auth/login", component: StubPage },
];

async function setup() {
  const pinia = createMockPinia();
  const users = useUsersStore(pinia);
  const spy = vi.spyOn(users, "asyncGetProfile").mockResolvedValue(undefined);
  const result = await renderWithProviders(CashFlowLayout, { pinia, routes });
  await flushPromises();
  return { spy, ...result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CashFlowLayout", () => {
  it("memuat profil dan merender konten halaman anak", async () => {
    putAccessToken("token");

    const { wrapper, spy, router } = await setup();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(wrapper.find("[data-testid=child]").text()).toBe("Konten halaman");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("kembali ke login bila token sudah tidak ada", async () => {
    const { router } = await setup();

    expect(router.currentRoute.value.path).toBe("/auth/login");
  });

  it("membuka dan menutup sidebar", async () => {
    putAccessToken("token");
    const { wrapper } = await setup();

    expect(wrapper.find("[data-testid=sidebar-overlay]").exists()).toBe(false);

    wrapper.findComponent(NavbarComponent).vm.$emit("toggle");
    await flushPromises();
    expect(wrapper.find("[data-testid=sidebar-overlay]").exists()).toBe(true);

    wrapper.findComponent(SidebarComponent).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find("[data-testid=sidebar-overlay]").exists()).toBe(false);
  });
});
