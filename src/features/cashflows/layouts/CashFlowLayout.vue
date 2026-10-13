<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import NavbarComponent from "../components/NavbarComponent.vue";
import SidebarComponent from "../components/SidebarComponent.vue";
import { useUsersStore } from "../../users/states/usersStore";
import { getAccessToken } from "../../../helpers/apiHelper";

const router = useRouter();
const users = useUsersStore();
const sidebarOpen = ref(false);

onMounted(async () => {
  await users.asyncGetProfile();

  // Token yang kedaluwarsa dihapus oleh apiHelper (HTTP 401) -> kembali ke login.
  if (!getAccessToken()) {
    router.replace("/auth/login");
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <NavbarComponent @toggle="sidebarOpen = !sidebarOpen" />
    <SidebarComponent :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="p-4 sm:p-6 lg:ml-64">
      <RouterView />
    </div>
  </div>
</template>