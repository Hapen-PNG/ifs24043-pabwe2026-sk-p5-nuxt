import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useUsersStore } from "../states/usersStore";
import type { User } from "../api/userApi";
import UsersPage from "./UsersPage.vue";

const makeUser = (overrides: Partial<User>): User => ({
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  email_verified_at: null,
  photo: null,
  created_at: "2024-10-05T02:53:38.000000Z",
  updated_at: "2024-10-05T02:53:38.000000Z",
  ...overrides,
});

async function setup(patch: Record<string, unknown> = {}) {
  const pinia = createMockPinia();
  const store = useUsersStore(pinia);
  const spy = vi.spyOn(store, "asyncGetUsers").mockResolvedValue(undefined);
  store.$patch(patch);
  const result = await renderWithProviders(UsersPage, { pinia });
  return { store, spy, ...result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UsersPage", () => {
  it("memuat daftar pengguna saat dibuka", async () => {
    const { spy } = await setup();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("menampilkan status memuat", async () => {
    const { wrapper } = await setup({ isUsers: true });

    expect(wrapper.text()).toContain("Memuat data pengguna");
  });

  it("menampilkan pesan kosong", async () => {
    const { wrapper } = await setup();

    expect(wrapper.text()).toContain("Belum ada pengguna");
  });

  it("menampilkan kartu pengguna dengan foto dan inisial", async () => {
    const { wrapper } = await setup({
      users: [
        makeUser({ id: 1, name: "Abdullah", email: "a@delcom.org", photo: "http://127.0.0.1/img/a.png" }),
        makeUser({ id: 2, name: "budi", email: "b@delcom.org", photo: null }),
      ],
    });

    const cards = wrapper.findAll("[data-testid=user-card]");
    expect(cards).toHaveLength(2);
    expect(cards[0].find("img").attributes("src")).toBe("http://127.0.0.1/img/a.png");
    expect(cards[1].find("img").exists()).toBe(false);
    expect(cards[1].text()).toContain("B");
    expect(cards[1].text()).toContain("b@delcom.org");
  });
});
