import { apiPost } from "../../../helpers/apiHelper";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginData {
  user: AuthUser;
  token: string;
}

export const postLogin = (email: string, password: string) =>
  apiPost<LoginData>("/auth/login", { email, password });

export const postRegister = (name: string, email: string, password: string) =>
  apiPost<null>("/auth/register", { name, email, password });

export const postLogout = () => apiPost<null>("/auth/logout");
