import { apiGet, apiPost, apiPut } from "../../../helpers/apiHelper";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export const getUsers = () => apiGet<{ users: User[] }>("/users");

export const getProfile = () => apiGet<{ user: User }>("/users/me");

export const putProfile = (name: string, email: string) =>
  apiPut<{ user: User }>("/users/me", { name, email });

export const postPhoto = (photo: File) => {
  const form = new FormData();
  form.append("photo", photo);
  return apiPost<null>("/users/me/photo", form);
};

export const putPassword = (
  password: string,
  newPassword: string,
  newPasswordConfirmation: string
) =>
  apiPut<null>("/users/password", {
    password,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
