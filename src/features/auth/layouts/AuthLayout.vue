<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { Wallet } from "lucide-vue-next";

const route = useRoute();
const isLogin = computed(() => route.path === "/auth/login");

const activeTab =
  "rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-indigo-600 shadow-sm";
const inactiveTab =
  "rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:text-slate-700";
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-10">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg">
          <Wallet class="h-7 w-7 text-white" />
        </div>
        <h1 class="text-3xl font-extrabold text-slate-900">Delcom Cash Flow</h1>
        <p class="mt-1 text-sm text-slate-600">
          Aplikasi Pencatat Arus Kas Pribadi
        </p>
      </div>

      <div class="rounded-3xl bg-white p-6 shadow-xl shadow-indigo-100">
        <div class="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          <RouterLink
            to="/auth/login"
            data-testid="tab-login"
            :class="isLogin ? activeTab : inactiveTab">
            Masuk Akun
          </RouterLink>
          <RouterLink
            to="/auth/register"
            data-testid="tab-register"
            :class="isLogin ? inactiveTab : activeTab">
            Daftar Baru
          </RouterLink>
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>