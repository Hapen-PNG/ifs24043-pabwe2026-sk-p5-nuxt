<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  Banknote,
  Eye,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  RotateCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import {
  useCashFlowsStore,
  type CashFlow,
  type CashFlowQueryParams,
} from "../states/cashFlowsStore";
import {
  formatDate,
  formatRupiah,
  formatSignedRupiah,
  getSourceLabel,
  getTypeBadgeClass,
  getTypeLabel,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";

const store = useCashFlowsStore();

const filters = reactive({ type: "", source: "", label: "", start: "", end: "" });
const showAdd = ref(false);
const showChange = ref(false);
const selected = ref<CashFlow | null>(null);

const query = computed<CashFlowQueryParams>(() => ({
  type: filters.type as CashFlowQueryParams["type"],
  source: filters.source as CashFlowQueryParams["source"],
  label: filters.label,
  start_date: filters.start ? `${filters.start} 00:00:00` : "",
  end_date: filters.end ? `${filters.end} 23:59:59` : "",
}));

const cards = computed(() => [
  {
    title: "Total Saldo Kas Bersih",
    value: store.stats.cashflow,
    icon: Wallet,
    tone: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Total Pemasukan",
    value: store.stats.total_inflow,
    icon: TrendingUp,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Total Pengeluaran",
    value: store.stats.total_outflow,
    icon: TrendingDown,
    tone: "bg-rose-100 text-rose-700",
  },
  {
    title: "Saldo Kas Tunai",
    value: store.stats.cash,
    icon: Banknote,
    tone: "bg-sky-100 text-sky-600",
  },
  {
    title: "Saldo Rekening Tabungan",
    value: store.stats.savings,
    icon: PiggyBank,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    title: "Saldo Pinjaman",
    value: store.stats.loans,
    icon: Landmark,
    tone: "bg-violet-100 text-violet-600",
  },
]);

function loadCashFlows() {
  return store.asyncGetCashFlows(query.value);
}

async function loadAll() {
  await Promise.all([loadCashFlows(), store.asyncGetLabels()]);
}

onMounted(loadAll);

watch(filters, () => {
  loadCashFlows();
});

function resetFilters() {
  Object.assign(filters, { type: "", source: "", label: "", start: "", end: "" });
}

function openChange(item: CashFlow) {
  selected.value = item;
  showChange.value = true;
}

async function onDelete(item: CashFlow) {
  const confirmed = await showConfirmDialog(
    "Hapus transaksi?",
    `Transaksi "${item.label}" akan dihapus permanen.`
  );

  if (!confirmed) {
    return;
  }

  await store.asyncDeleteCashFlow(item.id);

  if (store.isCashFlowDeleted) {
    await loadAll();
  }
}

async function onResetAll() {
  const confirmed = await showConfirmDialog(
    "Reset semua transaksi?",
    "Seluruh catatan arus kas Anda akan dihapus permanen."
  );

  if (!confirmed) {
    return;
  }

  await store.asyncDeleteAllCashFlows();

  if (store.isCashFlowDeletedAll) {
    await loadAll();
  }
}

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500";
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Ringkasan Arus Kas</h1>
        <p class="text-sm text-slate-600">Pantau pemasukan, pengeluaran, dan saldo Anda.</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          data-testid="reset-all-button"
          @click="onResetAll">
          <RotateCcw class="h-4 w-4" />
          Reset Semua
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          data-testid="add-button"
          @click="showAdd = true">
          <Plus class="h-4 w-4" />
          Tambah Transaksi
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="card in cards"
        :key="card.title"
        data-testid="stat-card"
        class="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl" :class="card.tone">
          <component :is="card.icon" class="h-6 w-6" />
        </span>
        <div>
          <p class="text-xs font-semibold text-slate-600">{{ card.title }}</p>
          <p class="text-lg font-extrabold text-slate-900">{{ formatRupiah(card.value) }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      <select v-model="filters.type" :class="selectClass" aria-label="Filter jenis" data-testid="filter-type">
        <option value="">Semua Jenis</option>
        <option value="inflow">Pemasukan</option>
        <option value="outflow">Pengeluaran</option>
      </select>
      <select v-model="filters.source" :class="selectClass" aria-label="Filter sumber" data-testid="filter-source">
        <option value="">Semua Sumber</option>
        <option value="cash">Tunai</option>
        <option value="savings">Tabungan</option>
        <option value="loans">Pinjaman</option>
      </select>
      <select v-model="filters.label" :class="selectClass" aria-label="Filter label" data-testid="filter-label">
        <option value="">Semua Label</option>
        <option v-for="label in store.labels" :key="label" :value="label">{{ label }}</option>
      </select>
      <input
        v-model="filters.start"
        type="date"
        :class="selectClass"
        aria-label="Tanggal awal"
        data-testid="filter-start" />
      <input
        v-model="filters.end"
        type="date"
        :class="selectClass"
        aria-label="Tanggal akhir"
        data-testid="filter-end" />
      <button
        type="button"
        class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        data-testid="reset-filter-button"
        @click="resetFilters">
        Atur Ulang Filter
      </button>
    </div>

    <p v-if="store.isCashFlow" class="py-10 text-center text-slate-600">
      Memuat data arus kas...
    </p>
    <p
      v-else-if="store.cashFlows.length === 0"
      class="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-slate-600">
      Belum ada transaksi arus kas.
    </p>
    <template v-else>
      <div class="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-4 py-3">Tanggal</th>
              <th class="px-4 py-3">Label</th>
              <th class="px-4 py-3">Sumber</th>
              <th class="px-4 py-3">Jenis</th>
              <th class="px-4 py-3 text-right">Nominal</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in store.cashFlows" :key="item.id" data-testid="cash-flow-row">
              <td class="px-4 py-3 text-slate-600">{{ formatDate(item.created_at) }}</td>
              <td class="px-4 py-3 font-semibold text-slate-900">{{ item.label }}</td>
              <td class="px-4 py-3 text-slate-600">{{ getSourceLabel(item.source) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="getTypeBadgeClass(item.type)">
                  {{ getTypeLabel(item.type) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-bold text-slate-900">
                {{ formatSignedRupiah(item.type, item.nominal) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-1">
                  <RouterLink
                    :to="`/cash-flows/${item.id}`"
                    class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Lihat detail"
                    data-testid="detail-link">
                    <Eye class="h-4 w-4" />
                  </RouterLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Ubah"
                    data-testid="edit-button"
                    @click="openChange(item)">
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                    aria-label="Hapus"
                    data-testid="delete-button"
                    @click="onDelete(item)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 md:hidden">
        <article
          v-for="item in store.cashFlows"
          :key="item.id"
          data-testid="cash-flow-card"
          class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-900">{{ item.label }}</p>
              <p class="text-xs text-slate-600">
                {{ getSourceLabel(item.source) }} · {{ formatDate(item.created_at) }}
              </p>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-bold"
              :class="getTypeBadgeClass(item.type)">
              {{ getTypeLabel(item.type) }}
            </span>
          </div>
          <p class="mt-2 text-lg font-extrabold text-slate-900">
            {{ formatSignedRupiah(item.type, item.nominal) }}
          </p>
          <div class="mt-2 flex gap-1">
            <RouterLink
              :to="`/cash-flows/${item.id}`"
              class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Lihat detail">
              <Eye class="h-4 w-4" />
            </RouterLink>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Ubah"
              @click="openChange(item)">
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
              aria-label="Hapus"
              @click="onDelete(item)">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>
    </template>

    <AddModal :show="showAdd" @close="showAdd = false" @saved="loadAll" />
    <ChangeModal
      :show="showChange"
      :cash-flow="selected"
      @close="showChange = false"
      @saved="loadAll" />
  </section>
</template>
