<script setup lang="ts">
import { X } from "lucide-vue-next";
import CashFlowForm from "../components/CashFlowForm.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlowPayload } from "../api/cashFlowApi";

defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const store = useCashFlowsStore();

async function onSubmit(payload: CashFlowPayload) {
  await store.asyncAddCashFlow(payload);

  if (store.isCashFlowAdded) {
    emit("saved");
    emit("close");
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    data-testid="add-modal">
    <div class="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-extrabold text-slate-900">Tambah Transaksi</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Tutup"
          data-testid="close-modal"
          @click="emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>

      <CashFlowForm
        :initial="null"
        :labels="store.labels"
        :loading="store.isCashFlowAdd"
        submit-text="Simpan Transaksi"
        @submit="onSubmit"
        @cancel="emit('close')" />
    </div>
  </div>
</template>
