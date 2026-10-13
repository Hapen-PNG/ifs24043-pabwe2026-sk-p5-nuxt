<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { Camera, KeyRound, Save } from "lucide-vue-next";
import { useUsersStore } from "../states/usersStore";
import { useInput } from "../../../hooks/useInput";
import { resolvePhotoUrl, showErrorDialog } from "../../../helpers/toolsHelper";

const store = useUsersStore();

const [name, onChangeName] = useInput("");
const [email, onChangeEmail] = useInput("");
const [password, onChangePassword, resetPassword] = useInput("");
const [newPassword, onChangeNewPassword, resetNewPassword] = useInput("");
const [confirmPassword, onChangeConfirmPassword, resetConfirmPassword] = useInput("");

const photoUrl = computed(() =>
  resolvePhotoUrl(store.profile ? store.profile.photo : null)
);
const initial = computed(() => name.value.charAt(0).toUpperCase());

watch(
  () => store.profile,
  (profile) => {
    if (profile) {
      name.value = profile.name;
      email.value = profile.email;
    }
  },
  { immediate: true }
);

onMounted(() => {
  store.asyncGetProfile();
});

async function onSubmitProfile() {
  if (!name.value.trim() || !email.value.trim()) {
    showErrorDialog("Nama dan email wajib diisi");
    return;
  }

  await store.asyncChangeProfile(name.value.trim(), email.value.trim());
}

async function onChangePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) {
    return;
  }

  await store.asyncChangePhoto(files[0]);
  input.value = "";
}

async function onSubmitPassword() {
  if (!password.value || !newPassword.value) {
    showErrorDialog("Kata sandi lama dan kata sandi baru wajib diisi");
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    showErrorDialog("Konfirmasi kata sandi baru tidak cocok");
    return;
  }

  await store.asyncChangePassword(
    password.value,
    newPassword.value,
    confirmPassword.value
  );

  if (store.isPasswordChanged) {
    resetPassword();
    resetNewPassword();
    resetConfirmPassword();
  }
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600";
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-6">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900">Profil Saya</h1>
      <p class="text-sm text-slate-600">Kelola informasi akun, foto, dan kata sandi Anda.</p>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-4">
        <img
          v-if="photoUrl"
          :src="photoUrl"
          alt="Foto profil"
          class="h-20 w-20 rounded-full object-cover" />
        <span
          v-else
          class="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600">
          {{ initial }}
        </span>
        <div>
          <label
            for="profile-photo"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            <Camera class="h-4 w-4" />
            {{ store.isPhotoChange ? "Mengunggah..." : "Ganti Foto" }}
          </label>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            class="hidden"
            data-testid="photo-input"
            @change="onChangePhoto" />
        </div>
      </div>
    </div>

    <form
      class="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      data-testid="profile-form"
      @submit.prevent="onSubmitProfile">
      <h2 class="font-bold text-slate-900">Informasi Akun</h2>
      <div>
        <label for="profile-name" :class="labelClass">Nama</label>
        <input
          id="profile-name"
          type="text"
          :class="inputClass"
          :value="name"
          @input="onChangeName" />
      </div>
      <div>
        <label for="profile-email" :class="labelClass">Email</label>
        <input
          id="profile-email"
          type="email"
          :class="inputClass"
          :value="email"
          @input="onChangeEmail" />
      </div>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        :disabled="store.isProfileChange">
        <Save class="h-4 w-4" />
        {{ store.isProfileChange ? "Menyimpan..." : "Simpan Perubahan" }}
      </button>
    </form>

    <form
      class="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      data-testid="password-form"
      @submit.prevent="onSubmitPassword">
      <h2 class="font-bold text-slate-900">Ubah Kata Sandi</h2>
      <div>
        <label for="profile-password" :class="labelClass">Kata Sandi Lama</label>
        <input
          id="profile-password"
          type="password"
          :class="inputClass"
          :value="password"
          @input="onChangePassword" />
      </div>
      <div>
        <label for="profile-new-password" :class="labelClass">Kata Sandi Baru</label>
        <input
          id="profile-new-password"
          type="password"
          :class="inputClass"
          :value="newPassword"
          @input="onChangeNewPassword" />
      </div>
      <div>
        <label for="profile-confirm-password" :class="labelClass">
          Konfirmasi Kata Sandi Baru
        </label>
        <input
          id="profile-confirm-password"
          type="password"
          :class="inputClass"
          :value="confirmPassword"
          @input="onChangeConfirmPassword" />
      </div>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        :disabled="store.isPasswordChange">
        <KeyRound class="h-4 w-4" />
        {{ store.isPasswordChange ? "Menyimpan..." : "Ubah Kata Sandi" }}
      </button>
    </form>
  </section>
</template>