
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
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

import {
  doctorsApi,
  type Doctor,
  type DoctorInput,
  type DoctorStatus,
} from "../services/doctorsApi";

import {
  departmentsApi,
  type Department,
} from "../services/departmentsApi";

const { Title, Text } = Typography;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong";
}

export default function Doctors() {
  const [form] = Form.useForm<DoctorInput>();
  const [messageApi, contextHolder] = message.useMessage();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specialisationFilter, setSpecialisationFilter] =
    useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [doctorData, departmentData] = await Promise.all([
        doctorsApi.getAll(),
        departmentsApi.getAll(),
      ]);

      setDoctors(doctorData);
      setDepartments(departmentData);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [doctorData, departmentData] = await Promise.all([
          doctorsApi.getAll(),
          departmentsApi.getAll(),
        ]);

        if (!cancelled) {
          setDoctors(doctorData);
          setDepartments(departmentData);
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

  const specialisations = useMemo(
    () =>
      Array.from(
        new Set(doctors.map((doctor) => doctor.specialisation))
      ).sort(),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSearch = [
        doctor.name,
        doctor.specialisation,
        doctor.department,
        doctor.email,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesSpecialisation =
        !specialisationFilter ||
        doctor.specialisation === specialisationFilter;

      return matchesSearch && matchesSpecialisation;
    });
  }, [doctors, search, specialisationFilter]);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();

    form.setFieldsValue({
      name: "",
      specialisation: "",
      departmentId: undefined,
      email: "",
      phone: "",
      status: "Available",
    });

    setModalOpen(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditing(doctor);

    form.setFieldsValue({
      name: doctor.name,
      specialisation: doctor.specialisation,
      departmentId: doctor.departmentId,
      email: doctor.email,
      phone: doctor.phone,
      status: doctor.status,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSave = async () => {
    let values: DoctorInput;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        const updated = await doctorsApi.update(editing.id, values);

        setDoctors((previous) =>
          previous.map((doctor) =>
            doctor.id === updated.id ? updated : doctor
          )
        );

        messageApi.success("Doctor updated successfully");
      } else {
        const created = await doctorsApi.create(values);

        setDoctors((previous) => [created, ...previous]);

        messageApi.success("Doctor added successfully");
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await doctorsApi.delete(id);

      setDoctors((previous) =>
        previous.filter((doctor) => doctor.id !== id)
      );

      messageApi.success("Doctor deleted successfully");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Doctor> = [
    {
      title: "Doctor",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Specialisation",
      dataIndex: "specialisation",
      key: "specialisation",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Availability",
      dataIndex: "status",
      key: "status",
      render: (status: DoctorStatus) => (
        <Tag color={status === "Available" ? "green" : "red"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, doctor) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={`Edit ${doctor.name}`}
            onClick={() => openEditModal(doctor)}
          />

          <Popconfirm
            title="Delete doctor?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(doctor.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === doctor.id}
              aria-label={`Delete ${doctor.name}`}
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
          Doctor Management
        </Title>
        <Text type="secondary">
          Manage doctors and their hospital departments.
        </Text>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Space wrap>
            <Input
              placeholder="Search doctors"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
              style={{ width: 260 }}
            />

            <Select
              placeholder="All specialisations"
              allowClear
              value={specialisationFilter}
              onChange={setSpecialisationFilter}
              style={{ width: 200 }}
              options={specialisations.map((item) => ({
                label: item,
                value: item,
              }))}
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
              disabled={departments.length === 0}
            >
              Add Doctor
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            title="Unable to load doctors"
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

        <Spin spinning={loading}>
          <Table<Doctor>
            rowKey="id"
            columns={columns}
            dataSource={filteredDoctors}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 1050 }}
          />
        </Spin>
      </Card>

      <Modal
        title={editing ? "Edit Doctor" : "Add Doctor"}
        open={modalOpen}
        onOk={() => void handleSave()}
        onCancel={closeModal}
        okText={editing ? "Save Changes" : "Add Doctor"}
        okButtonProps={{ loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        destroyOnHidden
      >
        <Form<DoctorInput>
          form={form}
          layout="vertical"
          className="mt-5"
        >
          <Form.Item
            label="Doctor Name"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter doctor name",
              },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>

          <Form.Item
            label="Specialisation"
            name="specialisation"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter specialisation",
              },
            ]}
          >
            <Input maxLength={100} placeholder="e.g. Cardiology" />
          </Form.Item>

          <Form.Item
            label="Department"
            name="departmentId"
            rules={[
              {
                required: true,
                message: "Select a department",
              },
            ]}
          >
            <Select
              placeholder="Select department"
              options={departments
                .filter(
                  (department) =>
                    department.status === "Active" ||
                    department.id === editing?.departmentId
                )
                .map((department) => ({
                  label: department.name,
                  value: department.id,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Enter email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { required: true, message: "Enter phone number" },
            ]}
          >
            <Input maxLength={30} />
          </Form.Item>

          <Form.Item
            label="Availability"
            name="status"
            rules={[
              { required: true, message: "Select availability" },
            ]}
          >
            <Select
              options={[
                { value: "Available", label: "Available" },
                { value: "Unavailable", label: "Unavailable" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
