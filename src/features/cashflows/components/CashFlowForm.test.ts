import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showErrorDialog: vi.fn() };
});

import { showErrorDialog } from "../../../helpers/toolsHelper";
import type { CashFlowPayload } from "../api/cashFlowApi";
import CashFlowForm from "./CashFlowForm.vue";

const baseProps = {
  initial: null as CashFlowPayload | null,
  labels: ["gaji", "alat-mandi"],
  loading: false,
  submitText: "Simpan Transaksi",
};

const initial: CashFlowPayload = {
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard",
  nominal: 400000,
};

const value = (wrapper: ReturnType<typeof mount>, selector: string) =>
  (wrapper.find(selector).element as HTMLInputElement).value;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CashFlowForm", () => {
  it("memakai nilai bawaan saat initial null", () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    expect(value(wrapper, "#cf-type")).toBe("inflow");
    expect(value(wrapper, "#cf-source")).toBe("cash");
    expect(value(wrapper, "#cf-label")).toBe("");
    expect(value(wrapper, "#cf-nominal")).toBe("");
    expect(wrapper.findAll("datalist option")).toHaveLength(2);
    expect(wrapper.find("button[type=submit]").text()).toBe("Simpan Transaksi");
  });

  it("mengisi formulir dari data initial", () => {
    const wrapper = mount(CashFlowForm, { props: { ...baseProps, initial } });

    expect(value(wrapper, "#cf-type")).toBe("outflow");
    expect(value(wrapper, "#cf-source")).toBe("savings");
    expect(value(wrapper, "#cf-label")).toBe("alat-elektronik");
    expect(value(wrapper, "#cf-nominal")).toBe("400000");
    expect(value(wrapper, "#cf-description")).toBe("Membeli keyboard");
  });

  it("menolak submit bila label kosong", async () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    await wrapper.find("#cf-nominal").setValue("1000");
    await wrapper.find("form").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith("Label dan nominal (lebih dari 0) wajib diisi");
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("menolak submit bila nominal bukan angka positif", async () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    await wrapper.find("#cf-label").setValue("gaji");
    await wrapper.find("#cf-nominal").setValue("0");
    await wrapper.find("form").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalled();
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("memancarkan payload yang sudah dirapikan", async () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    await wrapper.find("#cf-type").setValue("outflow");
    await wrapper.find("#cf-source").setValue("loans");
    await wrapper.find("#cf-label").setValue("  gaji ");
    await wrapper.find("#cf-nominal").setValue("2500000");
    await wrapper.find("#cf-description").setValue("  Gaji bulanan ");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")![0]).toEqual([
      {
        type: "outflow",
        source: "loans",
        label: "gaji",
        nominal: 2500000,
        description: "Gaji bulanan",
      },
    ]);
  });

  it("menampilkan status menyimpan dan menonaktifkan tombol", () => {
    const wrapper = mount(CashFlowForm, { props: { ...baseProps, loading: true } });

    const button = wrapper.find("button[type=submit]");
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("memancarkan cancel dari tombol Batal", async () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    await wrapper.find("[data-testid=cancel-button]").trigger("click");

    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("memperbarui formulir ketika initial berubah", async () => {
    const wrapper = mount(CashFlowForm, { props: baseProps });

    await wrapper.setProps({ initial });

    expect(value(wrapper, "#cf-label")).toBe("alat-elektronik");
  });
});
