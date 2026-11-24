
export type PatientStatus = "Active" | "Inactive";

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

export type PatientInput = Pick<
  Patient,
  "name" | "age" | "gender" | "phone" | "status"
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
      // Keep the default error message.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const patientsApi = {
  getAll: () => request<Patient[]>("/api/patients"),

  create: (data: PatientInput) =>
    request<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: PatientInput) =>
    request<Patient>(`/api/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/patients/${id}`, {
      method: "DELETE",
    }),
};
