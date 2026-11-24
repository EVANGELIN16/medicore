
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Layout,
  Menu,
  Button,
  Avatar,
  Typography,
  Grid,
  Dropdown,
  Tag,
  message,
} from "antd";

import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { useAuth } from "../../context/useAuth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

type DashboardLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/patients",
    icon: <UserOutlined />,
    label: "Patients",
  },
  {
    key: "/appointments",
    icon: <CalendarOutlined />,
    label: "Appointments",
  },
  {
    key: "/doctors",
    icon: <TeamOutlined />,
    label: "Doctors",
  },
  {
    key: "/departments",
    icon: <MedicineBoxOutlined />,
    label: "Departments",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
  },
];

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const screens = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  const isMobile = !screens.md;

  const sidebarCollapsed = isMobile
    ? !mobileOpen
    : collapsed;

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
      message.success("Logged out successfully");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Unable to logout"
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function toggleSidebar() {
    if (isMobile) {
      setMobileOpen((previous) => !previous);
    } else {
      setCollapsed((previous) => !previous);
    }
  }

  return (
    <Layout
      className="min-h-screen"
      style={{ minHeight: "100vh" }}
    >
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        collapsedWidth={isMobile ? 0 : 80}
        width={240}
        theme="dark"
      >
        <div className="flex h-16 items-center justify-center gap-2 text-white">
          <MedicineBoxOutlined className="text-2xl" />

          {!sidebarCollapsed && (
            <span className="text-xl font-bold">
              MediCore
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            setMobileOpen(false);
          }}
        />
      </Sider>

      <Layout
        className="min-w-0"
        style={{ minHeight: "100vh" }}
      >
        <Header
          className="flex items-center justify-between gap-2 shadow-sm"
          style={{
            background: "#ffffff",
            height: 64,
            paddingInline: 20,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="text"
              aria-label={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              icon={
                sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={toggleSidebar}
            />

            <Text
              strong
              ellipsis
              className="text-base md:text-lg"
            >
              Hospital Administration
            </Text>
          </div>

          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "profile",
                  label: user?.email,
                  disabled: true,
                },
                {
                  type: "divider",
                },
                {
                  key: "settings",
                  icon: <SettingOutlined />,
                  label: "Settings",
                  onClick: () => navigate("/settings"),
                },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Logout",
                  danger: true,
                  disabled: loggingOut,
                  onClick: () => void handleLogout(),
                },
              ],
            }}
          >
            <Button
              type="text"
              loading={loggingOut}
              className="flex h-auto items-center gap-2"
            >
              <Avatar icon={<UserOutlined />} />

              <span className="hidden text-left sm:inline-block">
                <Text strong className="block">
                  {user?.name}
                </Text>

                <Tag color="blue">{user?.role}</Tag>
              </span>

              <DownOutlined />
            </Button>
          </Dropdown>
        </Header>

        <Content
          className="min-w-0 p-4 md:p-6"
          style={{
            background: "#f5f7fb",
            flex: 1,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
