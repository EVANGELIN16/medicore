
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import {
  appointmentsApi,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "../services/appointmentsApi";

import {
  patientsApi,
  type Patient,
} from "../services/patientsApi";

import {
  doctorsApi,
  type Doctor,
} from "../services/doctorsApi";

const { Title, Text } = Typography;

type AppointmentFormValues = {
  patientId: string;
  doctorId: string;
  appointmentDate: Dayjs;
  status: AppointmentStatus;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong";
}

function formatAppointmentDate(value: string): string {
  return dayjs(value).format("DD MMM YYYY, hh:mm A");
}

export default function Appointments() {
  const [form] = Form.useForm<AppointmentFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AppointmentStatus | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] =
    useState<Appointment | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [appointmentData, patientData, doctorData] =
          await Promise.all([
            appointmentsApi.getAll(),
            patientsApi.getAll(),
            doctorsApi.getAll(),
          ]);

        if (!cancelled) {
          setAppointments(appointmentData);
          setPatients(patientData);
          setDoctors(doctorData);
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

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [appointmentData, patientData, doctorData] =
        await Promise.all([
          appointmentsApi.getAll(),
          patientsApi.getAll(),
          doctorsApi.getAll(),
        ]);

      setAppointments(appointmentData);
      setPatients(patientData);
      setDoctors(doctorData);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch = [
        appointment.patientName,
        appointment.doctorName,
        formatAppointmentDate(
          appointment.appointmentDate
        ),
      ].some((value) =>
        value.toLowerCase().includes(query)
      );

      const matchesStatus =
        !statusFilter ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();

    form.setFieldsValue({
      status: "Scheduled",
    });

    setModalOpen(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditing(appointment);

    form.setFieldsValue({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: dayjs(
        appointment.appointmentDate
      ),
      status: appointment.status,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  async function handleSave() {
    let values: AppointmentFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload: AppointmentInput = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      appointmentDate:
        values.appointmentDate.toISOString(),
      status: values.status,
    };

    setSaving(true);

    try {
      if (editing) {
        const updated = await appointmentsApi.update(
          editing.id,
          payload
        );

        setAppointments((previous) =>
          previous.map((appointment) =>
            appointment.id === updated.id
              ? updated
              : appointment
          )
        );

        messageApi.success(
          "Appointment updated successfully"
        );
      } else {
        const created = await appointmentsApi.create(
          payload
        );

        setAppointments((previous) =>
          [...previous, created].sort(
            (a, b) =>
              new Date(a.appointmentDate).getTime() -
              new Date(b.appointmentDate).getTime()
          )
        );

        messageApi.success(
          "Appointment booked successfully"
        );
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      await appointmentsApi.delete(id);

      setAppointments((previous) =>
        previous.filter(
          (appointment) => appointment.id !== id
        )
      );

      messageApi.success("Appointment deleted");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  const statusColors: Record<
    AppointmentStatus,
    string
  > = {
    Scheduled: "blue",
    Completed: "green",
    Cancelled: "red",
  };

  const columns: TableColumnsType<Appointment> = [
    {
      title: "Patient",
      dataIndex: "patientName",
      key: "patientName",
      sorter: (a, b) =>
        a.patientName.localeCompare(b.patientName),
    },
    {
      title: "Doctor",
      dataIndex: "doctorName",
      key: "doctorName",
    },
    {
      title: "Date & Time",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (value: string) =>
        formatAppointmentDate(value),
      sorter: (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AppointmentStatus) => (
        <Tag color={statusColors[status]}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_, appointment) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={`Edit appointment for ${appointment.patientName}`}
            onClick={() =>
              openEditModal(appointment)
            }
          />

          <Popconfirm
            title="Delete appointment?"
            description="This permanently removes the appointment."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() =>
              void handleDelete(appointment.id)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={
                deletingId === appointment.id
              }
              aria-label={`Delete appointment for ${appointment.patientName}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {contextHolder}

      <div>
        <Title level={3} className="mb-1!">
          Appointment Management
        </Title>
        <Text type="secondary">
          Schedule and manage hospital appointments.
        </Text>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Space wrap>
            <Input
              placeholder="Search appointments"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              allowClear
              style={{ width: 260 }}
            />

            <Select
              placeholder="All statuses"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={[
                {
                  value: "Scheduled",
                  label: "Scheduled",
                },
                {
                  value: "Completed",
                  label: "Completed",
                },
                {
                  value: "Cancelled",
                  label: "Cancelled",
                },
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadData()}
            >
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              disabled={
                patients.length === 0 ||
                doctors.length === 0
              }
            >
              Book Appointment
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            title="Unable to load appointments"
            description={error}
            className="mb-4"
            action={
              <Button
                size="small"
                onClick={() => void loadData()}
              >
                Retry
              </Button>
            }
          />
        )}

        <Table<Appointment>
          rowKey="id"
          columns={columns}
          dataSource={filteredAppointments}
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={
          editing
            ? "Edit Appointment"
            : "Book Appointment"
        }
        open={modalOpen}
        onOk={() => void handleSave()}
        onCancel={closeModal}
        okText={
          editing
            ? "Save Changes"
            : "Book Appointment"
        }
        okButtonProps={{ loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        destroyOnHidden
      >
        <Form<AppointmentFormValues>
          form={form}
          layout="vertical"
          className="mt-5"
        >
          <Form.Item
            label="Patient"
            name="patientId"
            rules={[
              {
                required: true,
                message: "Select a patient",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select patient"
              options={patients
                .filter(
                  (patient) =>
                    patient.status === "Active" ||
                    patient.id === editing?.patientId
                )
                .map((patient) => ({
                  label: patient.name,
                  value: patient.id,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="Doctor"
            name="doctorId"
            rules={[
              {
                required: true,
                message: "Select a doctor",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select doctor"
              options={doctors
                .filter(
                  (doctor) =>
                    doctor.status === "Available" ||
                    doctor.id === editing?.doctorId
                )
                .map((doctor) => ({
                  label: `${doctor.name} - ${doctor.specialisation}`,
                  value: doctor.id,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="Appointment Date & Time"
            name="appointmentDate"
            rules={[
              {
                required: true,
                message: "Select appointment date and time",
              },
            ]}
          >
            <DatePicker
              showTime={{
                format: "HH:mm",
                minuteStep: 15,
              }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              disabledDate={(date) =>
                date.isBefore(dayjs(), "day")
              }
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[
              {
                required: true,
                message: "Select status",
              },
            ]}
          >
            <Select
              options={[
                {
                  value: "Scheduled",
                  label: "Scheduled",
                },
                {
                  value: "Completed",
                  label: "Completed",
                },
                {
                  value: "Cancelled",
                  label: "Cancelled",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
