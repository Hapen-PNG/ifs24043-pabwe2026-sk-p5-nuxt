<script setup lang="ts">
import { RouterLink } from "vue-router";
import { LayoutDashboard, UserCircle, Users, X } from "lucide-vue-next";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const menus = [
  { to: "/", label: "Ringkasan Arus Kas", icon: LayoutDashboard },
  { to: "/users", label: "Direktori Pengguna", icon: Users },
  { to: "/profile", label: "Profil Saya", icon: UserCircle },
];
</script>

<template>
  <div>
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
      data-testid="sidebar-overlay"
      @click="emit('close')" />

    <aside
      class="fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-slate-100 bg-white p-4 transition-transform lg:translate-x-0"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
      data-testid="sidebar">
      <div class="mb-4 flex items-center justify-between lg:hidden">
        <span class="text-sm font-bold text-slate-600">Menu</span>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Tutup menu"
          data-testid="close-sidebar"
          @click="emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>

      <nav class="space-y-1">
        <RouterLink
          v-for="menu in menus"
          :key="menu.to"
          :to="menu.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          exact-active-class="!bg-indigo-50 !text-indigo-600"
          @click="emit('close')">
          <component :is="menu.icon" class="h-4 w-4" />
          {{ menu.label }}
        </RouterLink>
      </nav>
    </aside>
  </div>
</template>
