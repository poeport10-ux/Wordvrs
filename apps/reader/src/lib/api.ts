import { ApiClient } from "@wordvrs/shared";

export const TOKEN_KEY = "wordvrs_reader_token";

export const api = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  getToken: () => localStorage.getItem(TOKEN_KEY),
  onUnauthorized: () => {
    localStorage.removeItem(TOKEN_KEY);
    if (!location.pathname.startsWith("/login")) {
      location.href = "/login";
    }
  },
});
