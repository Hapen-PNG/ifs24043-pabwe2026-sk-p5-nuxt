import { defineStore } from "pinia";
import {
  getProfile,
  getUsers,
  postPhoto,
  putPassword,
  putProfile,
  type User,
} from "../api/userApi";
import { getErrorMessage, removeAccessToken } from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export type { User };

export interface UsersState {
  users: User[];
  profile: User | null;
  isUsers: boolean;
  isProfile: boolean;
  isProfileChange: boolean;
  isProfileChanged: boolean;
  isPhotoChange: boolean;
  isPhotoChanged: boolean;
  isPasswordChange: boolean;
  isPasswordChanged: boolean;
}

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    users: [],
    profile: null,
    isUsers: false,
    isProfile: false,
    isProfileChange: false,
    isProfileChanged: false,
    isPhotoChange: false,
    isPhotoChanged: false,
    isPasswordChange: false,
    isPasswordChanged: false,
  }),
  actions: {
    async asyncGetUsers() {
      this.isUsers = true;
      const response = await getUsers();
      this.isUsers = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.users = response.data.users;
    },

    async asyncGetProfile(silent = false) {
      this.isProfile = true;
      const response = await getProfile();
      this.isProfile = false;

      if (response.status !== "success") {
        this.profile = null;
        if (silent) {
          removeAccessToken();
          return;
        }
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.profile = response.data.user;
    },

    async asyncChangeProfile(name: string, email: string) {
      this.isProfileChange = true;
      this.isProfileChanged = false;

      const response = await putProfile(name, email);
      this.isProfileChange = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.profile = response.data.user;
      this.isProfileChanged = true;
      showSuccessDialog(response.message);
    },

    async asyncChangePhoto(photo: File) {
      this.isPhotoChange = true;
      this.isPhotoChanged = false;

      const response = await postPhoto(photo);
      this.isPhotoChange = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isPhotoChanged = true;
      showSuccessDialog(response.message);
      await this.asyncGetProfile();
    },

    async asyncChangePassword(
      password: string,
      newPassword: string,
      newPasswordConfirmation: string
    ) {
      this.isPasswordChange = true;
      this.isPasswordChanged = false;

      const response = await putPassword(
        password,
        newPassword,
        newPasswordConfirmation
      );
      this.isPasswordChange = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isPasswordChanged = true;
      showSuccessDialog(response.message);
    },
  },
});