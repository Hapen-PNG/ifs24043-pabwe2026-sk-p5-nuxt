<script setup lang="ts">
import { watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { getAccessToken } from "./helpers/apiHelper";

const route = useRoute();
const router = useRouter();

// Penjaga rute: halaman terproteksi butuh token, halaman auth hanya untuk tamu.
watch(
  () => route.fullPath,
  () => {
    const hasToken = !!getAccessToken();

    if (route.meta.requiresAuth && !hasToken) {
      router.replace("/auth/login");
    } else if (route.meta.guestOnly && hasToken) {
      router.replace("/");
    }
  },
  { immediate: true }
);
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>