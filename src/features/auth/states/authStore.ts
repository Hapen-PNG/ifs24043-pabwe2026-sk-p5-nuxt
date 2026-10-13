import { defineStore } from "pinia";
import { postLogin, postLogout, postRegister } from "../api/authApi";
import {
  getAccessToken,
  getErrorMessage,
  putAccessToken,
  removeAccessToken,
} from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface AuthState {
  token: string | null;
  isAuthLogin: boolean;
  isAuthLoggedIn: boolean;
  isAuthRegister: boolean;
  isAuthRegistered: boolean;
  isAuthLogout: boolean;
  isAuthLoggedOut: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: getAccessToken(),
    isAuthLogin: false,
    isAuthLoggedIn: false,
    isAuthRegister: false,
    isAuthRegistered: false,
    isAuthLogout: false,
    isAuthLoggedOut: false,
  }),
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
  },
  actions: {
    async asyncLogin(email: string, password: string) {
      this.isAuthLogin = true;
      this.isAuthLoggedIn = false;

      const response = await postLogin(email, password);
      this.isAuthLogin = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.token = response.data.token;
      putAccessToken(response.data.token);
      this.isAuthLoggedIn = true;
    },

    async asyncRegister(name: string, email: string, password: string) {
      this.isAuthRegister = true;
      this.isAuthRegistered = false;

      const response = await postRegister(name, email, password);
      this.isAuthRegister = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isAuthRegistered = true;
      showSuccessDialog(response.message);
    },

    async asyncLogout() {
      this.isAuthLogout = true;
      this.isAuthLoggedOut = false;

      // Token dicabut di server; sesi lokal tetap dibersihkan apa pun hasilnya.
      await postLogout();

      removeAccessToken();
      this.token = null;
      this.isAuthLogout = false;
      this.isAuthLoggedOut = true;
    },
  },
});
