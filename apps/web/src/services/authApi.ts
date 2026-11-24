export type UserRole = "Admin" | "Doctor" | "Receptionist";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data as T;
}

export const authApi = {
  login(values: LoginInput) {
    return request<{ message: string; user: User }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(values),
      }
    );
  },

  me() {
    return request<{ user: User }>("/api/auth/me");
  },

  logout() {
    return request<{ message: string }>(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );
  },
};