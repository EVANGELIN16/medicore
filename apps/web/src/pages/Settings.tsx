
import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  MedicineBoxOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type HospitalSettings = {
  hospitalName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
};

const defaultHospitalSettings: HospitalSettings = {
  hospitalName: "MediCore Hospital",
  email: "admin@medicore.example",
  phone: "07123456789",
  address: "London, United Kingdom",
  timezone: "Europe/London",
};

export default function Settings() {
  const [form] = Form.useForm<HospitalSettings>();
  const [messageApi, contextHolder] = message.useMessage();

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [appointmentReminders, setAppointmentReminders] =
    useState(true);

  const [darkMode, setDarkMode] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Temporary frontend-only settings.
      console.log("Hospital settings:", values);

      messageApi.success("Settings saved for this session");
    } catch {
      // Ant Design displays validation errors.
    }
  };

  return (
    <div className="space-y-6">
      {contextHolder}

      <div>
        <Title level={3} className="mb-1!">
          Settings
        </Title>
        <Text type="secondary">
          Manage hospital information and application preferences.
        </Text>
      </div>

      <Card
        title={
          <Space>
            <MedicineBoxOutlined />
            Hospital Information
          </Space>
        }
      >
        <Form<HospitalSettings>
          form={form}
          layout="vertical"
          initialValues={defaultHospitalSettings}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Hospital Name"
                name="hospitalName"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Enter hospital name",
                  },
                ]}
              >
                <Input placeholder="Hospital name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Enter email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input placeholder="Hospital email" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: "Enter phone number" },
                  {
                    pattern: /^\+?[0-9 ]{10,16}$/,
                    message: "Enter a valid phone number",
                  },
                ]}
              >
                <Input placeholder="Contact number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Timezone"
                name="timezone"
                rules={[
                  { required: true, message: "Select timezone" },
                ]}
              >
                <Select
                  options={[
                    {
                      value: "Europe/London",
                      label: "Europe/London",
                    },
                    {
                      value: "Asia/Kolkata",
                      label: "Asia/Kolkata",
                    },
                    {
                      value: "UTC",
                      label: "UTC",
                    },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Hospital Address"
                name="address"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Enter hospital address",
                  },
                ]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            Save Hospital Information
          </Button>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <BellOutlined />
            Notification Preferences
          </Space>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <Text strong>Email Notifications</Text>
            <div>
              <Text type="secondary">
                Receive hospital system notifications.
              </Text>
            </div>
          </div>

          <Switch
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
        </div>

        <Divider />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Text strong>Appointment Reminders</Text>
            <div>
              <Text type="secondary">
                Enable appointment reminder preferences.
              </Text>
            </div>
          </div>

          <Switch
            checked={appointmentReminders}
            onChange={setAppointmentReminders}
          />
        </div>
      </Card>

      <Card
        title={
          <Space>
            <SettingOutlined />
            Appearance
          </Space>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <Text strong>Dark Mode Preference</Text>
            <div>
              <Text type="secondary">
                Store your preferred appearance for this session.
              </Text>
            </div>
          </div>

          <Switch
            checked={darkMode}
            onChange={(checked) => {
              setDarkMode(checked);
              messageApi.info(
                "Preference updated. Theme switching will be added later."
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
}
