
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  CalendarOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Pie } from "@ant-design/plots";
import dayjs from "dayjs";

import {
  dashboardApi,
  type DashboardStats,
} from "../services/dashboardApi";

import {
  appointmentsApi,
  type Appointment,
  type AppointmentStatus,
} from "../services/appointmentsApi";

const { Title, Text } = Typography;

const initialStats: DashboardStats = {
  totalPatients: 0,
  totalDoctors: 0,
  totalDepartments: 0,
  totalAppointments: 0,
  scheduledAppointments: 0,
  completedAppointments: 0,
  cancelledAppointments: 0,
};

const statusColors: Record<AppointmentStatus, string> = {
  Scheduled: "blue",
  Completed: "green",
  Cancelled: "red",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong";
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const [statsData, appointmentsData] = await Promise.all([
          dashboardApi.getStats(),
          appointmentsApi.getAll(),
        ]);

        if (!cancelled) {
          setStats(statsData);
          setAppointments(appointmentsData);
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [statsData, appointmentsData] = await Promise.all([
        dashboardApi.getStats(),
        appointmentsApi.getAll(),
      ]);

      setStats(statsData);
      setAppointments(appointmentsData);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const chartData = [
    { type: "Scheduled", value: stats.scheduledAppointments },
    { type: "Completed", value: stats.completedAppointments },
    { type: "Cancelled", value: stats.cancelledAppointments },
  ].filter((item) => item.value > 0);

  const recentAppointments = [...appointments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const columns: TableColumnsType<Appointment> = [
    {
      title: "Patient",
      dataIndex: "patientName",
      key: "patientName",
    },
    {
      title: "Doctor",
      dataIndex: "doctorName",
      key: "doctorName",
    },
    {
      title: "Appointment Date",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (value: string) =>
        dayjs(value).format("DD MMM YYYY, hh:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AppointmentStatus) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="mb-1!">
            Hospital Dashboard
          </Title>
          <Text type="secondary">
            Live overview of your hospital management system.
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void loadDashboard()}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          title="Unable to load dashboard"
          description={error}
          action={
            <Button size="small" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          }
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Total Patients"
                value={stats.totalPatients}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Total Doctors"
                value={stats.totalDoctors}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Departments"
                value={stats.totalDepartments}
                prefix={<MedicineBoxOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Total Appointments"
                value={stats.totalAppointments}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} lg={10}>
            <Card title="Appointment Status Overview">
              {chartData.length > 0 ? (
                <Pie
                  data={chartData}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.6}
                  height={280}
                  legend={{ position: "bottom" }}
                  label={{
                    text: "value",
                    position: "outside",
                  }}
                />
              ) : (
                <Empty description="No appointments yet" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title="Appointment Summary">
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <Statistic
                    title="Scheduled"
                    value={stats.scheduledAppointments}
                    valueStyle={{ color: "#1677ff" }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Completed"
                    value={stats.completedAppointments}
                    valueStyle={{ color: "#389e0d" }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Cancelled"
                    value={stats.cancelledAppointments}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Card title="Recently Created Appointments" className="mt-4">
          <Table<Appointment>
            rowKey="id"
            columns={columns}
            dataSource={recentAppointments}
            pagination={false}
            scroll={{ x: 650 }}
            locale={{
              emptyText: "No appointments available",
            }}
          />
        </Card>
      </Spin>

      <Text type="secondary" className="block text-xs!">
        Statistics are retrieved from PostgreSQL when the page loads
        or when you click Refresh.
      </Text>
    </div>
  );
}

