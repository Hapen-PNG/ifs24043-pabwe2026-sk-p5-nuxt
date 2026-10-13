<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <p class="text-7xl font-extrabold text-indigo-600">404</p>
    <h1 class="mt-4 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
    <p class="mt-2 text-slate-600">
      Halaman yang Anda cari tidak ada atau sudah dipindahkan.
    </p>
    <RouterLink
      to="/"
      class="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
      <ArrowLeft class="h-4 w-4" />
      Kembali ke Beranda
    </RouterLink>
  </div>
</template>
