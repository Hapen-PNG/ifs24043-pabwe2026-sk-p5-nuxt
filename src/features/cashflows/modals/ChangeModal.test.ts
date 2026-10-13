import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow } from "../api/cashFlowApi";
import ChangeModal from "./ChangeModal.vue";

const item: CashFlow = {
  id: 4,
  user_id: 1,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard",
  nominal: 400000,
  created_at: "2024-10-05T12:09:16.000000Z",
  updated_at: "2024-10-05T12:09:16.000000Z",
};

async function setup(show: boolean) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore(pinia);
  const spy = vi.spyOn(store, "asyncChangeCashFlow").mockResolvedValue(undefined);
  const result = await renderWithProviders(ChangeModal, {
    pinia,
    props: { show, cashFlow: item },
  });
  return { store, spy, ...result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ChangeModal", () => {
  it("tidak merender apa pun saat show=false", async () => {
    const { wrapper } = await setup(false);

    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(false);
  });

  it("mengisi formulir dengan data transaksi", async () => {
    const { wrapper } = await setup(true);

    expect(wrapper.text()).toContain("Ubah Transaksi");
    expect((wrapper.find("#cf-label").element as HTMLInputElement).value).toBe("alat-elektronik");
    expect((wrapper.find("#cf-nominal").element as HTMLInputElement).value).toBe("400000");
  });

  it("menyimpan perubahan lalu memancarkan saved dan close", async () => {
    const { wrapper, store, spy } = await setup(true);
    spy.mockImplementation(async () => {
      store.isCashFlowChanged = true;
    });

    await wrapper.find("#cf-label").setValue("keyboard");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(4, {
      type: "outflow",
      source: "savings",
      label: "keyboard",
      nominal: 400000,
      description: "Membeli keyboard",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("tidak menutup modal bila perubahan gagal", async () => {
    const { wrapper } = await setup(true);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("memancarkan close dari tombol tutup dan Batal", async () => {
    const { wrapper } = await setup(true);

    await wrapper.find("[data-testid=close-modal]").trigger("click");
    await wrapper.find("[data-testid=cancel-button]").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(2);
  });

  it("menampilkan status menyimpan", async () => {
    const { wrapper, store } = await setup(true);

    store.isCashFlowChange = true;
    await flushPromises();

    expect(wrapper.find("button[type=submit]").text()).toBe("Menyimpan...");
  });
});
