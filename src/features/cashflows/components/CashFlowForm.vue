<script setup lang="ts">
import { reactive, watch } from "vue";
import { Save } from "lucide-vue-next";
import type {
  CashFlowPayload,
  CashFlowSource,
  CashFlowType,
} from "../api/cashFlowApi";
import { showErrorDialog } from "../../../helpers/toolsHelper";

const props = defineProps<{
  initial: CashFlowPayload | null;
  labels: string[];
  loading: boolean;
  submitText: string;
}>();

const emit = defineEmits<{
  (e: "submit", payload: CashFlowPayload): void;
  (e: "cancel"): void;
}>();

const form = reactive({
  type: "inflow" as CashFlowType,
  source: "cash" as CashFlowSource,
  label: "",
  nominal: "",
  description: "",
});

watch(
  () => props.initial,
  (initial) => {
    if (initial) {
      form.type = initial.type;
      form.source = initial.source;
      form.label = initial.label;
      form.nominal = String(initial.nominal);
      form.description = initial.description;
    }
  },
  { immediate: true }
);

function onSubmit() {
  const nominal = Number(form.nominal);

  if (!form.label.trim() || !(nominal > 0)) {
    showErrorDialog("Label dan nominal (lebih dari 0) wajib diisi");
    return;
  }

  emit("submit", {
    type: form.type,
    source: form.source,
    label: form.label.trim(),
    nominal,
    description: form.description.trim(),
  });
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600";
</script>

<template>
  <form class="space-y-4" data-testid="cash-flow-form" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="cf-type" :class="labelClass">Jenis Arus Kas</label>
        <select id="cf-type" v-model="form.type" :class="inputClass">
          <option value="inflow">Pemasukan (Inflow)</option>
          <option value="outflow">Pengeluaran (Outflow)</option>
        </select>
      </div>
      <div>
        <label for="cf-source" :class="labelClass">Sumber Dana</label>
        <select id="cf-source" v-model="form.source" :class="inputClass">
          <option value="cash">Tunai</option>
          <option value="savings">Tabungan</option>
          <option value="loans">Pinjaman</option>
        </select>
      </div>
    </div>

    <div>
      <label for="cf-label" :class="labelClass">Label Kategori</label>
      <input
        id="cf-label"
        v-model="form.label"
        type="text"
        list="cf-label-options"
        placeholder="mis. gaji, alat-mandi"
        :class="inputClass" />
      <datalist id="cf-label-options">
        <option v-for="label in labels" :key="label" :value="label" />
      </datalist>
    </div>

    <div>
      <label for="cf-nominal" :class="labelClass">Nominal (Rupiah)</label>
      <input
        id="cf-nominal"
        v-model="form.nominal"
        type="number"
        min="1"
        placeholder="0"
        :class="inputClass" />
    </div>

    <div>
      <label for="cf-description" :class="labelClass">Keterangan</label>
      <textarea
        id="cf-description"
        v-model="form.description"
        rows="3"
        placeholder="Catatan singkat transaksi"
        :class="inputClass" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        data-testid="cancel-button"
        @click="emit('cancel')">
        Batal
      </button>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        :disabled="loading">
        <Save class="h-4 w-4" />
        {{ loading ? "Menyimpan..." : submitText }}
      </button>
    </div>
  </form>
</template>
