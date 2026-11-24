
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
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

import {
  patientsApi,
  type Patient,
  type PatientInput,
  type PatientStatus,
} from "../services/patientsApi";

const { Title, Text } = Typography;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong";
}

export default function Patients() {
  const [form] = Form.useForm<PatientInput>();
  const [messageApi, contextHolder] = message.useMessage();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PatientStatus | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPatients() {
      try {
        const data = await patientsApi.getAll();

        if (!cancelled) {
          setPatients(data);
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

    void fetchPatients();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadPatients() {
    setLoading(true);
    setError(null);

    try {
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesSearch = [
        patient.name,
        patient.gender,
        patient.phone,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        !statusFilter || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "Active" });
    setModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditing(patient);

    form.setFieldsValue({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      status: patient.status,
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
    let values: PatientInput;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        const updated = await patientsApi.update(
          editing.id,
          values
        );

        setPatients((previous) =>
          previous.map((patient) =>
            patient.id === updated.id ? updated : patient
          )
        );

        messageApi.success("Patient updated successfully");
      } else {
        const created = await patientsApi.create(values);

        setPatients((previous) => [created, ...previous]);

        messageApi.success("Patient added successfully");
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
      await patientsApi.delete(id);

      setPatients((previous) =>
        previous.filter((patient) => patient.id !== id)
      );

      messageApi.success("Patient deleted successfully");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  const columns: TableColumnsType<Patient> = [
    {
      title: "Patient Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: PatientStatus) => (
        <Tag color={status === "Active" ? "green" : "red"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_, patient) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={`Edit ${patient.name}`}
            onClick={() => openEditModal(patient)}
          />

          <Popconfirm
            title="Delete patient?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleDelete(patient.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === patient.id}
              aria-label={`Delete ${patient.name}`}
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
          Patient Management
        </Title>
        <Text type="secondary">
          Register and manage hospital patients.
        </Text>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Space wrap>
            <Input
              placeholder="Search patients"
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
              style={{ width: 160 }}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadPatients()}
            >
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Add Patient
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            title="Unable to load patients"
            description={error}
            className="mb-4"
            action={
              <Button
                size="small"
                onClick={() => void loadPatients()}
              >
                Retry
              </Button>
            }
          />
        )}

        <Table<Patient>
          rowKey="id"
          columns={columns}
          dataSource={filteredPatients}
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 700 }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Patient" : "Add Patient"}
        open={modalOpen}
        onOk={() => void handleSave()}
        onCancel={closeModal}
        okText={editing ? "Save Changes" : "Add Patient"}
        okButtonProps={{ loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        destroyOnHidden
      >
        <Form<PatientInput>
          form={form}
          layout="vertical"
          className="mt-5"
        >
          <Form.Item
            label="Patient Name"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter patient name",
              },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>

          <Form.Item
            label="Age"
            name="age"
            rules={[
              { required: true, message: "Enter patient age" },
              {
                type: "number",
                min: 0,
                max: 130,
                message: "Age must be between 0 and 130",
              },
            ]}
          >
            <InputNumber
              min={0}
              max={130}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Gender"
            name="gender"
            rules={[
              { required: true, message: "Select gender" },
            ]}
          >
            <Select
              placeholder="Select gender"
              options={[
                { value: "Female", label: "Female" },
                { value: "Male", label: "Male" },
                { value: "Other", label: "Other" },
                {
                  value: "Prefer not to say",
                  label: "Prefer not to say",
                },
              ]}
            />
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
            label="Status"
            name="status"
            rules={[
              { required: true, message: "Select status" },
            ]}
          >
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
