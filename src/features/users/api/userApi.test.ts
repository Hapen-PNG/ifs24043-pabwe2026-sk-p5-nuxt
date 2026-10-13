import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiGet, apiPost, apiPut } from "../../../helpers/apiHelper";
import { getProfile, getUsers, postPhoto, putPassword, putProfile } from "./userApi";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("userApi", () => {
  it("getUsers memanggil GET /users", async () => {
    const response = { status: "success", message: "ok", data: { users: [] } };
    vi.mocked(apiGet).mockResolvedValue(response);

    await expect(getUsers()).resolves.toBe(response);
    expect(apiGet).toHaveBeenCalledWith("/users");
  });

  it("getProfile memanggil GET /users/me", async () => {
    await getProfile();

    expect(apiGet).toHaveBeenCalledWith("/users/me");
  });

  it("putProfile memanggil PUT /users/me", async () => {
    await putProfile("Nama", "a@b.c");

    expect(apiPut).toHaveBeenCalledWith("/users/me", { name: "Nama", email: "a@b.c" });
  });

  it("postPhoto mengunggah berkas sebagai FormData", async () => {
    const file = new File(["x"], "foto.png", { type: "image/png" });

    await postPhoto(file);

    const [path, body] = vi.mocked(apiPost).mock.calls[0];
    expect(path).toBe("/users/me/photo");
    expect(body).toBeInstanceOf(FormData);
    expect(((body as FormData).get("photo") as File).name).toBe("foto.png");
  });

  it("putPassword memanggil PUT /users/password", async () => {
    await putPassword("lama", "baru", "baru");

    expect(apiPut).toHaveBeenCalledWith("/users/password", {
      password: "lama",
      new_password: "baru",
      new_password_confirmation: "baru",
    });
  });
});
