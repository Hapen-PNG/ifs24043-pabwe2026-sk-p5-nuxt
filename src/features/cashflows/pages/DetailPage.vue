<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-vue-next";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import {
  formatDateTime,
  formatRupiah,
  getSourceLabel,
  getTypeBadgeClass,
  getTypeLabel,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";

const route = useRoute();
const router = useRouter();
const store = useCashFlowsStore();

const cashFlowId = computed(() => String(route.params.cashFlowId));
const showChange = ref(false);

function loadDetail() {
  return store.asyncGetCashFlow(cashFlowId.value);
}

onMounted(loadDetail);

async function onDelete() {
  const confirmed = await showConfirmDialog(
    "Hapus transaksi?",
    "Transaksi ini akan dihapus permanen."
  );

  if (!confirmed) {
    return;
  }

  await store.asyncDeleteCashFlow(cashFlowId.value);

  if (store.isCashFlowDeleted) {
    router.push("/");
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-4">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600">
      <ArrowLeft class="h-4 w-4" />
      Kembali
    </RouterLink>

    <p v-if="store.isCashFlow" class="py-10 text-center text-slate-600">
      Memuat rincian transaksi...
    </p>
    <p
      v-else-if="!store.cashFlow"
      class="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-slate-600">
      Transaksi tidak ditemukan.
    </p>
    <div
      v-else
      class="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
      data-testid="detail-card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-600">Label</p>
          <h1 class="text-2xl font-extrabold text-slate-900">{{ store.cashFlow.label }}</h1>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-bold"
          :class="getTypeBadgeClass(store.cashFlow.type)">
          {{ getTypeLabel(store.cashFlow.type) }}
        </span>
      </div>

      <p class="text-3xl font-extrabold text-slate-900" data-testid="detail-nominal">
        {{ formatRupiah(store.cashFlow.nominal) }}
      </p>

      <dl class="grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-bold uppercase tracking-wide text-slate-600">Sumber Dana</dt>
          <dd class="mt-1 font-semibold text-slate-800">
            {{ getSourceLabel(store.cashFlow.source) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase tracking-wide text-slate-600">Keterangan</dt>
          <dd class="mt-1 text-slate-800" data-testid="detail-description">
            {{ store.cashFlow.description || "-" }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase tracking-wide text-slate-600">Dibuat</dt>
          <dd class="mt-1 text-slate-800">{{ formatDateTime(store.cashFlow.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase tracking-wide text-slate-600">Diperbarui</dt>
          <dd class="mt-1 text-slate-800">{{ formatDateTime(store.cashFlow.updated_at) }}</dd>
        </div>
      </dl>

      <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          data-testid="edit-button"
          @click="showChange = true">
          <Pencil class="h-4 w-4" />
          Ubah
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          data-testid="delete-button"
          @click="onDelete">
          <Trash2 class="h-4 w-4" />
          Hapus
        </button>
      </div>
    </div>

    <ChangeModal
      :show="showChange"
      :cash-flow="store.cashFlow"
      @close="showChange = false"
      @saved="loadDetail" />
  </section>
</template>
