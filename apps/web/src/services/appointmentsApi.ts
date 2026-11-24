
export type AppointmentStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled";

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = Pick<
  Appointment,
  "patientId" | "doctorId" | "appointmentDate" | "status"
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

export const appointmentsApi = {
  getAll: () =>
    request<Appointment[]>("/api/appointments"),

  create: (data: AppointmentInput) =>
    request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: AppointmentInput) =>
    request<Appointment>(`/api/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/appointments/${id}`, {
      method: "DELETE",
    }),
};
