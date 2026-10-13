import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import AddModal from "./AddModal.vue";

async function setup(show: boolean) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore(pinia);
  const spy = vi.spyOn(store, "asyncAddCashFlow").mockResolvedValue(undefined);
  const result = await renderWithProviders(AddModal, { pinia, props: { show } });
  return { store, spy, ...result };
}

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof setup>>["wrapper"]) {
  await wrapper.find("#cf-label").setValue("gaji");
  await wrapper.find("#cf-nominal").setValue("2500000");
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("AddModal", () => {
  it("tidak merender apa pun saat show=false", async () => {
    const { wrapper } = await setup(false);

    expect(wrapper.find("[data-testid=add-modal]").exists()).toBe(false);
  });

  it("menampilkan formulir dengan daftar label dari store", async () => {
    const pinia = createMockPinia();
    useCashFlowsStore(pinia).$patch({ labels: ["gaji"] });
    const { wrapper } = await renderWithProviders(AddModal, { pinia, props: { show: true } });

    expect(wrapper.text()).toContain("Tambah Transaksi");
    expect(wrapper.findAll("datalist option")).toHaveLength(1);
  });

  it("menyimpan transaksi lalu memancarkan saved dan close", async () => {
    const { wrapper, store, spy } = await setup(true);
    spy.mockImplementation(async () => {
      store.isCashFlowAdded = true;
    });

    await fillAndSubmit(wrapper);

    expect(spy).toHaveBeenCalledWith({
      type: "inflow",
      source: "cash",
      label: "gaji",
      nominal: 2500000,
      description: "",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("tidak menutup modal bila penyimpanan gagal", async () => {
    const { wrapper } = await setup(true);

    await fillAndSubmit(wrapper);

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

    store.isCashFlowAdd = true;
    await flushPromises();

    expect(wrapper.find("button[type=submit]").text()).toBe("Menyimpan...");
  });
});
