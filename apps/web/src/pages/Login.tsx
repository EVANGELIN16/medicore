import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Spin,
  Typography,
} from "antd";

import {
  MailOutlined,
  LockOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";

import { useAuth } from "../context/useAuth";
import type { LoginInput } from "../services/authApi";

const { Title, Text } = Typography;

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(values: LoginInput) {
    setSubmitting(true);
    setError(null);

    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to login"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "#f0f4f9" }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <div className="mb-6 text-center">
          <MedicineBoxOutlined
            style={{ fontSize: 48, color: "#001529" }}
          />

          <Title level={2}>MediCore</Title>

          <Text type="secondary">
            Hospital Management System
          </Text>
        </div>

        <Title level={4}>Welcome back</Title>

        <Text type="secondary">
          Sign in to access your workspace.
        </Text>

        {error && (
          <Alert
            className="mt-4"
            type="error"
            showIcon
            title={error}
          />
        )}

        <Form<LoginInput>
          layout="vertical"
          className="mt-6"
          onFinish={handleLogin}
          requiredMark={false}
        >
          <Form.Item
            label="Email address"
            name="email"
            rules={[
              {
                required: true,
                message: "Please enter your email",
              },
              {
                type: "email",
                message: "Enter a valid email",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please enter your password",
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  );
}