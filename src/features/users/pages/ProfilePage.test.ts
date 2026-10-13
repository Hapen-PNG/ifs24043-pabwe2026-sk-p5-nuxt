import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showErrorDialog: vi.fn(), showSuccessDialog: vi.fn() };
});

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useUsersStore } from "../states/usersStore";
import type { User } from "../api/userApi";
import ProfilePage from "./ProfilePage.vue";

const profile: User = {
  id: 1,
  name: "Abdullah Ubaid",
  email: "ifs18005@del.ac.id",
  email_verified_at: null,
  photo: null,
  created_at: "2024-10-05T02:53:38.000000Z",
  updated_at: "2024-10-05T02:53:38.000000Z",
};

async function setup(initial: Partial<{ profile: User | null }> = {}) {
  const pinia = createMockPinia();
  const store = useUsersStore(pinia);
  const spies = {
    getProfile: vi.spyOn(store, "asyncGetProfile").mockResolvedValue(undefined),
    changeProfile: vi.spyOn(store, "asyncChangeProfile").mockResolvedValue(undefined),
    changePhoto: vi.spyOn(store, "asyncChangePhoto").mockResolvedValue(undefined),
    changePassword: vi.spyOn(store, "asyncChangePassword").mockResolvedValue(undefined),
  };
  store.$patch(initial);
  const result = await renderWithProviders(ProfilePage, { pinia });
  return { store, spies, ...result };
}

async function selectFile(
  wrapper: Awaited<ReturnType<typeof setup>>["wrapper"],
  files: unknown
) {
  const input = wrapper.find("[data-testid=photo-input]");
  Object.defineProperty(input.element, "files", { value: files, configurable: true });
  await input.trigger("change");
  await flushPromises();
}

async function fillPassword(
  wrapper: Awaited<ReturnType<typeof setup>>["wrapper"],
  values: [string, string, string]
) {
  await wrapper.find("#profile-password").setValue(values[0]);
  await wrapper.find("#profile-new-password").setValue(values[1]);
  await wrapper.find("#profile-confirm-password").setValue(values[2]);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ProfilePage", () => {
  it("memuat profil dan mengisi formulir saat profil tersedia kemudian", async () => {
    const { wrapper, store, spies } = await setup();

    expect(spies.getProfile).toHaveBeenCalledTimes(1);
    expect((wrapper.find("#profile-name").element as HTMLInputElement).value).toBe("");

    store.$patch({ profile });
    await flushPromises();

    expect((wrapper.find("#profile-name").element as HTMLInputElement).value).toBe(
      "Abdullah Ubaid"
    );
    expect((wrapper.find("#profile-email").element as HTMLInputElement).value).toBe(
      "ifs18005@del.ac.id"
    );
  });

  it("menampilkan foto bila tersedia dan inisial bila tidak", async () => {
    const withPhoto = await setup({
      profile: { ...profile, photo: "http://127.0.0.1/img/a.png" },
    });
    expect(withPhoto.wrapper.find("img").attributes("src")).toBe("http://127.0.0.1/img/a.png");

    const withoutPhoto = await setup({ profile });
    expect(withoutPhoto.wrapper.find("img").exists()).toBe(false);
    expect(withoutPhoto.wrapper.text()).toContain("A");
  });

  it("menolak simpan profil bila kolom kosong", async () => {
    const { wrapper, spies } = await setup();

    await wrapper.find("[data-testid=profile-form]").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith("Nama dan email wajib diisi");
    expect(spies.changeProfile).not.toHaveBeenCalled();
  });

  it("menyimpan profil", async () => {
    const { wrapper, spies } = await setup({ profile });

    await wrapper.find("#profile-name").setValue(" Nama Baru ");
    await wrapper.find("[data-testid=profile-form]").trigger("submit");

    expect(spies.changeProfile).toHaveBeenCalledWith("Nama Baru", "ifs18005@del.ac.id");
  });

  it("menyimpan profil dengan email yang diubah", async () => {
    const { wrapper, spies } = await setup({ profile });

    await wrapper.find("#profile-email").setValue(" baru@del.ac.id ");
    await wrapper.find("[data-testid=profile-form]").trigger("submit");

    expect(spies.changeProfile).toHaveBeenCalledWith("Abdullah Ubaid", "baru@del.ac.id");
  });

  it("mengabaikan pemilihan foto bila files null atau kosong", async () => {
    const { wrapper, spies } = await setup();

    await selectFile(wrapper, null);
    await selectFile(wrapper, []);

    expect(spies.changePhoto).not.toHaveBeenCalled();
  });

  it("mengunggah foto yang dipilih", async () => {
    const { wrapper, spies } = await setup();
    const file = new File(["x"], "foto.png", { type: "image/png" });

    await selectFile(wrapper, [file]);

    expect(spies.changePhoto).toHaveBeenCalledWith(file);
  });

  it("menolak ubah kata sandi bila kolom wajib kosong", async () => {
    const { wrapper, spies } = await setup();

    await wrapper.find("[data-testid=password-form]").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Kata sandi lama dan kata sandi baru wajib diisi"
    );
    expect(spies.changePassword).not.toHaveBeenCalled();
  });

  it("menolak ubah kata sandi bila hanya kata sandi lama yang diisi", async () => {
    const { wrapper, spies } = await setup();

    await fillPassword(wrapper, ["lama", "", ""]);
    await wrapper.find("[data-testid=password-form]").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Kata sandi lama dan kata sandi baru wajib diisi"
    );
    expect(spies.changePassword).not.toHaveBeenCalled();
  });

  it("menolak ubah kata sandi bila konfirmasi tidak cocok", async () => {
    const { wrapper, spies } = await setup();

    await fillPassword(wrapper, ["lama", "baru123", "beda"]);
    await wrapper.find("[data-testid=password-form]").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith("Konfirmasi kata sandi baru tidak cocok");
    expect(spies.changePassword).not.toHaveBeenCalled();
  });

  it("mengosongkan kolom setelah kata sandi berhasil diubah", async () => {
    const { wrapper, store, spies } = await setup();
    spies.changePassword.mockImplementation(async () => {
      store.isPasswordChanged = true;
    });

    await fillPassword(wrapper, ["lama", "baru123", "baru123"]);
    await wrapper.find("[data-testid=password-form]").trigger("submit");
    await flushPromises();

    expect(spies.changePassword).toHaveBeenCalledWith("lama", "baru123", "baru123");
    expect((wrapper.find("#profile-password").element as HTMLInputElement).value).toBe("");
    expect((wrapper.find("#profile-new-password").element as HTMLInputElement).value).toBe("");
    expect((wrapper.find("#profile-confirm-password").element as HTMLInputElement).value).toBe("");
  });

  it("mempertahankan kolom bila ubah kata sandi gagal", async () => {
    const { wrapper } = await setup();

    await fillPassword(wrapper, ["lama", "baru123", "baru123"]);
    await wrapper.find("[data-testid=password-form]").trigger("submit");
    await flushPromises();

    expect((wrapper.find("#profile-password").element as HTMLInputElement).value).toBe("lama");
  });

  it("menampilkan status proses pada tombol dan label", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isPhotoChange: true, isProfileChange: true, isPasswordChange: true });
    await flushPromises();

    expect(wrapper.text()).toContain("Mengunggah...");
    expect(wrapper.findAll("button[type=submit]").map((b) => b.text())).toEqual([
      "Menyimpan...",
      "Menyimpan...",
    ]);
  });
});