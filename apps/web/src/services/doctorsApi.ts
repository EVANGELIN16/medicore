
export type DoctorStatus = "Available" | "Unavailable";

export type Doctor = {
  id: string;
  name: string;
  specialisation: string;
  departmentId: string;
  department: string;
  email: string;
  phone: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
};

export type DoctorInput = Pick<
  Doctor,
  | "name"
  | "specialisation"
  | "departmentId"
  | "email"
  | "phone"
  | "status"
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
    let errorMessage = `Request failed (${response.status})`;

    try {
      const data: { message?: string } = await response.json();

      if (typeof data.message === "string") {
        errorMessage = data.message;
      }
    } catch {
      // Use the default error message.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const doctorsApi = {
  getAll: () =>
    request<Doctor[]>("/api/doctors"),

  create: (data: DoctorInput) =>
    request<Doctor>("/api/doctors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DoctorInput) =>
    request<Doctor>(`/api/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/doctors/${id}`, {
      method: "DELETE",
    }),
};
