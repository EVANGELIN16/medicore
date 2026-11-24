
export type DepartmentStatus = "Active" | "Inactive";

export type Department = {
  id: string;
  name: string;
  head: string;
  location: string;
  staffCount: number;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentInput = Pick<
  Department,
  "name" | "head" | "location" | "staffCount" | "status"
>;

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data.message === "string") {
        message = data.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const departmentsApi = {
  getAll: () =>
    request<Department[]>("/api/departments"),

  create: (data: DepartmentInput) =>
    request<Department>("/api/departments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DepartmentInput) =>
    request<Department>(`/api/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/departments/${id}`, {
      method: "DELETE",
    }),
};
