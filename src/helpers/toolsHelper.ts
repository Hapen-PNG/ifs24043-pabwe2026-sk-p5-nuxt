import Swal from "sweetalert2";

export function showSuccessDialog(message: string) {
  return Swal.fire({
    icon: "success",
    title: "Berhasil",
    text: message,
    confirmButtonColor: "#4f46e5",
  });
}

export function showErrorDialog(message: string) {
  return Swal.fire({
    icon: "error",
    title: "Gagal",
    text: message,
    confirmButtonColor: "#4f46e5",
  });
}

export async function showConfirmDialog(
  title: string,
  text: string
): Promise<boolean> {
  const result = await Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
    confirmButtonColor: "#dc2626",
  });

  return result.isConfirmed;
}

export function formatRupiah(value: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export const SOURCE_LABELS: Record<string, string> = {
  cash: "Tunai",
  savings: "Tabungan",
  loans: "Pinjaman",
};

export function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function getTypeLabel(type: string): string {
  return type === "inflow" ? "Pemasukan" : "Pengeluaran";
}

export function getTypeBadgeClass(type: string): string {
  return type === "inflow"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";
}

export function formatSignedRupiah(type: string, nominal: number | string): string {
  return `${type === "inflow" ? "+" : "-"}${formatRupiah(nominal)}`;
}

/**
 * Foto profil dari API dapat berupa URL absolut atau path relatif (mis. `img/profile/1.png`).
 */
export function resolvePhotoUrl(photo?: string | null): string {
  if (!photo) {
    return "";
  }

  if (photo.startsWith("http")) {
    return photo;
  }

  return `${new URL(DELCOM_BASEURL).origin}/${photo.replace(/^\//, "")}`;
}
