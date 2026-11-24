
import { useCallback, useEffect, useMemo, useState } from "react";
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
  departmentsApi,
  type Department,
  type DepartmentInput,
  type DepartmentStatus,
} from "../services/departmentsApi";

const { Title, Text } = Typography;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong";
}

export default function Departments() {
  const [form] = Form.useForm<DepartmentInput>();
  const [messageApi, contextHolder] = message.useMessage();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);


useEffect(() => {
  let cancelled = false;

  async function fetchDepartments() {
    try {
      const data = await departmentsApi.getAll();

      if (!cancelled) {
        setDepartments(data);
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

  void fetchDepartments();

  return () => {
    cancelled = true;
  };
}, []);


  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments.filter((department) =>
      [
        department.id,
        department.name,
        department.head,
        department.location,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [departments, search]);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();

    form.setFieldsValue({
      name: "",
      head: "",
      location: "",
      staffCount: 0,
      status: "Active",
    });

    setModalOpen(true);
  };

  const openEditModal = (department: Department) => {
    setEditing(department);

    form.setFieldsValue({
      name: department.name,
      head: department.head,
      location: department.location,
      staffCount: department.staffCount,
      status: department.status,
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
    let values: DepartmentInput;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        const updated = await departmentsApi.update(
          editing.id,
          values
        );

        setDepartments((previous) =>
          previous.map((department) =>
            department.id === updated.id ? updated : department
          )
        );

        messageApi.success("Department updated successfully");
      } else {
        const created = await departmentsApi.create(values);

        setDepartments((previous) => [created, ...previous]);

        messageApi.success("Department added successfully");
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
      await departmentsApi.delete(id);

      setDepartments((previous) =>
        previous.filter((department) => department.id !== id)
      );

      messageApi.success("Department deleted successfully");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Department> = [
    {
      title: "Department",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Head of Department",
      dataIndex: "head",
      key: "head",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Staff",
      dataIndex: "staffCount",
      key: "staffCount",
      sorter: (a, b) => a.staffCount - b.staffCount,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: DepartmentStatus) => (
        <Tag color={status === "Active" ? "green" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, department) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={`Edit ${department.name}`}
            onClick={() => openEditModal(department)}
          />

          <Popconfirm
            title="Delete department?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(department.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === department.id}
              aria-label={`Delete ${department.name}`}
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
          Department Management
        </Title>
        <Text type="secondary">
          Manage departments using the MediCore PostgreSQL database.
        </Text>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Input
            placeholder="Search departments"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
            style={{ maxWidth: 320 }}
          />

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void loadDepartments()}
              loading={loading}
            >
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Add Department
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            title="Unable to load departments"
            description={error}
            className="mb-4"
            action={
              <Button
                size="small"
                onClick={() => void loadDepartments()}
              >
                Retry
              </Button>
            }
          />
        )}

        <Spin spinning={loading}>
          <Table<Department>
            rowKey="id"
            columns={columns}
            dataSource={filteredDepartments}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 850 }}
          />
        </Spin>
      </Card>

      <Modal
        title={editing ? "Edit Department" : "Add Department"}
        open={modalOpen}
        onOk={() => void handleSave()}
        onCancel={closeModal}
        okText={editing ? "Save Changes" : "Add Department"}
        okButtonProps={{ loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        destroyOnHidden
      >
        <Form<DepartmentInput>
          form={form}
          layout="vertical"
          className="mt-5"
        >
          <Form.Item
            label="Department Name"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter department name",
              },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            label="Head of Department"
            name="head"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter department head",
              },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>

          <Form.Item
            label="Location"
            name="location"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter location",
              },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>

          <Form.Item
            label="Staff Count"
            name="staffCount"
            rules={[
              {
                required: true,
                message: "Enter staff count",
              },
            ]}
          >
            <InputNumber
              min={0}
              max={10000}
              precision={0}
              className="w-full!"
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
