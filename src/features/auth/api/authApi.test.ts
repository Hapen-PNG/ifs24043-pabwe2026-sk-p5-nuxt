import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({ apiPost: vi.fn() }));

import { apiPost } from "../../../helpers/apiHelper";
import { postLogin, postLogout, postRegister } from "./authApi";

beforeEach(() => {
  vi.mocked(apiPost).mockReset();
});

describe("authApi", () => {
  it("postLogin mengirim email dan password ke /auth/login", async () => {
    const response = { status: "success", message: "ok", data: { token: "t" } };
    vi.mocked(apiPost).mockResolvedValue(response);

    await expect(postLogin("a@b.c", "123456")).resolves.toBe(response);
    expect(apiPost).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.c",
      password: "123456",
    });
  });

  it("postRegister mengirim data pendaftaran ke /auth/register", async () => {
    const response = { status: "success", message: "ok", data: null };
    vi.mocked(apiPost).mockResolvedValue(response);

    await expect(postRegister("Nama", "a@b.c", "123456")).resolves.toBe(response);
    expect(apiPost).toHaveBeenCalledWith("/auth/register", {
      name: "Nama",
      email: "a@b.c",
      password: "123456",
    });
  });

  it("postLogout memanggil /auth/logout", async () => {
    const response = { status: "success", message: "ok", data: null };
    vi.mocked(apiPost).mockResolvedValue(response);

    await expect(postLogout()).resolves.toBe(response);
    expect(apiPost).toHaveBeenCalledWith("/auth/logout");
  });
});
