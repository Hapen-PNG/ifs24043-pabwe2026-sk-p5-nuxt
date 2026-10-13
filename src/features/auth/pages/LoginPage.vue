<script setup lang="ts">
import { useRouter } from "vue-router";
import { LogIn, Lock, Mail } from "lucide-vue-next";
import { useInput } from "../../../hooks/useInput";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import { useAuthStore } from "../states/authStore";

const router = useRouter();
const auth = useAuthStore();

const [email, onChangeEmail] = useInput("");
const [password, onChangePassword] = useInput("");

async function onSubmit() {
  if (!email.value.trim() || !password.value) {
    showErrorDialog("Email dan kata sandi wajib diisi");
    return;
  }

  await auth.asyncLogin(email.value.trim(), password.value);

  if (auth.isAuthLoggedIn) {
    router.push("/");
  }
}
</script>

<template>
  <form class="space-y-4" data-testid="login-form" @submit.prevent="onSubmit">
    <div>
      <label
        for="login-email-input"
        class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
        Alamat Email
      </label>
      <div class="relative">
        <Mail class="absolute left-3 top-3 h-4 w-4 text-slate-600" />
        <input
          id="login-email-input"
          type="email"
          placeholder="nama@email.com"
          class="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          :value="email"
          @input="onChangeEmail" />
      </div>
    </div>

    <div>
      <label
        for="login-password-input"
        class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
        Kata Sandi
      </label>
      <div class="relative">
        <Lock class="absolute left-3 top-3 h-4 w-4 text-slate-600" />
        <input
          id="login-password-input"
          type="password"
          placeholder="••••••••"
          class="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          :value="password"
          @input="onChangePassword" />
      </div>
    </div>

    <button
      id="login-submit-button"
      type="submit"
      class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60"
      :disabled="auth.isAuthLogin">
      <LogIn class="h-4 w-4" />
      {{ auth.isAuthLogin ? "Memproses..." : "Masuk Sekarang" }}
    </button>
  </form>
</template>
