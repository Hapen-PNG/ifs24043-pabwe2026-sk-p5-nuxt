<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { LogOut, Menu, Wallet } from "lucide-vue-next";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import { resolvePhotoUrl, showConfirmDialog } from "../../../helpers/toolsHelper";

const emit = defineEmits<{ (e: "toggle"): void }>();

const router = useRouter();
const auth = useAuthStore();
const users = useUsersStore();

const displayName = computed(() => (users.profile ? users.profile.name : "Pengguna"));
const username = computed(() =>
  users.profile ? users.profile.email.split("@")[0] : "guest"
);
const photo = computed(() =>
  resolvePhotoUrl(users.profile ? users.profile.photo : null)
);
const initial = computed(() => displayName.value.charAt(0).toUpperCase());

async function onLogout() {
  const confirmed = await showConfirmDialog(
    "Keluar dari akun?",
    "Sesi Anda akan diakhiri."
  );

  if (!confirmed) {
    return;
  }

  await auth.asyncLogout();
  router.push("/auth/login");
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
        data-testid="toggle-sidebar"
        @click="emit('toggle')">
        <Menu class="h-5 w-5" />
      </button>
      <div class="flex items-center gap-2">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500">
          <Wallet class="h-5 w-5 text-white" />
        </span>
        <span class="hidden text-lg font-extrabold text-slate-900 sm:block">
          Delcom Cash Flow
        </span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-3">
        <img
          v-if="photo"
          :src="photo"
          :alt="displayName"
          class="h-9 w-9 rounded-full object-cover" />
        <span
          v-else
          class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600"
          data-testid="avatar-initial">
          {{ initial }}
        </span>
        <div class="hidden text-left sm:block">
          <p class="text-sm font-semibold leading-tight text-slate-900" data-testid="display-name">
            {{ displayName }}
          </p>
          <p class="text-xs leading-tight text-slate-600">
            @{{ username }} ·
            <span class="font-medium text-emerald-700">Sesi aktif</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        data-testid="logout-button"
        aria-label="Keluar"
        @click="onLogout">
        <LogOut class="h-4 w-4" aria-hidden="true" />
        <span class="hidden sm:inline">Keluar</span>
      </button>
    </div>
  </header>
</template>