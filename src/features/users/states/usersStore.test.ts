import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/userApi", () => ({
  getUsers: vi.fn(),
  getProfile: vi.fn(),
  putProfile: vi.fn(),
  postPhoto: vi.fn(),
  putPassword: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import {
  getProfile,
  getUsers,
  postPhoto,
  putPassword,
  putProfile,
  type User,
} from "../api/userApi";
import { getAccessToken, putAccessToken } from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";
import { createMockPinia } from "../../../test-utils";
import { useUsersStore } from "./usersStore";

const user: User = {
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  email_verified_at: null,
  photo: null,
  created_at: "2024-10-05T02:53:38.000000Z",
  updated_at: "2024-10-05T02:53:38.000000Z",
};

const success = (data: unknown, message = "Berhasil") => ({
  status: "success",
  message,
  data,
});
const fail = (message = "Gagal") => ({ status: "fail", message, data: null });

beforeEach(() => {
  vi.resetAllMocks();
  createMockPinia();
});

describe("usersStore", () => {
  it("asyncGetUsers mengisi daftar pengguna", async () => {
    vi.mocked(getUsers).mockResolvedValue(success({ users: [user] }));
    const store = useUsersStore();

    await store.asyncGetUsers();

    expect(store.users).toEqual([user]);
    expect(store.isUsers).toBe(false);
  });

  it("asyncGetUsers menampilkan error saat gagal", async () => {
    vi.mocked(getUsers).mockResolvedValue(fail("Unauthenticated."));
    const store = useUsersStore();

    await store.asyncGetUsers();

    expect(store.users).toEqual([]);
    expect(showErrorDialog).toHaveBeenCalledWith("Unauthenticated.");
  });

  it("asyncGetProfile mengisi profil", async () => {
    vi.mocked(getProfile).mockResolvedValue(success({ user }));
    const store = useUsersStore();

    await store.asyncGetProfile();

    expect(store.profile).toEqual(user);
    expect(store.isProfile).toBe(false);
  });

  it("asyncGetProfile menampilkan error saat gagal", async () => {
    vi.mocked(getProfile).mockResolvedValue(fail());
    const store = useUsersStore();

    await store.asyncGetProfile();

    expect(store.profile).toBeNull();
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
  });

  it("asyncGetProfile silent menghapus token tanpa dialog saat gagal", async () => {
    putAccessToken("expired");
    vi.mocked(getProfile).mockResolvedValue(fail("Unauthenticated."));
    const store = useUsersStore();

    await store.asyncGetProfile(true);

    expect(store.profile).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(showErrorDialog).not.toHaveBeenCalled();
  });

  it("asyncChangeProfile memperbarui profil", async () => {
    const updated = { ...user, name: "Baru" };
    vi.mocked(putProfile).mockResolvedValue(success({ user: updated }, "Berhasil mengubah data"));
    const store = useUsersStore();

    await store.asyncChangeProfile("Baru", user.email);

    expect(putProfile).toHaveBeenCalledWith("Baru", user.email);
    expect(store.profile).toEqual(updated);
    expect(store.isProfileChanged).toBe(true);
    expect(store.isProfileChange).toBe(false);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah data");
  });

  it("asyncChangeProfile menampilkan error saat gagal", async () => {
    vi.mocked(putProfile).mockResolvedValue(fail());
    const store = useUsersStore();

    await store.asyncChangeProfile("Baru", user.email);

    expect(store.isProfileChanged).toBe(false);
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
  });

  it("asyncChangePhoto mengunggah lalu memuat ulang profil", async () => {
    const file = new File(["x"], "foto.png");
    vi.mocked(postPhoto).mockResolvedValue(success(null, "Berhasil mengubah foto"));
    vi.mocked(getProfile).mockResolvedValue(success({ user }));
    const store = useUsersStore();

    await store.asyncChangePhoto(file);

    expect(postPhoto).toHaveBeenCalledWith(file);
    expect(store.isPhotoChanged).toBe(true);
    expect(store.isPhotoChange).toBe(false);
    expect(getProfile).toHaveBeenCalled();
    expect(store.profile).toEqual(user);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah foto");
  });

  it("asyncChangePhoto menampilkan error saat gagal", async () => {
    vi.mocked(postPhoto).mockResolvedValue(fail());
    const store = useUsersStore();

    await store.asyncChangePhoto(new File(["x"], "foto.png"));

    expect(store.isPhotoChanged).toBe(false);
    expect(getProfile).not.toHaveBeenCalled();
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
  });

  it("asyncChangePassword berhasil", async () => {
    vi.mocked(putPassword).mockResolvedValue(success(null, "Berhasil mengubah kata sandi"));
    const store = useUsersStore();

    await store.asyncChangePassword("lama", "baru", "baru");

    expect(putPassword).toHaveBeenCalledWith("lama", "baru", "baru");
    expect(store.isPasswordChanged).toBe(true);
    expect(store.isPasswordChange).toBe(false);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah kata sandi");
  });

  it("asyncChangePassword menampilkan error saat gagal", async () => {
    vi.mocked(putPassword).mockResolvedValue(fail());
    const store = useUsersStore();

    await store.asyncChangePassword("lama", "baru", "baru");

    expect(store.isPasswordChanged).toBe(false);
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
  });
});