<script setup lang="ts">
import { onMounted } from "vue";
import { useUsersStore } from "../states/usersStore";
import { formatDate, resolvePhotoUrl } from "../../../helpers/toolsHelper";

const store = useUsersStore();

onMounted(() => {
  store.asyncGetUsers();
});
</script>

<template>
  <section>
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-slate-900">Direktori Pengguna</h1>
      <p class="text-sm text-slate-600">Daftar seluruh pengguna yang terdaftar di sistem.</p>
    </div>

    <p v-if="store.isUsers" class="py-10 text-center text-slate-600">
      Memuat data pengguna...
    </p>
    <p
      v-else-if="store.users.length === 0"
      class="py-10 text-center text-slate-600">
      Belum ada pengguna.
    </p>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="user in store.users"
        :key="user.id"
        data-testid="user-card"
        class="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <img
          v-if="resolvePhotoUrl(user.photo)"
          :src="resolvePhotoUrl(user.photo)"
          :alt="user.name"
          class="h-12 w-12 rounded-full object-cover" />
        <span
          v-else
          class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
          {{ user.name.charAt(0).toUpperCase() }}
        </span>
        <div class="min-w-0">
          <p class="truncate font-semibold text-slate-900">{{ user.name }}</p>
          <p class="truncate text-sm text-slate-600">{{ user.email }}</p>
          <p class="text-xs text-slate-600">Bergabung {{ formatDate(user.created_at) }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
