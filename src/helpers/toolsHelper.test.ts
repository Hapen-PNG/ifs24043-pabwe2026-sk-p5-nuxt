import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

import Swal from "sweetalert2";
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  formatSignedRupiah,
  getSourceLabel,
  getTypeBadgeClass,
  getTypeLabel,
  resolvePhotoUrl,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "./toolsHelper";

const normalize = (text: string) => text.replace(/\s/g, " ");

beforeEach(() => {
  vi.mocked(Swal.fire).mockReset();
});

describe("dialog", () => {
  it("showSuccessDialog memanggil Swal dengan ikon success", () => {
    showSuccessDialog("Berhasil menambahkan data");

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "success", text: "Berhasil menambahkan data" })
    );
  });

  it("showErrorDialog memanggil Swal dengan ikon error", () => {
    showErrorDialog("Gagal");

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "error", text: "Gagal" })
    );
  });

  it("showConfirmDialog mengembalikan true saat dikonfirmasi", async () => {
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);

    await expect(showConfirmDialog("Hapus?", "Yakin?")).resolves.toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Hapus?", text: "Yakin?", showCancelButton: true })
    );
  });

  it("showConfirmDialog mengembalikan false saat dibatalkan", async () => {
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

    await expect(showConfirmDialog("Hapus?", "Yakin?")).resolves.toBe(false);
  });
});

describe("formatRupiah", () => {
  it("memformat angka ke Rupiah", () => {
    expect(normalize(formatRupiah(2500000))).toBe("Rp 2.500.000");
  });

  it("memformat string numerik", () => {
    expect(normalize(formatRupiah("1500"))).toBe("Rp 1.500");
  });

  it("menganggap nilai tidak valid sebagai nol", () => {
    expect(normalize(formatRupiah("abc"))).toBe("Rp 0");
  });
});

describe("formatDate & formatDateTime", () => {
  it("mengembalikan tanda strip untuk nilai kosong", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDateTime(null)).toBe("-");
  });

  it("memformat tanggal ke bahasa Indonesia", () => {
    const result = formatDate("2024-10-05T12:09:16.000000Z");

    expect(result).toContain("Oktober");
    expect(result).toContain("2024");
  });

  it("memformat tanggal dan jam (WIB)", () => {
    const result = formatDateTime("2024-10-05T12:09:16.000000Z");

    expect(result).toContain("2024");
    expect(result).toMatch(/19[.:]09/);
  });
});

describe("label & badge", () => {
  it("getSourceLabel menerjemahkan sumber dana", () => {
    expect(getSourceLabel("cash")).toBe("Tunai");
    expect(getSourceLabel("savings")).toBe("Tabungan");
    expect(getSourceLabel("loans")).toBe("Pinjaman");
  });

  it("getSourceLabel mengembalikan nilai asli bila tidak dikenal", () => {
    expect(getSourceLabel("crypto")).toBe("crypto");
  });

  it("getTypeLabel dan getTypeBadgeClass membedakan inflow/outflow", () => {
    expect(getTypeLabel("inflow")).toBe("Pemasukan");
    expect(getTypeLabel("outflow")).toBe("Pengeluaran");
    expect(getTypeBadgeClass("inflow")).toContain("emerald");
    expect(getTypeBadgeClass("outflow")).toContain("rose");
  });

  it("formatSignedRupiah memberi tanda + / -", () => {
    expect(normalize(formatSignedRupiah("inflow", 1000))).toBe("+Rp 1.000");
    expect(normalize(formatSignedRupiah("outflow", 1000))).toBe("-Rp 1.000");
  });
});

describe("resolvePhotoUrl", () => {
  const origin = new URL(DELCOM_BASEURL).origin;

  it("mengembalikan string kosong bila tidak ada foto", () => {
    expect(resolvePhotoUrl(null)).toBe("");
    expect(resolvePhotoUrl(undefined)).toBe("");
  });

  it("mempertahankan URL absolut", () => {
    expect(resolvePhotoUrl("http://127.0.0.1:8000/img/a.png")).toBe(
      "http://127.0.0.1:8000/img/a.png"
    );
  });

  it("menambahkan origin API untuk path relatif", () => {
    expect(resolvePhotoUrl("img/profile/1.png")).toBe(`${origin}/img/profile/1.png`);
    expect(resolvePhotoUrl("/img/profile/1.png")).toBe(`${origin}/img/profile/1.png`);
  });
});
