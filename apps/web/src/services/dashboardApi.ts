
export type DashboardStats = {
  totalPatients: number;
  totalDoctors: number;
  totalDepartments: number;
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
};

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await fetch(
      `${API_URL}/api/dashboard/stats`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load dashboard statistics (${response.status})`
      );
    }

    return response.json() as Promise<DashboardStats>;
  },
};
